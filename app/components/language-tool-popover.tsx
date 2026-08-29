"use client";

import { useEffect, useState } from "react";
import { lookupDictionary, normalizeSelection, type DictionaryEntry } from "../lib/language-tools";
import { putRecord } from "../lib/indexed-db";
import { requestAi } from "../lib/ai-client";

type ToolState = "idle" | "dictionary-loading" | "ai-loading" | "saved" | "error";
type ToolAction = "define" | "pronounce" | "explain" | "translate" | "save";

export function LanguageToolPopover({ activityId }: { activityId: string }) {
  const [selection, setSelection] = useState("");
  const [context, setContext] = useState("");
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [state, setState] = useState<ToolState>("idle");
  const [message, setMessage] = useState("Select a word or sentence in the learning notes.");

  useEffect(() => {
    function captureSelection() {
      const rangeSelection = window.getSelection();
      const anchor = rangeSelection?.anchorNode;
      const element = anchor instanceof Element ? anchor : anchor?.parentElement;
      const root = element?.closest("[data-language-tools-root]");
      if (!rangeSelection || !root || rangeSelection.isCollapsed) return;
      const next = normalizeSelection(rangeSelection.toString());
      if (!next) return;
      setSelection(next);
      setContext(normalizeSelection(root.textContent ?? "").slice(0, 320));
      setEntry(null);
      setState("idle");
      setMessage("Choose a language tool.");
    }
    document.addEventListener("selectionchange", captureSelection);
    return () => document.removeEventListener("selectionchange", captureSelection);
  }, [activityId]);

  async function dictionary(): Promise<DictionaryEntry | null> {
    if (entry) return entry;
    if (!selection || /\s/.test(selection)) {
      setState("error");
      setMessage("DEFINE works with one word. EXPLAIN will handle phrases when AI is connected.");
      return null;
    }
    setState("dictionary-loading");
    try {
      const result = await lookupDictionary(selection);
      setEntry(result);
      setState(result ? "idle" : "error");
      setMessage(result ? "Dictionary result ready." : "No dictionary entry found. You can still save this word.");
      return result;
    } catch {
      setState("error");
      setMessage("Dictionary unavailable. Try again; Save still works.");
      return null;
    }
  }

  async function act(action: ToolAction) {
    if (!selection) {
      setMessage("Select something in the notes first.");
      return;
    }
    if (action === "define") {
      await dictionary();
      return;
    }
    if (action === "pronounce") {
      const result = await dictionary();
      if (result?.audioUrl) new Audio(result.audioUrl).play().catch(() => setMessage("Audio could not play in this browser."));
      else if (result) setMessage("This dictionary entry has no audio recording.");
      return;
    }
    if (action === "save") {
      try {
        await putRecord("vocabulary", { id: `${activityId}-${Date.now()}`, selection, sourceActivityId: activityId, context, createdAt: Date.now() });
        setState("saved");
        setMessage("Saved to your device vocabulary shelf.");
      } catch {
        setState("error");
        setMessage("Device saving is unavailable in this browser.");
      }
      return;
    }
    setState("ai-loading");
    const result = await requestAi<{ text: string }>({ capability: action, selection, context });
    if (!result.ok) { setState("error"); setMessage(`${result.message} — dictionary and Save still work.`); return; }
    setState("idle");
    setMessage(result.data.text);
  }

  return (
    <section className="language-tools" aria-label="Language tools">
      <button className="language-tools-trigger" type="button" onClick={() => setMessage(selection ? "Choose a language tool." : "Select something in the notes first.")}>LANGUAGE TOOLS</button>
      <div className="language-tools-popover" aria-live="polite">
        <p className="language-selection">{selection || "NO SELECTION"}</p>
        <div className="language-tool-actions">
          {(["define", "pronounce", "explain", "translate", "save"] as ToolAction[]).map((action) => <button key={action} type="button" onClick={() => void act(action)}>{action.toUpperCase()}</button>)}
        </div>
        {state === "dictionary-loading" ? <p>LOOKING UP…</p> : <p>{message}</p>}
        {entry && <div className="dictionary-result"><strong>{entry.word} <span>{entry.phonetic}</span></strong>{entry.meanings.map((meaning) => <p key={`${meaning.partOfSpeech}-${meaning.definition}`}><em>{meaning.partOfSpeech}</em> {meaning.definition}</p>)}</div>}
      </div>
    </section>
  );
}
