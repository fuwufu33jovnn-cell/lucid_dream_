"use client";

import { useEffect, useState } from "react";
import { summarizeActivityProgress } from "../lib/editorial";
import { getAllRecords } from "../lib/indexed-db";
import type { ActivityProgress, StoredRecord } from "../lib/models";

type ArchiveSummary = {
  started: number;
  completed: number;
  phrases: number;
  saved: number;
  todayChecks: number;
  portfolioEvidence: number;
};

const EMPTY: ArchiveSummary = { started: 0, completed: 0, phrases: 0, saved: 0, todayChecks: 0, portfolioEvidence: 0 };

export function ArchiveBoard() {
  const [summary, setSummary] = useState<ArchiveSummary>(EMPTY);
  const [state, setState] = useState("Reading this device…");

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAllRecords<ActivityProgress>("activity-progress"),
      getAllRecords<StoredRecord>("library"),
      getAllRecords<StoredRecord>("today"),
      getAllRecords<StoredRecord>("portfolio"),
    ]).then(([activities, saved, today, portfolio]) => {
      if (!active) return;
      const activitySummary = summarizeActivityProgress(activities);
      const todayChecks = today.reduce((total, record) => total + (Array.isArray(record.completed) ? record.completed.length : 0), 0);
      const portfolioEvidence = portfolio.reduce((total, record) => {
        if (!record.draft || typeof record.draft !== "object") return total;
        return total + Object.values(record.draft).filter((value) => typeof value === "string" && value.trim()).length;
      }, 0);
      setSummary({ ...activitySummary, saved: saved.length, todayChecks, portfolioEvidence });
      setState("Up to date on this device");
    }).catch(() => { if (active) setState("Device archive unavailable"); });
    return () => { active = false; };
  }, []);

  const hasEvidence = Object.values(summary).some((value) => value > 0);

  return (
    <section className="archive-board" aria-busy={state === "Reading this device…"}>
      <div className="archive-status"><span>{state}</span><span>NO STREAKS / NO RANKING</span></div>
      <div className="archive-ledger">
        <article className="archive-total archive-blue"><span>01 / LAB ENTRIES</span><strong>{summary.completed}</strong><p>finished out of {summary.started} started</p></article>
        <article className="archive-total"><span>02 / PHRASES KEPT</span><strong>{summary.phrases}</strong><p>language you chose to reuse</p></article>
        <article className="archive-total archive-acid"><span>03 / SAVED SOURCES</span><strong>{summary.saved}</strong><p>publisher-hosted things to revisit</p></article>
        <article className="archive-total"><span>04 / TODAY CHECKS</span><strong>{summary.todayChecks}</strong><p>small tasks completed on this device</p></article>
      </div>
      <div className="archive-lower">
        <article><p>PORTFOLIO EVIDENCE</p><strong>{summary.portfolioEvidence}<small> / 9 fields</small></strong><span>{summary.portfolioEvidence ? "Your case study has real material to rehearse." : "Write one concrete project fact in Portfolio to start this shelf."}</span></article>
        <article><p>NEXT USEFUL MOVE</p><h2>{hasEvidence ? "Revisit one thing. Make one sentence better." : "Start anywhere that feels interesting enough."}</h2><a href="/language-lab">OPEN LANGUAGE LAB ↗</a></article>
      </div>
    </section>
  );
}
