"use client";

import { useEffect, useRef, useState } from "react";
import { requestAi } from "../lib/ai-client";
import type { VocabularyCard } from "../lib/ai-contracts";
import { summarizeActivityProgress } from "../lib/editorial";
import { deleteRecord, getAllRecords, putRecord } from "../lib/indexed-db";
import { lookupDictionary, type DictionaryEntry } from "../lib/language-tools";
import type { ActivityProgress, StoredRecord, VocabularyRecord } from "../lib/models";
import { detectSpeechLanguage, pickNaturalVoice } from "../lib/pronunciation";
import { completeVocabularyRecord, dedupeVocabularyRecords, hasCompleteVocabularyDetails, normalizeVocabularyKey, recordsNeedingVocabularyDetails, vocabularyRecordId, vocabularyUsageExample } from "../lib/vocabulary";

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

async function fetchVocabularyDetails(record: VocabularyRecord): Promise<VocabularyRecord | null> {
  let dictionary: DictionaryEntry | null = null;
  if (detectSpeechLanguage(record.selection) === "en-US" && !/\s/u.test(record.selection.trim())) {
    try { dictionary = await lookupDictionary(record.selection); } catch { dictionary = null; }
  }
  const cardResult = await requestAi<VocabularyCard>({
    capability: "vocabulary-card",
    selection: record.selection,
    context: record.context?.slice(0, 1_000) ?? "",
    sourceLanguage: "auto",
  });
  return completeVocabularyRecord(record, cardResult.ok ? cardResult.data : null, dictionary);
}

export function ArchiveBoard() {
  const [summary, setSummary] = useState<ArchiveSummary>(EMPTY);
  const [vocabulary, setVocabulary] = useState<VocabularyRecord[]>([]);
  const [hiddenChinese, setHiddenChinese] = useState<Set<string>>(() => new Set());
  const [openUsage, setOpenUsage] = useState<Set<string>>(() => new Set());
  const [repairingVocabulary, setRepairingVocabulary] = useState<Set<string>>(() => new Set());
  const [removingVocabulary, setRemovingVocabulary] = useState<Set<string>>(() => new Set());
  const removedVocabularyIds = useRef<Set<string>>(new Set());
  const [state, setState] = useState("Reading this device…");

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAllRecords<ActivityProgress>("activity-progress"),
      getAllRecords<StoredRecord>("library"),
      getAllRecords<StoredRecord>("today"),
      getAllRecords<StoredRecord>("portfolio"),
      getAllRecords<VocabularyRecord>("vocabulary"),
    ]).then(async ([activities, saved, today, portfolio, vocabularyRecords]) => {
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

      const incomplete = recordsNeedingVocabularyDetails(uniqueVocabulary);
      if (!incomplete.length) return;
      setState(`Loading meanings and examples for ${incomplete.length} older ${incomplete.length === 1 ? "entry" : "entries"}…`);
      setRepairingVocabulary(new Set(incomplete.map((record) => record.id)));
      const repairedRecords = (await Promise.all(incomplete.map(fetchVocabularyDetails)))
        .filter((record): record is VocabularyRecord => record !== null && !removedVocabularyIds.current.has(record.id));
      await Promise.all(repairedRecords.map((record) => putRecord<VocabularyRecord>("vocabulary", record)));
      if (!active) return;
      const repairedById = new Map(repairedRecords.map((record) => [record.id, record]));
      setVocabulary((current) => current.map((item) => repairedById.get(item.id) ?? item));
      setRepairingVocabulary(new Set());
      const repaired = repairedRecords.length;
      if (active) setState(repaired === incomplete.length
        ? `Added meanings and examples to ${repaired} older ${repaired === 1 ? "entry" : "entries"}`
        : `Updated ${repaired} of ${incomplete.length} older entries · retry any remaining row`);
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

  async function retryVocabularyDetails(item: VocabularyRecord) {
    setRepairingVocabulary((current) => new Set(current).add(item.id));
    try {
      const completed = await fetchVocabularyDetails(item);
      if (completed && !removedVocabularyIds.current.has(item.id)) {
        await putRecord<VocabularyRecord>("vocabulary", completed);
        setVocabulary((current) => current.map((record) => record.id === completed.id ? completed : record));
        setState(`Added checked meanings and an example for “${item.selection}”`);
      } else {
        setState(`Could not verify complete details for “${item.selection}” · check the selection or retry later`);
      }
    } catch {
      setState(`Could not update “${item.selection}” on this device · retry later`);
    } finally {
      setRepairingVocabulary((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function removeVocabulary(item: VocabularyRecord) {
    removedVocabularyIds.current.add(item.id);
    setRemovingVocabulary((current) => new Set(current).add(item.id));
    try {
      await deleteRecord("vocabulary", item.id);
      setVocabulary((current) => current.filter((record) => record.id !== item.id));
      setSummary((current) => ({ ...current, phrases: Math.max(0, current.phrases - 1) }));
      setHiddenChinese((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setOpenUsage((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setRepairingVocabulary((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setState(`Removed “${item.selection}” from your vocabulary shelf`);
    } catch {
      removedVocabularyIds.current.delete(item.id);
      setState(`Could not remove “${item.selection}” on this device · retry`);
    } finally {
      setRemovingVocabulary((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
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
              const detailsReady = hasCompleteVocabularyDetails(item);
              const repairing = repairingVocabulary.has(item.id);
              const removing = removingVocabulary.has(item.id);
              const usageExample = vocabularyUsageExample(item);
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
                    <p>{detailsReady && chineseHidden ? "••••••" : detailsReady ? item.chineseMeaning : repairing ? "正在加载释义…" : "释义未加载"}</p>
                  </div>

                  <div className="vocabulary-definition">
                    <span className="vocabulary-mobile-label">ENGLISH EXPLANATION</span>
                    <p>{detailsReady ? item.englishDefinition : repairing ? "Loading a checked explanation…" : "Explanation not loaded"}</p>
                  </div>

                  <div className="vocabulary-item-actions">
                    <button type="button" onClick={() => void speakVocabulary(item)}>HEAR</button>
                    {detailsReady
                      ? <button type="button" onClick={() => toggleChinese(item.id)}>{chineseHidden ? "SHOW 中文" : "HIDE 中文"}</button>
                      : <button type="button" disabled={repairing} onClick={() => void retryVocabularyDetails(item)}>{repairing ? "LOADING…" : "RETRY DETAILS"}</button>}
                    <button type="button" disabled={!usageExample || removing} onClick={() => toggleUsage(item.id)} aria-expanded={usageOpen}>{usageOpen ? "CLOSE USE" : "USE"}</button>
                    <button type="button" disabled={removing} onClick={() => void removeVocabulary(item)}>{removing ? "REMOVING…" : "UNSAVE"}</button>
                  </div>

                  {usageOpen && usageExample && (
                    <div className="vocabulary-usage">
                      <span>{item.exampleSource === "dictionary" ? "DICTIONARY EXAMPLE" : "AI-GENERATED EXAMPLE"}</span>
                      <p>{usageExample}</p>
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
