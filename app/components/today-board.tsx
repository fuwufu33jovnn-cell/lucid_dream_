"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRecord, isIndexedDbAvailable, putRecord } from "../lib/indexed-db";
import type { PlanMode, StoredRecord, TodayTask } from "../lib/models";
import { buildTodayPlan } from "../lib/today";
import { requestAi } from "../lib/ai-client";
import { validateGeneratedPlan, type GeneratedPlan } from "../lib/ai-contracts";

type PreferenceRecord = StoredRecord & { value: PlanMode };
type TodayRecord = StoredRecord & { completed: string[] };

const MODES: Array<{ value: PlanMode; label: string }> = [
  { value: 10, label: "Low energy" },
  { value: 45, label: "Normal" },
  { value: 90, label: "Immersive" },
];

const ALTERNATES: Record<number, Pick<TodayTask, "title" | "detail">[]> = {
  5: [
    { title: "Five useful phrases", detail: "挑五个真正会用到的表达，各说一句。" },
    { title: "Tiny retell", detail: "用五分钟复述刚看过的一小段英文内容。" },
  ],
  10: [
    { title: "Role requirement scan", detail: "读一份岗位描述，圈出三个重复要求。" },
    { title: "Impact sentence", detail: "把一个作品成果写成清楚、不过度夸张的英文句子。" },
  ],
  15: [
    { title: "Question-type repair", detail: "只练一种雅思题型并记录定位依据。" },
    { title: "Design talk notes", detail: "听一段设计演讲，留下三条英文笔记。" },
  ],
  20: [
    { title: "Think in English loop", detail: "同一个设计想法分别讲 30 秒、60 秒和 2 分钟。" },
  ],
  25: [
    { title: "Deep input + output", detail: "完成一段输入，再做两分钟英文总结。" },
  ],
};

function localDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TodayBoard() {
  const [mode, setMode] = useState<PlanMode>(45);
  const [completed, setCompleted] = useState<string[]>([]);
  const [replacements, setReplacements] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving" | "unavailable">("loading");
  const [aiTasks, setAiTasks] = useState<TodayTask[] | null>(null);
  const [reshapeState, setReshapeState] = useState("AI NOT CONNECTED");
  const dayId = `today-${localDateKey()}`;
  const baseTasks = useMemo(() => buildTodayPlan(mode), [mode]);
  const tasks = (aiTasks ?? baseTasks).map((task) => {
    const alternatives = ALTERNATES[task.minutes] ?? [];
    const index = replacements[task.id];
    return index === undefined || alternatives.length === 0
      ? task
      : { ...task, ...alternatives[index % alternatives.length] };
  });

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!(await isIndexedDbAvailable())) {
        if (active) { setSaveState("unavailable"); setReady(true); }
        return;
      }
      const [preference, today] = await Promise.all([
        getRecord<PreferenceRecord>("preferences", "plan-mode"),
        getRecord<TodayRecord>("today", dayId),
      ]);
      if (!active) return;
      if (preference?.value === 10 || preference?.value === 45 || preference?.value === 90) setMode(preference.value);
      if (today?.completed) setCompleted(today.completed);
      setSaveState("saved");
      setReady(true);
    }
    void restore().catch(() => { if (active) { setSaveState("unavailable"); setReady(true); } });
    return () => { active = false; };
  }, [dayId]);

  async function selectMode(nextMode: PlanMode) {
    setMode(nextMode);
    setCompleted([]);
    setReplacements({});
    setAiTasks(null);
    if (saveState === "unavailable") return;
    setSaveState("saving");
    try {
      await Promise.all([
        putRecord("preferences", { id: "plan-mode", value: nextMode }),
        putRecord("today", { id: dayId, completed: [] }),
      ]);
      setSaveState("saved");
    } catch { setSaveState("unavailable"); }
  }

  async function reshapeWithAi() {
    setReshapeState("RESHAPING…");
    const result = await requestAi<GeneratedPlan>({ capability: "daily-plan", minutes: mode, focus: "balanced IELTS and international work English", evidence: [] });
    if (!result.ok) { setReshapeState(result.message); return; }
    if (!validateGeneratedPlan(result.data, mode)) { setReshapeState("INVALID PLAN — ORIGINAL KEPT"); return; }
    setAiTasks(result.data.tasks);
    setReshapeState("AI PLAN READY");
    try { await putRecord("generated-plans", { id: dayId, tasks: result.data.tasks, createdAt: Date.now() }); } catch { /* The plan remains usable for this session. */ }
  }

  async function toggleTask(taskId: string) {
    const next = completed.includes(taskId)
      ? completed.filter((id) => id !== taskId)
      : [...completed, taskId];
    setCompleted(next);
    if (saveState === "unavailable") return;
    setSaveState("saving");
    try {
      await putRecord("today", { id: dayId, completed: next });
      setSaveState("saved");
    } catch { setSaveState("unavailable"); }
  }

  function replaceTask(task: TodayTask) {
    const alternatives = ALTERNATES[task.minutes] ?? [];
    if (alternatives.length === 0) return;
    setReplacements((current) => ({ ...current, [task.id]: ((current[task.id] ?? -1) + 1) % alternatives.length }));
  }

  const completedCount = tasks.filter((task) => completed.includes(task.id)).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <section className="today-board" aria-busy={!ready}>
      <div className="today-toolbar">
        <div className="mode-switcher" aria-label="Daily plan length">
          {MODES.map((item) => (
            <button className={mode === item.value ? "mode-button is-selected" : "mode-button"}
              key={item.value} type="button" onClick={() => void selectMode(item.value)}>
              <strong>{item.value}</strong><span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className={`save-indicator ${saveState}`} role="status">
          <span aria-hidden="true">{saveState === "saved" ? "●" : "○"}</span>
          {saveState === "loading" && "Checking this device…"}
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Saved on this device"}
          {saveState === "unavailable" && "Device saving unavailable"}
        </div>
        <button className="reshape-button" type="button" onClick={() => void reshapeWithAi()}>RESHAPE WITH AI</button>
        <span className="reshape-state" role="status">{reshapeState}</span>
      </div>

      {saveState === "unavailable" && (
        <div className="storage-warning" role="alert">当前浏览器无法使用 IndexedDB。你仍可查看计划，但刷新后完成状态不会保留。</div>
      )}

      <div className="progress-row">
        <div><span>Today</span><strong>{completedCount} / {tasks.length}</strong></div>
        <div className="progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
        <span>{progress}%</span>
      </div>

      <div className="task-list">
        {tasks.map((task, index) => {
          const done = completed.includes(task.id);
          return (
            <article className={`task-card accent-${task.accent} ${done ? "is-done" : ""}`} key={task.id}>
              <button className="task-check" type="button" onClick={() => void toggleTask(task.id)} aria-pressed={done} aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${task.title}`}>
                {done ? "✓" : String(index + 1).padStart(2, "0")}
              </button>
              <div className="task-copy"><span>{task.module}</span><h2>{task.title}</h2><p>{task.detail}</p><Link className="task-open" href={task.href}>OPEN PRACTICE ↗</Link></div>
              <div className="task-meta"><strong>{task.minutes}</strong><span>MIN</span><button type="button" onClick={() => replaceTask(task)}>换一个</button></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
