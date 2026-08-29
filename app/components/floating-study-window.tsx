"use client";

import { useEffect, useRef, useState } from "react";
import { requestAi } from "../lib/ai-client";
import { putRecord } from "../lib/indexed-db";
import { lookupDictionary, normalizeSelection, type DictionaryEntry } from "../lib/language-tools";

type SubtitleMode = "english" | "chinese" | "bilingual";

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<SubtitleMode>("bilingual");
  const [english, setEnglish] = useState(initialText);
  const [chinese, setChinese] = useState("");
  const [selection, setSelection] = useState("");
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [message, setMessage] = useState("Paste a short study transcript, then select or type a word.");
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => setEnglish(initialText), [activityId, initialText]);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const nextX = drag.current.originX + event.clientX - drag.current.startX;
    const nextY = drag.current.originY + event.clientY - drag.current.startY;
    setPosition({ x: nextX, y: nextY });
  }

  async function act(action: "define" | "pronounce" | "explain" | "translate" | "save") {
    const normalized = normalizeSelection(selection);
    if (!normalized) { setMessage("Type or paste a word or short phrase first."); return; }
    if (action === "save") {
      try {
        await putRecord("vocabulary", { id: `${activityId}-${Date.now()}`, selection: normalized, sourceActivityId: activityId, context: english.slice(0, 320), createdAt: Date.now() });
        setMessage("Saved to your device vocabulary shelf.");
      } catch { setMessage("Device saving is unavailable in this browser."); }
      return;
    }
    if (action === "define" || action === "pronounce") {
      if (/\s/.test(normalized)) { setMessage("Dictionary lookup works with one word; AI Explain handles phrases when connected."); return; }
      try {
        const result = await lookupDictionary(normalized);
        setEntry(result);
        if (!result) { setMessage("No dictionary entry found."); return; }
        setMessage(result.meanings[0]?.definition ?? "Dictionary result ready.");
        if (action === "pronounce") {
          if (result.audioUrl) void new Audio(result.audioUrl).play();
          else setMessage("This dictionary entry has no audio recording.");
        }
      } catch { setMessage("Dictionary unavailable. Save still works."); }
      return;
    }
    const result = await requestAi<{ text: string }>({ capability: action, selection: normalized, context: english.slice(0, 320) });
    if (!result.ok) { setMessage(`${result.message} · Gemini/千问 gateway can be connected later.`); return; }
    setMessage(result.data.text);
    if (action === "translate" && !chinese) setChinese(result.data.text);
  }

  return (
    <div className="floating-study-root">
      <button className="floating-study-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? "HIDE STUDY WINDOW" : "FLOATING STUDY WINDOW"}
      </button>
      {open && (
        <aside className="floating-study-window" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} aria-label={`Floating study tools for ${title}`}>
          <div className="floating-study-handle" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}>
            <div><span>FLOATING STUDY WINDOW</span><strong>{title}</strong></div>
            <span>MOVE · RESIZE</span>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(false)} aria-label="Close study window">×</button>
          </div>
          <div className="subtitle-mode-switch" aria-label="Subtitle display mode">
            <button className={mode === "english" ? "is-active" : ""} type="button" onClick={() => setMode("english")}>ENGLISH</button>
            <button className={mode === "chinese" ? "is-active" : ""} type="button" onClick={() => setMode("chinese")}>中文</button>
            <button className={mode === "bilingual" ? "is-active" : ""} type="button" onClick={() => setMode("bilingual")}>BILINGUAL</button>
          </div>
          <div className="subtitle-study-copy" data-language-tools-root>
            {(mode === "english" || mode === "bilingual") && <textarea aria-label="English study transcript" value={english} onChange={(event) => setEnglish(event.target.value)} placeholder="Paste a short English study transcript or your own notes…" />}
            {(mode === "chinese" || mode === "bilingual") && <textarea aria-label="Chinese study translation" value={chinese} onChange={(event) => setChinese(event.target.value)} placeholder="中文翻译；接通 AI 后可自动生成，也可以先自己填写。" />}
          </div>
          <label className="floating-word-input"><span>WORD / PHRASE</span><input value={selection} onChange={(event) => { setSelection(event.target.value); setEntry(null); }} placeholder="quietly specific" /></label>
          <div className="floating-tool-actions">
            {(["define", "pronounce", "explain", "translate", "save"] as const).map((action) => <button type="button" key={action} onClick={() => void act(action)}>{action.toUpperCase()}</button>)}
          </div>
          <p className="floating-tool-message" aria-live="polite">{message}</p>
          {entry && <p className="floating-dictionary-result"><strong>{entry.word} {entry.phonetic}</strong><br />{entry.meanings[0]?.definition}</p>}
          <small className="subtitle-honesty">YouTube captions are not copied automatically. This window stores only study text you add on this device.</small>
        </aside>
      )}
    </div>
  );
}
