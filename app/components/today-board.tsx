"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "./auth-provider";
import { getRecord, isIndexedDbAvailable, putRecord } from "../lib/indexed-db";
import type { PlanMode, StoredRecord } from "../lib/models";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { buildTodayPlan, todayTaskHref } from "../lib/today";

type PreferenceRecord = StoredRecord & { value: PlanMode };
type SaveState = "loading" | "saved" | "saving" | "unavailable";

const MODES: Array<{ value: PlanMode; label: string }> = [
  { value: 10, label: "Low energy" },
  { value: 45, label: "Normal" },
  { value: 90, label: "Immersive" },
];

function localDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function TodayBoard() {
  const { user, loading, configured } = useAuth();
  const [mode, setMode] = useState<PlanMode>(45);
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const baseTasks = useMemo(() => buildTodayPlan(mode), [mode]);
  const tasks = baseTasks;

  useEffect(() => {
    let active = true;
    async function restorePreference() {
      if (!(await isIndexedDbAvailable())) {
        if (active) { setSaveState("unavailable"); setReady(true); }
        return;
      }
      const preference = await getRecord<PreferenceRecord>("preferences", "plan-mode");
      if (!active) return;
      if (preference?.value === 10 || preference?.value === 45 || preference?.value === 90) setMode(preference.value);
      setSaveState("saved");
      setReady(true);
    }
    void restorePreference().catch(() => { if (active) { setSaveState("unavailable"); setReady(true); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreCloudProgress() {
      if (loading || !user) {
        if (!loading && active) setCompleted([]);
        return;
      }
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) setSyncMessage("Cloud progress is unavailable in this build.");
        return;
      }
      const { data: plan, error: planError } = await client
        .from("daily_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("local_date", localDateKey())
        .maybeSingle();
      if (planError || !plan) {
        if (active) { setCompleted([]); setSyncMessage(planError ? "Could not load account progress." : null); }
        return;
      }
      const { data: attempts, error: attemptsError } = await client
        .from("task_attempts")
        .select("task_id")
        .eq("user_id", user.id)
        .eq("plan_id", plan.id)
        .eq("status", "completed");
      if (active) {
        setCompleted(attemptsError ? [] : [...new Set((attempts ?? []).map((attempt) => attempt.task_id))]);
        setSyncMessage(attemptsError ? "Could not load account progress." : null);
      }
    }
    void restoreCloudProgress();
    return () => { active = false; };
  }, [loading, mode, user]);

  async function selectMode(nextMode: PlanMode) {
    setMode(nextMode);
    setCompleted([]);
    if (saveState === "unavailable") return;
    setSaveState("saving");
    try {
      await putRecord("preferences", { id: "plan-mode", value: nextMode });
      setSaveState("saved");
    } catch { setSaveState("unavailable"); }
  }

  const completedCount = tasks.filter((task) => completed.includes(task.id)).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <section className="today-board" aria-busy={!ready || loading}>
      <div className="today-toolbar">
        <div className="mode-switcher" aria-label="Daily plan length">
          {MODES.map((item) => (
            <button className={mode === item.value ? "mode-button is-selected" : "mode-button"} key={item.value} type="button" onClick={() => void selectMode(item.value)}>
              <strong>{item.value}</strong><span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className={`save-indicator ${saveState}`} role="status">
          <span aria-hidden="true">{saveState === "saved" ? "●" : "○"}</span>
          {saveState === "loading" && "Checking this device…"}
          {saveState === "saving" && "Saving plan preference…"}
          {saveState === "saved" && "Plan preference saved on this device"}
          {saveState === "unavailable" && "Device preference saving unavailable"}
        </div>
      </div>

      {saveState === "unavailable" && <div className="storage-warning" role="alert">当前浏览器无法保存计划偏好。你的完成进度仍只会从账号记录读取。</div>}
      {!loading && !user && <div className="storage-warning" role="status">{configured ? <><strong>Sign in to sync Today progress.</strong> <Link href="/login">Sign in</Link></> : "Cloud practice is not configured in this build."}</div>}
      {syncMessage && <div className="storage-warning" role="status">{syncMessage}</div>}

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
              <span className="task-check" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <div className="task-copy"><span>{task.module}</span><h2>{task.title}</h2><p>{task.detail}</p></div>
              <div className="task-meta"><strong>{task.minutes}</strong><span>MIN</span><Link className="task-start" href={todayTaskHref(task)}>Start task</Link></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
