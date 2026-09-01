"use client";

import { useEffect, useState } from "react";
import { summarizeActivityProgress } from "../lib/editorial";
import { deleteRecord, getAllRecords, putRecord } from "../lib/indexed-db";
import type { ActivityProgress, StoredRecord, VocabularyRecord } from "../lib/models";
import { detectSpeechLanguage, pickNaturalVoice } from "../lib/pronunciation";
import { dedupeVocabularyRecords, normalizeVocabularyKey, vocabularyRecordId } from "../lib/vocabulary";

type ArchiveSummary = {
  started: number;
  completed: number;
  phrases: number;
  saved: number;
  todayChecks: number;
  portfolioEvidence: number;
};

const EMPTY: ArchiveSummary = { started: 0, completed: 0, phrases: 0, saved: 0, todayChecks: 0, portfolioEvidence: 0 };

function canonicalVocabulary(records: VocabularyRecord[]): VocabularyRecord[] {
  return dedupeVocabularyRecords(records).map((record) => ({
    ...record,
    id: vocabularyRecordId(record.selection),
    normalizedSelection: normalizeVocabularyKey(record.selection),
  }));
}

export function ArchiveBoard() {
  const [summary, setSummary] = useState<ArchiveSummary>(EMPTY);
  const [vocabulary, setVocabulary] = useState<VocabularyRecord[]>([]);
  const [hiddenChinese, setHiddenChinese] = useState<Set<string>>(() => new Set());
  const [openUsage, setOpenUsage] = useState<Set<string>>(() => new Set());
  const [state, setState] = useState("Reading this device…");

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAllRecords<ActivityProgress>("activity-progress"),
      getAllRecords<StoredRecord>("library"),
      getAllRecords<StoredRecord>("today"),
      getAllRecords<StoredRecord>("portfolio"),
      getAllRecords<VocabularyRecord>("vocabulary"),
    ]).then(([activities, saved, today, portfolio, vocabularyRecords]) => {
      if (!active) return;
      const activitySummary = summarizeActivityProgress(activities);
      const todayChecks = today.reduce((total, record) => total + (Array.isArray(record.completed) ? record.completed.length : 0), 0);
      const portfolioEvidence = portfolio.reduce((total, record) => {
        if (!record.draft || typeof record.draft !== "object") return total;
        return total + Object.values(record.draft).filter((value) => typeof value === "string" && value.trim()).length;
      }, 0);

      const uniqueVocabulary = canonicalVocabulary(vocabularyRecords);
      setVocabulary(uniqueVocabulary);
      setSummary({ ...activitySummary, phrases: activitySummary.phrases + uniqueVocabulary.length, saved: saved.length, todayChecks, portfolioEvidence });
      setState(vocabularyRecords.length === uniqueVocabulary.length ? "Up to date on this device" : "Duplicates cleaned on this device");

      const canonicalIds = new Set(uniqueVocabulary.map((record) => record.id));
      const staleIds = vocabularyRecords
        .map((record) => record.id)
        .filter((id) => !canonicalIds.has(id));
      void Promise.all([
        ...staleIds.map((id) => deleteRecord("vocabulary", id)),
        ...uniqueVocabulary.map((record) => putRecord<VocabularyRecord>("vocabulary", record)),
      ]).catch(() => undefined);
    }).catch(() => { if (active) setState("Device archive unavailable"); });
    return () => { active = false; };
  }, []);

  const hasEvidence = Object.values(summary).some((value) => value > 0);
  const allChineseHidden = vocabulary.length > 0 && vocabulary.every((item) => hiddenChinese.has(item.id));

  function toggleChinese(id: string) {
    setHiddenChinese((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleUsage(id: string) {
    setOpenUsage((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllChinese() {
    setHiddenChinese(allChineseHidden ? new Set() : new Set(vocabulary.map((item) => item.id)));
  }

  async function speakVocabulary(item: VocabularyRecord) {
    if (item.audioUrl) {
      try {
        await new Audio(item.audioUrl).play();
        return;
      } catch {
        // Fall through to the browser voice.
      }
    }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    const language = detectSpeechLanguage(item.selection);
    const voice = pickNaturalVoice(window.speechSynthesis.getVoices(), language, "auto");
    const utterance = new SpeechSynthesisUtterance(item.selection);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || language;
    utterance.rate = 0.94;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="archive-board" aria-busy={state === "Reading this device…"}>
      <div className="archive-status"><span>{state}</span><span>NO STREAKS / NO RANKING</span></div>
      <div className="archive-ledger">
        <article className="archive-total archive-blue"><span>01 / LAB ENTRIES</span><strong>{summary.completed}</strong><p>finished out of {summary.started} started</p></article>
        <article className="archive-total"><span>02 / PHRASES KEPT</span><strong>{summary.phrases}</strong><p>language you chose to reuse</p></article>
        <article className="archive-total archive-acid"><span>03 / SAVED SOURCES</span><strong>{summary.saved}</strong><p>publisher-hosted things to revisit</p></article>
        <article className="archive-total"><span>04 / TODAY CHECKS</span><strong>{summary.todayChecks}</strong><p>small tasks completed on this device</p></article>
      </div>

      <section className="vocabulary-shelf" aria-label="Saved vocabulary">
        <div className="vocabulary-shelf-heading">
          <div><span>05 / VOCABULARY SHELF</span><h2>WORDS & PHRASES KEPT</h2></div>
          <div className="vocabulary-shelf-heading-actions">
            {vocabulary.length > 0 && <button type="button" onClick={toggleAllChinese}>{allChineseHidden ? "SHOW ALL 中文" : "HIDE ALL 中文"}</button>}
            <strong>{vocabulary.length}</strong>
          </div>
        </div>

        {vocabulary.length ? (
          <div className="vocabulary-shelf-list">
            <div className="vocabulary-shelf-columns" aria-hidden="true">
              <span>NO.</span><span>WORD / PRONUNCIATION</span><span>中文释义</span><span>ENGLISH EXPLANATION</span><span>ACTIONS</span>
            </div>
            {vocabulary.map((item, index) => {
              const chineseHidden = hiddenChinese.has(item.id);
              const usageOpen = openUsage.has(item.id);
              return (
                <article className="vocabulary-shelf-item" key={item.id}>
                  <span className="vocabulary-item-number">{String(index + 1).padStart(2, "0")}</span>

                  <div className="vocabulary-term">
                    <strong>{item.selection}</strong>
                    <div>
                      <span>{item.pronunciation || "PRONUNCIATION —"}</span>
                      <small>{item.sourceTitle ?? item.sourceActivityId}</small>
                    </div>
                  </div>

                  <div className="vocabulary-meaning" data-hidden={chineseHidden ? "true" : "false"}>
                    <span className="vocabulary-mobile-label">中文释义</span>
                    <p>{chineseHidden ? "••••••" : item.chineseMeaning || "—"}</p>
                  </div>

                  <div className="vocabulary-definition">
                    <span className="vocabulary-mobile-label">ENGLISH EXPLANATION</span>
                    <p>{item.englishDefinition || "—"}</p>
                  </div>

                  <div className="vocabulary-item-actions">
                    <button type="button" onClick={() => void speakVocabulary(item)}>HEAR</button>
                    <button type="button" onClick={() => toggleChinese(item.id)}>{chineseHidden ? "SHOW 中文" : "HIDE 中文"}</button>
                    <button type="button" onClick={() => toggleUsage(item.id)} aria-expanded={usageOpen}>{usageOpen ? "CLOSE USE" : "USE"}</button>
                  </div>

                  {usageOpen && (
                    <div className="vocabulary-usage">
                      <span>IN USE / EXAMPLE</span>
                      <p>{item.example || item.context || "No example was stored for this older entry."}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="vocabulary-shelf-empty">Nothing saved yet. Use SAVE in the floating study window and it will appear here.</p>
        )}
      </section>

      <div className="archive-lower">
        <article><p>PORTFOLIO EVIDENCE</p><strong>{summary.portfolioEvidence}<small> / 9 fields</small></strong><span>{summary.portfolioEvidence ? "Your case study has real material to rehearse." : "Write one concrete project fact in Portfolio to start this shelf."}</span></article>
        <article><p>NEXT USEFUL MOVE</p><h2>{hasEvidence ? "Revisit one thing. Make one sentence better." : "Start anywhere that feels interesting enough."}</h2><a href="/language-lab">OPEN LANGUAGE LAB ↗</a></article>
      </div>
    </section>
  );
}
