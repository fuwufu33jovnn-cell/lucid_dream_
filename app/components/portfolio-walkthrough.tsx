"use client";

import { useEffect, useMemo, useState } from "react";
import { systemNow } from "../lib/exam";
import { getRecord, putRecord } from "../lib/indexed-db";
import {
  buildWalkthroughOutline,
  emptyPortfolioDraft,
  walkthroughCompleteness,
  type PortfolioDraft,
} from "../lib/portfolio";
import type { StoredRecord } from "../lib/models";

type PortfolioRecord = StoredRecord & {
  draft: PortfolioDraft;
  translationNote: string;
  reusePhrase: string;
  savedAt: number;
};

const FIELDS: Array<{ key: keyof PortfolioDraft; label: string; prompt: string }> = [
  { key: "project", label: "Project + purpose", prompt: "What did you make, and why did it exist?" },
  { key: "audience", label: "Audience", prompt: "Who needed it? Be specific." },
  { key: "painPoint", label: "User pain point", prompt: "What observable problem were people facing?" },
  { key: "role", label: "Your role", prompt: "What exactly did you own or contribute?" },
  { key: "choices", label: "Design choices", prompt: "What did you choose, reject, and why?" },
  { key: "system", label: "Design system", prompt: "Which rules or components kept it consistent?" },
  { key: "iteration", label: "Iteration", prompt: "What changed after feedback or testing?" },
  { key: "impact", label: "Impact", prompt: "What changed, or what would you measure next?" },
  { key: "nextRole", label: "Role fit", prompt: "Which target role does this evidence support?" },
];

function formatTimer(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PortfolioWalkthrough() {
  const [draft, setDraft] = useState<PortfolioDraft>(emptyPortfolioDraft());
  const [translationNote, setTranslationNote] = useState("");
  const [reusePhrase, setReusePhrase] = useState("");
  const [saveState, setSaveState] = useState("Checking this device…");
  const [timerMode, setTimerMode] = useState<60 | 300>(60);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let active = true;
    void getRecord<PortfolioRecord>("portfolio", "primary-case-study")
      .then((record) => {
        if (!active) return;
        if (record) { setDraft(record.draft); setTranslationNote(record.translationNote); setReusePhrase(record.reusePhrase); }
        setSaveState("Saved on this device");
      })
      .catch(() => { if (active) setSaveState("Device saving unavailable"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) { window.clearInterval(timer); setRunning(false); return 0; }
        return current - 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [running]);

  const outline = useMemo(() => buildWalkthroughOutline(draft), [draft]);
  const completeness = walkthroughCompleteness(draft);

  async function persist(nextDraft: PortfolioDraft, nextTranslation = translationNote, nextPhrase = reusePhrase) {
    setSaveState("Saving…");
    try {
      await putRecord("portfolio", { id: "primary-case-study", draft: nextDraft, translationNote: nextTranslation, reusePhrase: nextPhrase, savedAt: systemNow() });
      setSaveState("Saved on this device");
    } catch { setSaveState("Device saving unavailable"); }
  }

  function updateField(key: keyof PortfolioDraft, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    void persist(next);
  }

  function chooseTimer(mode: 60 | 300) {
    setTimerMode(mode);
    setSeconds(mode);
    setRunning(false);
  }

  return (
    <section className="portfolio-workspace">
      <div className="portfolio-editor">
        <div className="portfolio-status"><div><span>Case evidence</span><strong>{completeness.completed} / {completeness.total}</strong></div><div className="portfolio-progress"><span style={{ width: `${(completeness.completed / completeness.total) * 100}%` }} /></div><span role="status">{saveState}</span></div>
        <div className="portfolio-fields">
          {FIELDS.map((field, index) => (
            <label className="portfolio-field" key={field.key}>
              <span><b>{String(index + 1).padStart(2, "0")}</b>{field.label}</span>
              <textarea value={draft[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.prompt} rows={3} />
            </label>
          ))}
        </div>
      </div>

      <aside className="walkthrough-preview">
        <div className="rehearsal-controls">
          <div><button className={timerMode === 60 ? "is-active" : ""} type="button" onClick={() => chooseTimer(60)}>60 sec</button><button className={timerMode === 300 ? "is-active" : ""} type="button" onClick={() => chooseTimer(300)}>5 min</button></div>
          <strong>{formatTimer(seconds)}</strong>
          <button className="rehearse-button" type="button" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : seconds === 0 ? "Reset" : "Rehearse"}</button>
        </div>
        <div className="outline-list">
          {outline.map((section, index) => (
            <article key={section.label}><span>{String(index + 1).padStart(2, "0")}</span><div><p>{section.label}</p><strong>{section.englishLead}</strong><small>{section.content}</small></div></article>
          ))}
        </div>
        <div className="reflection-box">
          <label><span>Where did I translate from Chinese?</span><textarea rows={2} value={translationNote} onChange={(event) => { const value = event.target.value; setTranslationNote(value); void persist(draft, value, reusePhrase); }} /></label>
          <label><span>Which phrase will I reuse?</span><input value={reusePhrase} onChange={(event) => { const value = event.target.value; setReusePhrase(value); void persist(draft, translationNote, value); }} /></label>
        </div>
      </aside>
    </section>
  );
}
