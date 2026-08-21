export type PlanMode = 10 | 45 | 90;

export type TodayModule = "Speaking" | "IELTS" | "Career" | "Language" | "Route";

export type TodayTask = {
  id: string;
  planMode: PlanMode;
  module: TodayModule;
  title: string;
  detail: string;
  minutes: number;
  accent: "blue" | "coral" | "sage";
};

export type TaskType = "speaking" | "writing";

export type FeedbackResult = {
  transcript: string;
  assessment: string;
  rubric: Record<string, { score: number; evidence: string }>;
  corrections: string[];
  improvements: string[];
  observations: string[];
  nextActions: string[];
  revisedExample: string;
};

export type AttemptStatus = "draft" | "submitting" | "feedback-ready" | "completed" | "failed";

export type StoredRecord = { id: string; [key: string]: unknown };
