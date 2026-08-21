import type { AttemptStatus, FeedbackResult, TaskType } from "./models";

export type AttemptState = {
  taskId: string;
  taskType: TaskType;
  inputText: string;
  status: AttemptStatus;
  feedback: FeedbackResult | null;
  attemptId: string | null;
  errorMessage: string | null;
};

export type AttemptEvent =
  | { type: "input-updated"; inputText: string }
  | { type: "submit" }
  | { type: "feedback"; feedback: FeedbackResult; attemptId: string }
  | { type: "failure"; message: string }
  | { type: "partial-transcript"; transcript: string; message: string }
  | { type: "retry" }
  | { type: "complete" }
  | { type: "complete-without-feedback" };

export function createAttempt(taskId: string, taskType: TaskType): AttemptState {
  return {
    taskId,
    taskType,
    inputText: "",
    status: "draft",
    feedback: null,
    attemptId: null,
    errorMessage: null,
  };
}

function isValidFeedback(feedback: FeedbackResult): boolean {
  return Boolean(
    (feedback.assessment?.trim() || (feedback as FeedbackResult & { overall?: string }).overall?.trim())
    && Object.keys(feedback.rubric).length > 0
    && Object.values(feedback.rubric).every((result) => Number.isFinite(result.score) && Boolean(result.evidence.trim()))
    && feedback.nextActions.length > 0,
  );
}

export function transitionAttempt(state: AttemptState, event: AttemptEvent): AttemptState {
  if (event.type === "input-updated" && state.status !== "submitting" && state.status !== "completed") {
    return { ...state, inputText: event.inputText, status: "draft", errorMessage: null };
  }

  if (event.type === "submit" && (state.status === "draft" || state.status === "failed")) {
    return { ...state, status: "submitting", errorMessage: null };
  }

  if (event.type === "feedback" && state.status === "submitting" && isValidFeedback(event.feedback)) {
    return { ...state, feedback: event.feedback, attemptId: event.attemptId, status: "feedback-ready", errorMessage: null };
  }

  if (event.type === "failure" && state.status === "submitting") {
    return { ...state, status: "failed", errorMessage: event.message };
  }

  if (event.type === "partial-transcript" && state.status === "submitting" && event.transcript.trim()) {
    return { ...state, inputText: event.transcript, status: "failed", errorMessage: event.message };
  }

  if (event.type === "retry" && state.status === "failed") {
    return { ...state, status: "draft", errorMessage: null };
  }

  if (event.type === "complete" && state.status === "feedback-ready") {
    return { ...state, status: "completed", errorMessage: null };
  }

  if (event.type === "complete-without-feedback" && (state.status === "draft" || state.status === "failed")) {
    return { ...state, status: "completed", errorMessage: null };
  }

  return state;
}
