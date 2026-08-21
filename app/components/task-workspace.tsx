"use client";

import Link from "next/link";
import { useState } from "react";

import type { FeedbackResult, TaskType, TodayTask } from "../lib/models";
import type { AiProviderId } from "../lib/ai-availability";
import { completeFeedbackTaskAttempt, completeTaskWithoutAi, type TaskCompletionClient } from "../lib/task-completion";
import { clearTaskDraft, getTaskDraftStorage, readTaskDraft, writeTaskDraft } from "../lib/task-draft";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { createAttempt, transitionAttempt } from "../lib/task-attempt";
import { useAuth } from "./auth-provider";
import { AiModelControl } from "./ai-model-control";
import { FeedbackReport } from "./feedback-report";
import { TaskInput } from "./task-input";

type SaveState = "idle" | "saving" | "saved" | "error";
type SelectedRecording = { blob: Blob; durationSeconds: number };

function localDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function taskTypeFor(task: TodayTask): TaskType {
  return task.module === "Speaking" ? "speaking" : "writing";
}

function feedbackErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Feedback could not be requested. Please retry.";
  const message = "message" in error && typeof error.message === "string" ? error.message : null;
  return message || "Feedback could not be requested. Please retry.";
}

async function readPartialFeedbackFailure(error: unknown): Promise<{ message: string; transcript: string | null }> {
  const context = error && typeof error === "object" && "context" in error ? error.context : null;
  if (context && typeof context === "object" && "json" in context && typeof context.json === "function") {
    try {
      const body = await context.json() as { error?: unknown; transcript?: unknown };
      return { message: typeof body.error === "string" ? body.error : feedbackErrorMessage(error), transcript: typeof body.transcript === "string" ? body.transcript : null };
    } catch {
      // Fall through to the stable client message.
    }
  }
  return { message: feedbackErrorMessage(error), transcript: null };
}

function isFeedbackResult(value: unknown): value is FeedbackResult {
  if (!value || typeof value !== "object") return false;
  const feedback = value as Partial<FeedbackResult>;
  return typeof feedback.transcript === "string"
    && typeof feedback.assessment === "string"
    && typeof feedback.revisedExample === "string"
    && Boolean(feedback.rubric && Object.values(feedback.rubric).every((result) => result && typeof result.score === "number" && typeof result.evidence === "string"))
    && Array.isArray(feedback.corrections)
    && Array.isArray(feedback.improvements)
    && Array.isArray(feedback.observations)
    && Array.isArray(feedback.nextActions);
}

export function TaskWorkspace({ task }: { task: TodayTask }) {
  const auth = useAuth();
  return <TaskWorkspaceContent key={`${task.id}:${auth.user?.id ?? "device"}`} task={task} {...auth} />;
}

function TaskWorkspaceContent({ task, user, loading, configured }: {
  task: TodayTask;
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  configured: boolean;
}) {
  const draftScope = user?.id ?? "device";
  const [draftStorage] = useState(() => getTaskDraftStorage());
  const [attempt, setAttempt] = useState(() => transitionAttempt(
    createAttempt(task.id, taskTypeFor(task)),
    { type: "input-updated", inputText: readTaskDraft(getTaskDraftStorage(), draftScope, task.id) },
  ));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [draftSaved, setDraftSaved] = useState<boolean | null>(() => draftStorage === null ? false : null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<SelectedRecording | null>(null);
  const [aiChoice, setAiChoice] = useState<{ provider: AiProviderId; model: string; available: boolean }>({ provider: "deepseek", model: "deepseek-chat", available: false });
  const isSignedIn = Boolean(user);

  function updateInput(inputText: string) {
    setAttempt((current) => transitionAttempt(current, { type: "input-updated", inputText }));
    setDraftSaved(writeTaskDraft(draftStorage, draftScope, task.id, inputText));
  }

  async function submitForFeedback() {
    if (!attempt.inputText.trim() && !selectedRecording) {
      setSaveMessage("Add a response or choose a recording before asking for feedback.");
      return;
    }
    setAttempt((current) => transitionAttempt(current, { type: "submit" }));
    setSaveMessage(null);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Cloud feedback is unavailable in this build.");
      const body = new FormData();
      body.set("taskId", task.id);
      body.set("taskType", attempt.taskType);
      body.set("text", attempt.inputText);
      body.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      body.set("provider", aiChoice.provider);
      body.set("model", aiChoice.model);
      if (selectedRecording) {
        body.set("audio", selectedRecording.blob, "today-attempt.webm");
      }
      const { data, error } = await client.functions.invoke("evaluate-attempt", { body });
      if (error) {
        const partial = await readPartialFeedbackFailure(error);
        const transcript = partial.transcript;
        if (transcript) {
          setAttempt((current) => transitionAttempt(current, { type: "partial-transcript", transcript, message: partial.message }));
          setDraftSaved(writeTaskDraft(draftStorage, draftScope, task.id, transcript));
          setSelectedRecording(null);
          return;
        }
        throw new Error(partial.message);
      }
      const response = data as { attemptId?: unknown; feedback?: unknown } | null;
      const feedback = response?.feedback;
      const attemptId = response?.attemptId;
      if (typeof attemptId !== "string" || !isFeedbackResult(feedback)) throw new Error("Feedback returned an invalid response. Please retry.");
      setAttempt((current) => transitionAttempt(current, { type: "feedback", feedback, attemptId }));
      setSelectedRecording(null);
    } catch (error) {
      setAttempt((current) => transitionAttempt(current, { type: "failure", message: feedbackErrorMessage(error) }));
    }
  }

  async function completeFeedback() {
    if (!user || !attempt.attemptId) return;
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Cloud saving is unavailable.");
      const completionClient: TaskCompletionClient = { rpc: async (name, args) => await client.rpc(name, args as never) };
      await completeFeedbackTaskAttempt(completionClient, { attemptId: attempt.attemptId });
      setAttempt((current) => transitionAttempt(current, { type: "complete" }));
      clearTaskDraft(draftStorage, draftScope, task.id);
      setSaveState("saved");
      setSaveMessage("Completed and saved to your account.");
    } catch {
      setSaveState("error");
      setSaveMessage("We could not save this completion. Please try again.");
    }
  }

  async function completeWithoutFeedback() {
    if (!user || !getSupabaseBrowserClient()) return;
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Cloud saving is unavailable.");
      const completionClient: TaskCompletionClient = {
        rpc: async (name, args) => await client.rpc(name, args),
      };
      await completeTaskWithoutAi(completionClient, { localDate: localDateKey(), task, inputText: attempt.inputText });
      setAttempt((current) => transitionAttempt(current, { type: "complete-without-feedback" }));
      clearTaskDraft(draftStorage, draftScope, task.id);
      setSaveState("saved");
      setSaveMessage("Completed and saved to your account.");
    } catch {
      setSaveState("error");
      setSaveMessage("We could not save this completion. Please try again.");
    }
  }

  return (
    <section className="task-workspace" aria-labelledby="task-title">
      <div className="task-workspace-heading">
        <div>
          <p className="eyebrow">{task.module} · {task.minutes} minutes</p>
          <h1 id="task-title">{task.title}</h1>
          <p>{task.detail}</p>
        </div>
        <Link className="task-back" href="/">Back to Today</Link>
      </div>

      {!loading && !isSignedIn && (
        <div className="task-login-note" role="status">
          {configured ? <><strong>Sign in to save this task.</strong><Link href="/login">Sign in to continue</Link></> : <strong>Cloud practice is not configured in this build.</strong>}
        </div>
      )}

      <div className="task-workspace-grid">
        <div className="task-panel">
          <AiModelControl capability={selectedRecording ? "transcription" : "structured-text"} value={aiChoice.provider} onChange={(provider, model, available) => setAiChoice({ provider, model, available })} />
          <TaskInput
            taskType={attempt.taskType}
            value={attempt.inputText}
            onChange={updateInput}
            disabled={attempt.status === "submitting" || attempt.status === "completed"}
            onRecording={(blob, durationSeconds) => setSelectedRecording({ blob, durationSeconds })}
            onRecordingCleared={() => setSelectedRecording(null)}
          />
          {selectedRecording && <p className="recording-selection" role="status">A {selectedRecording.durationSeconds}-second recording is ready for secure transcription and feedback. It is not retained by default.</p>}
          <p className={`task-save-state ${saveState}`} role="status">
            {loading && "Checking your account…"}
            {!loading && !isSignedIn && (configured ? "Sign in before completing this task." : "Cloud saving is unavailable in this build.")}
            {saveState === "idle" && (draftSaved === true ? "Draft saved in this browser." : draftSaved === false ? "This browser could not save a draft. Keep this page open while you practice." : "Your draft will be saved in this browser as you type.")}
            {isSignedIn && saveState === "saving" && "Saving your completion…"}
            {isSignedIn && saveState === "saved" && "Saved to your account."}
            {isSignedIn && saveState === "error" && "Saving needs another try."}
          </p>
        </div>

        <aside className="task-panel task-feedback" aria-live="polite">
          <p className="section-kicker">Practice feedback</p>
          {attempt.status === "feedback-ready" && attempt.feedback ? <FeedbackReport feedback={attempt.feedback} />
          : attempt.status === "submitting" ? <p>Preparing your response for secure feedback…</p>
            : attempt.status === "failed" ? <p>{attempt.errorMessage}</p>
              : attempt.status === "completed" ? <p>This task is complete. Feedback can be added on a future attempt.</p>
                : <p>Feedback will appear here after a secure evaluation.</p>}
        </aside>
      </div>

      {saveMessage && <p className="task-message" role="status">{saveMessage}</p>}
      <div className="task-actions">
        {attempt.status === "failed" && <button className="secondary-action" type="button" onClick={() => setAttempt((current) => transitionAttempt(current, { type: "retry" }))}>Retry feedback</button>}
        {attempt.status !== "completed" && <button className="secondary-action" type="button" onClick={() => void submitForFeedback()} disabled={!isSignedIn || !aiChoice.available || attempt.status === "submitting"}>Submit for feedback</button>}
        {attempt.status === "feedback-ready" && <button className="primary-action" type="button" onClick={() => void completeFeedback()} disabled={saveState === "saving"}>Complete task</button>}
        {(attempt.status === "draft" || attempt.status === "failed") && <button className="primary-action" type="button" onClick={() => void completeWithoutFeedback()} disabled={!isSignedIn || saveState === "saving"}>Complete without AI feedback</button>}
      </div>
    </section>
  );
}
