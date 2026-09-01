"use client";

import { useEffect, useRef, useState } from "react";
import { requestAi } from "../lib/ai-client";
import type { SourceLanguage, TargetLanguage, VocabularyCard } from "../lib/ai-contracts";
import { deleteRecord, getAllRecords, putRecord } from "../lib/indexed-db";
import type { VocabularyRecord } from "../lib/models";
import { lookupDictionary, normalizeSelection, suggestDictionaryWord, type DictionaryEntry } from "../lib/language-tools";
import { detectSpeechLanguage, pickNaturalVoice, type SpeechLanguage, type VoiceGender } from "../lib/pronunciation";
import { completeVocabularyRecord, normalizeVocabularyKey, sameVocabularySelection, vocabularyRecordId } from "../lib/vocabulary";
import { clampLauncherPosition, hasLauncherMoved, LAUNCHER_STORAGE_KEY, snapLauncherPosition } from "../lib/floating-companion.mjs";

type StudyAction = "define" | "pronounce" | "relations" | "usage" | "translate" | "save";
type SpeechRate = 0.7 | 0.85 | 1 | 1.15;

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const pomeranianIdleSrc = `${publicBasePath}/brand/pomeranian-idle.png`;
const pomeranianWinkSrc = `${publicBasePath}/brand/pomeranian-wink.png`;
const actionLabels: Record<StudyAction, string> = {
  define: "Define",
  pronounce: "Hear",
  relations: "Syn/Ant",
  usage: "Usage",
  translate: "Translate",
  save: "Save",
};
const sourceLanguages: Array<{ value: SourceLanguage; label: string }> = [
  { value: "auto", label: "AUTO DETECT" },
  { value: "en", label: "ENGLISH" },
  { value: "zh-CN", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];
const speechLanguageMap: Record<TargetLanguage, SpeechLanguage> = {
  en: "en-US",
  "zh-CN": "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

function detectedTargetLanguage(text: string): TargetLanguage {
  const detected = detectSpeechLanguage(text);
  if (detected === "zh-CN") return "zh-CN";
  if (detected === "ja-JP") return "ja";
  if (detected === "ko-KR") return "ko";
  return "en";
}

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
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("auto");
  const [sourceText, setSourceText] = useState(initialText);
  const [selection, setSelection] = useState("");
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [message, setMessage] = useState("Paste or type context above, then highlight a word or phrase.");
  const [resultText, setResultText] = useState("");
  const [resultLanguage, setResultLanguage] = useState<SpeechLanguage>("en-US");
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("auto");
  const [busyAction, setBusyAction] = useState<StudyAction | null>(null);
  const [lastAction, setLastAction] = useState<StudyAction | null>(null);
  const windowRef = useRef<HTMLElement | null>(null);
  const targetInputRef = useRef<HTMLInputElement | null>(null);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const launcherTimer = useRef<number | null>(null);
  const launcherDrag = useRef<{ pointerId: number; start: { x: number; y: number }; origin: { x: number; y: number }; moved: boolean } | null>(null);
  const saveCheckSequence = useRef(0);
  const suggestionSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSourceText(initialText);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activityId, initialText]);

  useEffect(() => {
    const normalized = normalizeSelection(selection);
    const requestId = ++saveCheckSequence.current;
    if (!normalized) {
      setSelectionSaved(false);
      return;
    }
    void getAllRecords<VocabularyRecord>("vocabulary")
      .then((records) => {
        if (requestId !== saveCheckSequence.current) return;
        setSelectionSaved(records.some((record) => sameVocabularySelection(record.selection, normalized)));
      })
      .catch(() => {
        if (requestId === saveCheckSequence.current) setSelectionSaved(false);
      });
  }, [selection]);

  useEffect(() => {
    const normalized = normalizeSelection(selection);
    const requestId = ++suggestionSequence.current;
    setSpellingSuggestion(null);
    if (!/^[A-Za-z][A-Za-z'-]{2,}$/u.test(normalized)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void suggestDictionaryWord(normalized, controller.signal).then((suggestion) => {
        if (requestId !== suggestionSequence.current || controller.signal.aborted) return;
        if (suggestion && suggestion.toLocaleLowerCase("en-US") !== normalized.toLocaleLowerCase("en-US")) {
          setSpellingSuggestion(suggestion);
        }
      });
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selection]);

  useEffect(() => {
    new Image().src = pomeranianWinkSrc;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      const saved = JSON.parse(window.localStorage.getItem(LAUNCHER_STORAGE_KEY) ?? "null");
      const next = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
        ? clampLauncherPosition(saved, viewport)
        : { x: viewport.width - 54, y: Math.max(90, viewport.height * .34) };
      window.requestAnimationFrame(() => setLauncherPosition(next));
    } catch {
      window.requestAnimationFrame(() => setLauncherPosition({ x: viewport.width - 54, y: Math.max(90, viewport.height * .34) }));
    }
    const keepOnScreen = () => setLauncherPosition((value) => clampLauncherPosition(value, { width: window.innerWidth, height: window.innerHeight }));
    window.addEventListener("resize", keepOnScreen);
    return () => window.removeEventListener("resize", keepOnScreen);
  }, []);

  useEffect(() => () => {
    if (launcherTimer.current != null) window.clearTimeout(launcherTimer.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function updateSourceText(value: string) {
    setSourceText(value);
  }

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

  function resetWindowSize() {
    const panel = windowRef.current;
    panel?.style.removeProperty("width");
    panel?.style.removeProperty("height");
    setPosition({ x: 0, y: 0 });
    setOpen(true);
    setMessage("Window restored to its default size.");
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

  function pushTextareaSelection(target: HTMLTextAreaElement): string {
    const chosen = normalizeSelection(target.value.slice(target.selectionStart, target.selectionEnd));
    if (!chosen) return "";
    setSelection(chosen);
    setResultText("");
    setMessage(`Word or phrase is ready in Target: “${chosen}”. Choose an action below.`);
    return chosen;
  }

  function captureTextareaSelection(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    pushTextareaSelection(event.currentTarget);
  }

  function captureSelectionOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.currentTarget.selectionStart === event.currentTarget.selectionEnd) return;
    const chosen = pushTextareaSelection(event.currentTarget);
    if (!chosen) return;
    event.preventDefault();
    window.requestAnimationFrame(() => targetInputRef.current?.focus());
  }

  function speechLanguage(language: SourceLanguage | TargetLanguage, text: string): SpeechLanguage {
    return language === "auto" ? detectSpeechLanguage(text) : speechLanguageMap[language];
  }

  function speakText(text: string, language: SpeechLanguage): boolean {
    const clean = text.trim();
    if (!clean || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return false;
    const voice = pickNaturalVoice(window.speechSynthesis.getVoices(), language, voiceGender);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || language;
    utterance.rate = speechRate;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setMessage(`Reading at ${speechRate}×${voice ? ` with ${voice.name}` : ""}.`);
    return true;
  }

  async function pronounceTarget(normalized: string) {
    const language = speechLanguage(sourceLanguage, normalized);
    const canUseDictionaryAudio = language === "en-US" && !/\s/u.test(normalized) && voiceGender === "auto";
    if (!canUseDictionaryAudio) {
      if (!speakText(normalized, language)) setMessage("Speech is unavailable in this browser.");
      return;
    }

    try {
      const result = await lookupDictionary(normalized);
      if (result?.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.playbackRate = speechRate;
        await audio.play();
        setMessage(`Playing dictionary pronunciation at ${speechRate}×.`);
        return;
      }
    } catch {
      // Browser speech below is the deliberate fallback.
    }
    if (!speakText(normalized, language)) setMessage("Pronunciation audio is unavailable in this browser.");
  }

  async function act(action: StudyAction) {
    const normalized = normalizeSelection(selection);
    if (!normalized) {
      setMessage("Select text above or type a word / phrase first.");
      return;
    }

    setBusyAction(action);
    setLastAction(action);
    if (action !== "save") {
      setResultText("");
    }
    setMessage(`${action === "save" && selectionSaved ? "Undo" : actionLabels[action]}…`);

    try {
      if (action === "save") {
        try {
          const records = await getAllRecords<VocabularyRecord>("vocabulary");
          const matches = records.filter((record) => sameVocabularySelection(record.selection, normalized));
          if (matches.length) {
            await Promise.all(matches.map((record) => deleteRecord("vocabulary", record.id)));
            setSelectionSaved(false);
            setMessage(`Removed “${normalized}” from Vocabulary Shelf.`);
            return;
          }

          const language = speechLanguage(sourceLanguage, normalized);
          const dictionaryPromise: Promise<DictionaryEntry | null> =
            language === "en-US" && !/\s/u.test(normalized)
              ? lookupDictionary(normalized).catch(() => null)
              : Promise.resolve(null);
          const cardPromise = requestAi<VocabularyCard>({
            capability: "vocabulary-card",
            selection: normalized,
            context: sourceText.slice(0, 1_000),
            sourceLanguage,
          });
          setMessage(`Building a complete card for “${normalized}”…`);
          const [dictionary, cardResult] = await Promise.all([dictionaryPromise, cardPromise]);
          const savedAt = Date.now();
          const completeRecord = completeVocabularyRecord({
            id: vocabularyRecordId(normalized),
            selection: normalized,
            normalizedSelection: normalizeVocabularyKey(normalized),
            sourceActivityId: activityId,
            sourceTitle: title,
            context: sourceText.slice(0, 600),
            createdAt: savedAt,
            savedAt,
          }, cardResult.ok ? cardResult.data : null, dictionary);
          if (!completeRecord) {
            setMessage(cardResult.ok && cardResult.data.validSelection === false
              ? `“${normalized}” looks like an incomplete or mistaken selection${cardResult.data.suggestedCorrection ? `; try “${cardResult.data.suggestedCorrection}”` : ""}. It was not saved.`
              : cardResult.ok
                ? `“${normalized}” did not produce a trustworthy complete card, so it was not saved. Check the selection and try again.`
              : `${cardResult.message} “${normalized}” was not saved as an empty card.`);
            return;
          }
          await putRecord<VocabularyRecord>("vocabulary", completeRecord);
          setSelectionSaved(true);
          setMessage(`Saved “${normalized}” with pronunciation, Chinese meaning, English explanation, and a checked example.`);
        } catch {
          setMessage("Saving is unavailable in this browser.");
        }
        return;
      }

      if (action === "pronounce") {
        await pronounceTarget(normalized);
        return;
      }

      if (action === "define") {
        const result = await requestAi<{ text: string }>({
          capability: "define",
          selection: normalized,
          context: sourceText.slice(0, 1_000),
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        setResultText(result.data.text);
        setResultLanguage(speechLanguage(sourceLanguage, normalized));
        setMessage("Definition ready.");
        return;
      }

      if (action === "translate") {
        const wordCount = normalized.split(/\s+/u).filter(Boolean).length;
        if (wordCount > 12 || /[.!?。！？]\s*$/u.test(normalized)) {
          setMessage("Translate is for a word or short phrase. Highlight only the part you want translated.");
          return;
        }
        const detectedSource = sourceLanguage === "auto" ? detectedTargetLanguage(normalized) : sourceLanguage;
        const translationTarget: TargetLanguage = detectedSource === "zh-CN" ? "en" : "zh-CN";
        const result = await requestAi<{ text: string }>({
          capability: "translate",
          selection: normalized,
          context: `Translate only the selected word or short phrase. The surrounding context is reference only: ${sourceText.slice(0, 850)}`,
          sourceLanguage,
          targetLanguage: translationTarget,
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        setResultText(result.data.text);
        setResultLanguage(speechLanguageMap[translationTarget]);
        setMessage("Translation ready.");
        return;
      }

      const capability = action === "relations" ? "relations" : "usage";
      const result = await requestAi<{ text: string }>({
        capability,
        selection: normalized,
        context: sourceText.slice(0, 1_000),
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setResultText(result.data.text);
      setResultLanguage(speechLanguage(sourceLanguage, normalized));
      setMessage(`${actionLabels[action]} result ready.`);
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
        onDoubleClick={resetWindowSize}
        aria-expanded={open}
        title="Click to open · drag to move · double-click to reset size"
      >
        {!launcherImageFailed
          ? <img src={launcherAnimating ? pomeranianWinkSrc : pomeranianIdleSrc} alt="" aria-hidden="true" draggable={false} onError={() => setLauncherImageFailed(true)} />
          : <span className="pomeranian-fallback" aria-hidden="true">🐶</span>}
        <span className="sr-only">{open ? "Close floating study tools" : "Open floating study tools"}</span>
      </button>

      <aside
        ref={windowRef}
        className={`floating-study-window${open ? " is-open" : ""}`}
        style={{ "--window-x": `${position.x}px`, "--window-y": `${position.y}px`, transformOrigin: launcherPosition.x < 400 ? "left bottom" : "right bottom" } as React.CSSProperties}
        aria-hidden={!open}
        inert={!open ? true : undefined}
        aria-label={`Floating study tools for ${title}`}
        aria-busy={!!busyAction}
      >
        <div className="floating-study-handle" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}>
          <div><span>FLOATING STUDY WINDOW</span><strong>{title}</strong></div>
          <div className="floating-window-controls">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={resetWindowSize} aria-label="Reset window size" title="Reset window size">↺</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(false)} aria-label="Close study window">×</button>
          </div>
        </div>

        <section className="floating-step floating-context-step">
          <div className="floating-step-heading"><strong>STEP 1 · CONTEXT</strong><span>Paste a sentence, then highlight a word or phrase</span></div>
          <div className="floating-context-toolbar">
            <label>
              <span>Language</span>
              <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value as SourceLanguage)}>
                {sourceLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
              </select>
            </label>
            <button type="button" className="floating-context-speak" onClick={() => speakText(sourceText, speechLanguage(sourceLanguage, sourceText))} aria-label="Speak context" title="Speak context">◖))</button>
          </div>
          <div className="floating-context-pane" data-language-tools-root>
            <textarea
              aria-label="Context text"
              value={sourceText}
              onChange={(event) => updateSourceText(event.target.value)}
              onSelect={captureTextareaSelection}
              onKeyDown={captureSelectionOnEnter}
              placeholder="Paste or type a sentence for context…"
            />
          </div>
          <div className="floating-speech-controls">
            <label>Speed
              <select value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value) as SpeechRate)}>
                <option value={0.7}>0.7×</option>
                <option value={0.85}>0.85×</option>
                <option value={1}>1×</option>
                <option value={1.15}>1.15×</option>
              </select>
            </label>
            <label>Voice
              <select value={voiceGender} onChange={(event) => setVoiceGender(event.target.value as VoiceGender)}>
                <option value="auto">Auto</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
          </div>
        </section>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 2 · TARGET</strong><span>Highlight text above or type it</span></div>
          <label className="floating-word-input">
            <span>Select text above or type a word / phrase</span>
            <input
              ref={targetInputRef}
              value={selection}
              onChange={(event) => { setSelection(event.target.value); setResultText(""); }}
              placeholder="e.g. quietly specific"
              autoComplete="off"
            />
          </label>
          {spellingSuggestion && (
            <button
              type="button"
              className="floating-spelling-suggestion"
              onClick={() => {
                setSelection(spellingSuggestion);
                setSpellingSuggestion(null);
                setResultText("");
                setMessage(`Target corrected to “${spellingSuggestion}”.`);
                window.requestAnimationFrame(() => targetInputRef.current?.focus());
              }}
            >
              <span>你想检索的是不是：</span>
              <strong>{spellingSuggestion}</strong>
              <small>Did you mean?</small>
            </button>
          )}
        </section>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 3 · ACTION</strong><span>Choose what you want to know about the target</span></div>
          <div className="floating-tool-actions">
            {(["define", "pronounce", "relations", "usage", "translate", "save"] as const).map((action) => (
              <button
                type="button"
                key={action}
                disabled={!!busyAction}
                data-active={lastAction === action ? "true" : undefined}
                aria-pressed={lastAction === action}
                data-saved={action === "save" && selectionSaved ? "true" : undefined}
                title={action === "define" ? "Chinese meaning + concise English definition" : action === "pronounce" ? "Read the target aloud" : action === "relations" ? "Context-matched synonyms and antonyms" : action === "usage" ? "Show real usage, patterns, and a natural example" : action === "translate" ? "Translate only this word or short phrase" : selectionSaved ? "Undo this saved vocabulary item" : "Save on this device"}
                onClick={() => void act(action)}
              >
                {busyAction === action ? (action === "save" ? "Saving…" : action === "translate" ? "Translating…" : "Working…") : action === "save" && selectionSaved ? "Undo" : actionLabels[action]}
              </button>
            ))}
          </div>
        </section>

        <div className="floating-result-panel" data-state={busyAction ? "working" : "ready"}>
          <div className="floating-result-label">
            <span>{busyAction ? "WORKING" : "RESULT"}</span>
            <span>{lastAction ? (lastAction === "save" ? "Vocabulary" : actionLabels[lastAction]) : "Ready"}</span>
          </div>
          <div className="floating-result-copy">
            <p className="floating-tool-message" aria-live="polite">{message}</p>
            {resultText && (
              <button type="button" className="floating-result-speak" onClick={() => speakText(resultText, resultLanguage)} aria-label="Speak result" title="Speak result">◖))</button>
            )}
          </div>
          {resultText && <p className="floating-action-result">{resultText}</p>}
        </div>

        <small className="subtitle-honesty">Tip: highlight a word or phrase, then press Enter to copy it into Target without deleting it from the source. Double-click the dog to restore the default window size.</small>
      </aside>
    </div>
  );
}
