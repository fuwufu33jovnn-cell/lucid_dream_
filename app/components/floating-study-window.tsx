"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestAi } from "../lib/ai-client";
import type { SourceLanguage, TargetLanguage, VocabularyCard } from "../lib/ai-contracts";
import { deleteRecord, getAllRecords, putRecord } from "../lib/indexed-db";
import type { VocabularyRecord } from "../lib/models";
import { lookupDictionary, normalizeSelection, type DictionaryEntry } from "../lib/language-tools";
import { detectSpeechLanguage, pickNaturalVoice, type SpeechLanguage, type VoiceGender } from "../lib/pronunciation";
import { completeVocabularyRecord, normalizeVocabularyKey, sameVocabularySelection, vocabularyRecordId } from "../lib/vocabulary";
import { clampLauncherPosition, hasLauncherMoved, LAUNCHER_STORAGE_KEY, snapLauncherPosition } from "../lib/floating-companion.mjs";

type StudyAction = "define" | "pronounce" | "explain" | "refine" | "translate" | "save";
type SpeechRate = 0.7 | 0.85 | 1 | 1.15;

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const pomeranianIdleSrc = `${publicBasePath}/brand/pomeranian-idle.png`;
const pomeranianWinkSrc = `${publicBasePath}/brand/pomeranian-wink.png`;
const actionLabels: Record<StudyAction, string> = {
  define: "Define",
  pronounce: "Hear",
  explain: "Explain",
  refine: "Refine",
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
const targetLanguages: Array<{ value: TargetLanguage; label: string }> = sourceLanguages.filter(
  (language): language is { value: TargetLanguage; label: string } => language.value !== "auto",
);
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

function alternateTargetLanguage(source: TargetLanguage): TargetLanguage {
  return source === "en" ? "zh-CN" : "en";
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
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("zh-CN");
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState("");
  const [translationState, setTranslationState] = useState<"idle" | "working" | "ready" | "error">("idle");
  const [selection, setSelection] = useState("");
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [message, setMessage] = useState("Type or paste text above. Translation appears automatically.");
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
  const translationTimer = useRef<number | null>(null);
  const translationAbort = useRef<AbortController | null>(null);
  const translationCache = useRef(new Map<string, string>());
  const launcherDrag = useRef<{ pointerId: number; start: { x: number; y: number }; origin: { x: number; y: number }; moved: boolean } | null>(null);
  const translationSequence = useRef(0);
  const saveCheckSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSourceText(initialText);
      setTranslatedText("");
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
    if (translationTimer.current != null) window.clearTimeout(translationTimer.current);
    translationAbort.current?.abort();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    const text = sourceText.trim();
    const effectiveSource = sourceLanguage === "auto" ? detectedTargetLanguage(text) : sourceLanguage;
    if (!text && sourceLanguage === "auto") return;
    if (effectiveSource !== targetLanguage) return;
    setTargetLanguage(alternateTargetLanguage(effectiveSource));
  }, [sourceLanguage, sourceText, targetLanguage]);

  const translateContext = useCallback(async (trigger: "auto" | "manual") => {
    if (trigger === "manual" && translationTimer.current != null) {
      window.clearTimeout(translationTimer.current);
      translationTimer.current = null;
    }
    const text = sourceText.trim();
    if (!text) {
      translationSequence.current += 1;
      setTranslatedText("");
      setTranslationState("idle");
      return;
    }

    const requestId = ++translationSequence.current;
    const requestKey = `${sourceLanguage}|${targetLanguage}|${text}`;
    const cached = translationCache.current.get(requestKey);
    if (cached) {
      setTranslatedText(cached);
      setTranslationState("ready");
      return;
    }

    translationAbort.current?.abort();
    const controller = new AbortController();
    translationAbort.current = controller;
    setTranslationState("working");
    const result = await requestAi<{ text: string }>({
      capability: "translate",
      selection: text.slice(0, 8_000),
      context: trigger === "auto" ? "Live context translation while the learner types." : "User-confirmed context translation.",
      sourceLanguage,
      targetLanguage,
    }, { timeoutMs: 9_000, signal: controller.signal });
    if (controller.signal.aborted || requestId !== translationSequence.current) return;
    if (!result.ok) {
      setTranslationState("error");
      setMessage(trigger === "manual" ? result.message : "Translation paused. Tap Translate now to retry.");
      return;
    }
    translationCache.current.set(requestKey, result.data.text);
    setTranslatedText(result.data.text);
    setTranslationState("ready");
  }, [sourceLanguage, sourceText, targetLanguage]);

  useEffect(() => {
    if (!open || !sourceText.trim()) return;
    translationTimer.current = window.setTimeout(() => {
      translationTimer.current = null;
      void translateContext("auto");
    }, 450);
    return () => {
      if (translationTimer.current != null) window.clearTimeout(translationTimer.current);
      translationTimer.current = null;
    };
  }, [open, sourceText, sourceLanguage, targetLanguage, translateContext]);

  function updateSourceText(value: string) {
    setSourceText(value);
    if (value.trim()) {
      setTranslationState("idle");
      return;
    }
    translationSequence.current += 1;
    setTranslatedText("");
    setTranslationState("idle");
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
    setEntry(null);
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

  function swapLanguages() {
    const resolvedSource = sourceLanguage === "auto" ? detectedTargetLanguage(sourceText) : sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(resolvedSource);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
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
      setEntry(result);
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
      setEntry(null);
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

          let dictionary: DictionaryEntry | null = null;
          const language = speechLanguage(sourceLanguage, normalized);
          if (language === "en-US" && !/\s/u.test(normalized)) {
            try { dictionary = await lookupDictionary(normalized); } catch { dictionary = null; }
          }

          const cardResult = await requestAi<VocabularyCard>({
            capability: "vocabulary-card",
            selection: normalized,
            context: sourceText.slice(0, 1_000),
            sourceLanguage,
          });
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
        if (/\s/u.test(normalized)) {
          setMessage("Define is for a single word. Use Explain for a phrase or sentence.");
          return;
        }
        try {
          const result = await lookupDictionary(normalized);
          setEntry(result);
          const definition = result?.meanings[0]?.definition;
          if (definition) {
            setResultText(definition);
            setResultLanguage("en-US");
            setMessage("Dictionary result ready.");
            return;
          }
        } catch {
          // AI definition below is the deliberate fallback.
        }
        const fallback = await requestAi<{ text: string }>({
          capability: "explain",
          selection: normalized,
          context: `Dictionary fallback requested. Give one concise learner-friendly definition. Study context: ${sourceText.slice(0, 600)}`,
        });
        if (fallback.ok) {
          setResultText(fallback.data.text);
          setResultLanguage("en-US");
          setMessage("AI definition ready.");
        } else setMessage(fallback.message);
        return;
      }

      const request = action === "translate"
        ? { capability: "translate" as const, selection: normalized, context: sourceText.slice(0, 1_000), sourceLanguage, targetLanguage }
        : { capability: action, selection: normalized, context: sourceText.slice(0, 1_000) };
      const result = await requestAi<{ text: string }>(request);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      const language = action === "translate"
        ? speechLanguageMap[targetLanguage]
        : action === "refine"
          ? speechLanguage(sourceLanguage, normalized)
          : "en-US";
      setResultText(result.data.text);
      setResultLanguage(language);
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
          <div className="floating-step-heading"><strong>STEP 1 · CONTEXT TRANSLATOR</strong><span>Live translation as you type</span></div>
          <div className="floating-language-bar">
            <label>
              <span className="sr-only">Source language</span>
              <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value as SourceLanguage)}>
                {sourceLanguages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.value === "auto" && sourceText.trim()
                      ? `AUTO · ${targetLanguages.find((item) => item.value === detectedTargetLanguage(sourceText))?.label ?? "DETECT"}`
                      : language.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={swapLanguages} aria-label="Swap translation languages" title="Swap languages">⇄</button>
            <label>
              <span className="sr-only">Target language</span>
              <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value as TargetLanguage)}>
                {targetLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
              </select>
            </label>
          </div>

          <div className="subtitle-study-copy" data-language-tools-root>
            <div className="floating-translation-pane">
              <textarea
                aria-label="Source text"
                value={sourceText}
                onChange={(event) => updateSourceText(event.target.value)}
                onSelect={captureTextareaSelection}
                onKeyDown={captureSelectionOnEnter}
                placeholder="Type a word, phrase, or sentence…"
              />
              <button type="button" className="floating-speak-button" onClick={() => speakText(sourceText, speechLanguage(sourceLanguage, sourceText))} aria-label="Speak source text" title="Speak source text">◖))</button>
            </div>
            <div className="floating-translation-pane is-output">
              <textarea
                aria-label="Translation"
                value={translatedText}
                readOnly
                onSelect={captureTextareaSelection}
                onKeyDown={captureSelectionOnEnter}
                placeholder={translationState === "working" ? "Translating…" : "Translation appears here"}
              />
              <button type="button" className="floating-speak-button" onClick={() => speakText(translatedText, speechLanguageMap[targetLanguage])} aria-label="Speak translation" title="Speak translation">◖))</button>
            </div>
          </div>

          <div className="floating-translation-footer">
            <span className={`floating-translation-state is-${translationState}`} aria-live="polite">
              {translationState === "working" ? "TRANSLATING…" : translationState === "ready" ? "TRANSLATED" : translationState === "error" ? "TRANSLATION PAUSED" : "READY"}
            </span>
            <button type="button" className="floating-translate-now" onClick={() => void translateContext("manual")} disabled={!sourceText.trim()}>Translate now</button>
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
              onChange={(event) => { setSelection(event.target.value); setEntry(null); setResultText(""); }}
              placeholder="e.g. quietly specific"
              autoComplete="off"
            />
          </label>
        </section>

        <section className="floating-step">
          <div className="floating-step-heading"><strong>STEP 3 · ACTION</strong><span>Use a word, phrase, or full sentence</span></div>
          <div className="floating-tool-actions">
            {(["define", "pronounce", "explain", "refine", "translate", "save"] as const).map((action) => (
              <button
                type="button"
                key={action}
                disabled={!!busyAction}
                data-primary={action === "explain" ? "true" : "false"}
                data-saved={action === "save" && selectionSaved ? "true" : undefined}
                title={action === "define" ? "Dictionary definition" : action === "pronounce" ? "Read the target aloud" : action === "explain" ? "Explain in context with AI" : action === "refine" ? "Make the text more natural" : action === "translate" ? "Translate the target" : selectionSaved ? "Undo this saved vocabulary item" : "Save on this device"}
                onClick={() => void act(action)}
              >
                {busyAction === action ? "…" : action === "save" && selectionSaved ? "Undo" : actionLabels[action]}
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
            {(resultText || entry?.meanings[0]?.definition) && (
              <button type="button" className="floating-result-speak" onClick={() => speakText(resultText || entry?.meanings[0]?.definition || "", resultLanguage)} aria-label="Speak result" title="Speak result">◖))</button>
            )}
          </div>
          {entry && <p className="floating-dictionary-result"><strong>{entry.word} {entry.phonetic}</strong><br />{entry.meanings[0]?.definition}</p>}
          {resultText && <p className="floating-action-result">{resultText}</p>}
        </div>

        <small className="subtitle-honesty">Tip: highlight any word or phrase in either translation box and it jumps into Target. Double-click the dog to restore the default window size.</small>
      </aside>
    </div>
  );
}
