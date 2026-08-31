"use client";

import { useEffect, useRef, useState } from "react";
import { requestAi } from "../lib/ai-client";
import { putRecord } from "../lib/indexed-db";
import { lookupDictionary, normalizeSelection, type DictionaryEntry } from "../lib/language-tools";
import { clampLauncherPosition, hasLauncherMoved, LAUNCHER_STORAGE_KEY, snapLauncherPosition } from "../lib/floating-companion.mjs";

type SubtitleMode = "english" | "chinese" | "bilingual";
type StudyAction = "define" | "pronounce" | "explain" | "translate" | "save";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const pomeranianIdleSrc = `${publicBasePath}/brand/pomeranian-idle.png`;
const pomeranianWinkSrc = `${publicBasePath}/brand/pomeranian-wink.png`;
const actionLabels: Record<StudyAction, string> = {
  define: "Define",
  pronounce: "Hear",
  explain: "Explain",
  translate: "Translate",
  save: "Save",
};

export function FloatingStudyWindow({
  activityId,
  title,
  initialText = "",
  defaultOpen = false,
}: {
  activityId: string;
  title: string;
  initialText?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [launcherAnimating, setLauncherAnimating] = useState(false);
  const [launcherImageFailed, setLauncherImageFailed] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState({ x: 10, y: 120 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<SubtitleMode>("bilingual");
  const [english, setEnglish] = useState(initialText);
  const [chinese, setChinese] = useState("");
  const [selection, setSelection] = useState("");
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [message, setMessage] = useState("Add context, then select a word or phrase to begin.");
  const [busyAction, setBusyAction] = useState<StudyAction | null>(null);
  const [lastAction, setLastAction] = useState<StudyAction | null>(null);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const launcherTimer = useRef<number | null>(null);
  const launcherDrag = useRef<{ pointerId: number; start: { x: number; y: number }; origin: { x: number; y: number }; moved: boolean } | null>(null);

  useEffect(() => setEnglish(initialText), [activityId, initialText]);
  useEffect(() => {
    new Image().src = pomeranianWinkSrc;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      const saved = JSON.parse(window.localStorage.getItem(LAUNCHER_STORAGE_KEY) ?? "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) setLauncherPosition(clampLauncherPosition(saved, viewport));
      else setLauncherPosition({ x: viewport.width - 54, y: Math.max(90, viewport.height * .34) });
    } catch {
      setLauncherPosition({ x: viewport.width - 54, y: Math.max(90, viewport.height * .34) });
    }
    const keepOnScreen = () => setLauncherPosition((value) => clampLauncherPosition(value, { width: window.innerWidth, height: window.innerHeight }));
    window.addEventListener("resize", keepOnScreen);
    return () => window.removeEventListener("resize", keepOnScreen);
  }, []);
  useEffect(() => () => {
    if (launcherTimer.current != null) window.clearTimeout(launcherTimer.current);
  }, []);

  function toggleStudyWindow() {
    if (launcherAnimating) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLauncherAnimating(true);
    setOpen((value) => !value);
    launcherTimer.current = window.setTimeout(() => {
      setLauncherAnimating(false);
      launcherTimer.current = null;
    }, reduceMotion ? 0 : 520);
  }

  function startLauncherDrag(event: React.PointerEvent<HTMLButtonElement>) {
    launcherDrag.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: launcherPosition, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveLauncher(event: React.PointerEvent<HTMLButtonElement>) {
    const state = launcherDrag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    state.moved ||= hasLauncherMoved(state.start, { x: event.clientX, y: event.clientY });
    if (!state.moved) return;
    setLauncherPosition(clampLauncherPosition({ x: state.origin.x + event.clientX - state.start.x, y: state.origin.y + event.clientY - state.start.y }, { width: window.innerWidth, height: window.innerHeight }));
  }

  function finishLauncherDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const state = launcherDrag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    launcherDrag.current = null;
    if (!state.moved) {
      toggleStudyWindow();
      return;
    }
    setLauncherPosition((value) => {
      const snapped = snapLauncherPosition(value, { width: window.innerWidth, height: window.innerHeight });
      window.localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify(snapped));
      return snapped;
    });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setPosition({
      x: drag.current.originX + event.clientX - drag.current.startX,
      y: drag.current.originY + event.clientY - drag.current.startY,
    });
  }

  function captureTextareaSelection(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    const chosen = normalizeSelection(target.value.slice(target.selectionStart, target.selectionEnd));
    if (!chosen) return;
    setSelection(chosen);
    setEntry(null);
    setMessage(`Selected “${chosen}”. Choose an action below.`);
  }

  async function act(action: StudyAction) {
    const normalized = normalizeSelection(selection);
    if (!normalized) {
      setMessage("Select text above or type a word / phrase first.");
      return;
    }

    setBusyAction(action);
    setLastAction(action);
    setEntry(null);
    setMessage(`${actionLabels[action]}…`);

    try {
      if (action === "save") {
        try {
          await putRecord("vocabulary", {
            id: `${activityId}-${Date.now()}`,
            selection: normalized,
            sourceActivityId: activityId,
            context: english.slice(0, 320),
            createdAt: Date.now(),
          });
          setMessage(`Saved “${normalized}” to your vocabulary shelf.`);
        } catch {
          setMessage("Saving is unavailable in this browser.");
        }
        return;
      }

      if (action === "define" || action === "pronounce") {
        if (/\s/.test(normalized)) {
          setMessage("Define and Hear work best with one word. Use Explain for a phrase.");
          return;
        }
        try {
          const result = await lookupDictionary(normalized);
          setEntry(result);
          if (!result) {
            setMessage("No dictionary entry found. Try Explain instead.");
            return;
          }
          setMessage(result.meanings[0]?.definition ?? "Dictionary result ready.");
          if (action === "pronounce") {
            if (result.audioUrl) {
              await new Audio(result.audioUrl).play();
              setMessage(`Playing pronunciation for “${normalized}”.`);
            } else {
              setMessage("This dictionary entry has no audio recording.");
            }
          }
        } catch {
          setMessage("Dictionary is temporarily unavailable. You can still use Save.");
        }
        return;
      }

      const result = await requestAi<{ text: string }>({ capability: action, selection: normalized, context: english.slice(0, 320) });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(result.data.text);
      if (action === "translate" && !chinese) setChinese(result.data.text);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="floating-study-root" style={{ "--launcher-x": `${launcherPosition.x}px`, "--launcher-y": `${launcherPosition.y}px` } as React.CSSProperties}>
      <button
        className={`floating-study-launcher${launcherAnimating ? " is-animating" : ""}`}
        type="button"
        onPointerDown={startLauncherDrag}
        onPointerMove={moveLauncher}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={() => { launcherDrag.current = null; }}
        aria-expanded={open}
      >
        {!launcherImageFailed
          ? <img src={launcherAnimating ? pomeranianWinkSrc : pomeranianIdleSrc} alt="" aria-hidden="true" draggable={false} onError={() => setLauncherImageFailed(true)} />
          : <span className="pomeranian-fallback" aria-hidden="true">🐶</span>}
        <span className="sr-only">{open ? "Close floating study tools" : "Open floating study tools"}</span>
      </button>

      <aside
        className={`floating-study-window${open ? " is-open" : ""}`}
        style={{ "--window-x": `${position.x}px`, "--window-y": `${position.y}px`, transformOrigin: launcherPosition.x < 400 ? "left bottom" : "right bottom" } as React.CSSProperties}
        aria-hidden={!open}
        inert={!open ? true : undefined}
        aria-label={`Floating study tools for ${title}`}
        aria-busy={!!busyAction}
      >
        <div className="floating-study-handle" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}>
          <div><span>FLOATING STUDY WINDOW</span><strong>{title}</strong></div>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(false)} aria-label="Close study window">×</button>
        </div>

        <div className="subtitle-mode-switch" aria-label="Subtitle display mode">
          <button className={mode === "english" ? "is-active" : ""} type="button" onClick={() => setMode("english")}>ENGLISH</button>
          <button className={mode === "chinese" ? "is-active" : ""} type="button" onClick={() => setMode("chinese")}>中文</button>
          <button className={mode === "bilingual" ? "is-active" : ""} type="button" onClick={() => setMode("bilingual")}>BILINGUAL</button>
        </div>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 1 · CONTEXT</strong><span>Paste notes or a short transcript</span></div>
          <div className="subtitle-study-copy" data-language-tools-root>
            {(mode === "english" || mode === "bilingual") && (
              <textarea
                aria-label="English study transcript"
                value={english}
                onChange={(event) => setEnglish(event.target.value)}
                onSelect={captureTextareaSelection}
                placeholder="Paste English text here…"
              />
            )}
            {(mode === "chinese" || mode === "bilingual") && (
              <textarea
                aria-label="Chinese study translation"
                value={chinese}
                onChange={(event) => setChinese(event.target.value)}
                onSelect={captureTextareaSelection}
                placeholder="中文翻译或笔记…"
              />
            )}
          </div>
        </section>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 2 · TARGET</strong><span>Highlight text above or type it</span></div>
          <label className="floating-word-input">
            <span>Select text above or type a word / phrase</span>
            <input
              value={selection}
              onChange={(event) => { setSelection(event.target.value); setEntry(null); }}
              placeholder="e.g. quietly specific"
              autoComplete="off"
            />
          </label>
        </section>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 3 · ACTION</strong><span>One tap → result below</span></div>
          <div className="floating-tool-actions">
            {(["define", "pronounce", "explain", "translate", "save"] as const).map((action) => (
              <button
                type="button"
                key={action}
                disabled={!!busyAction}
                data-primary={action === "explain" ? "true" : "false"}
                title={action === "define" ? "Dictionary definition" : action === "pronounce" ? "Play dictionary audio" : action === "explain" ? "Explain in context with AI" : action === "translate" ? "Translate with AI" : "Save on this device"}
                onClick={() => void act(action)}
              >
                {busyAction === action ? "…" : actionLabels[action]}
              </button>
            ))}
          </div>
        </section>

        <div className="floating-result-panel" data-state={busyAction ? "working" : "ready"}>
          <div className="floating-result-label"><span>{busyAction ? "WORKING" : "RESULT"}</span><span>{lastAction ? actionLabels[lastAction] : "Ready"}</span></div>
          <p className="floating-tool-message" aria-live="polite">{message}</p>
          {entry && <p className="floating-dictionary-result"><strong>{entry.word} {entry.phonetic}</strong><br />{entry.meanings[0]?.definition}</p>}
        </div>

        <small className="subtitle-honesty">Tip: highlight a word directly inside the text box and it will jump into Step 2. YouTube captions are not copied automatically.</small>
      </aside>
    </div>
  );
}
