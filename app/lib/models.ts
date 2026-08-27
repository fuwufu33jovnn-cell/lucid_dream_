export type PlanMode = 10 | 45 | 90;

export type TodayModule = "Speaking" | "IELTS" | "Career" | "Language" | "Route";

export type TodayTask = {
  id: string;
  module: TodayModule;
  title: string;
  detail: string;
  minutes: number;
  accent: "blue" | "coral" | "sage";
};

export type StoredRecord = { id: string; [key: string]: unknown };

export type ActivityProgress = StoredRecord & {
  notice: string;
  savedLanguage: string;
  shadowNote: string;
  speakingOutline: string;
  completedAt: number | null;
  updatedAt: number;
};
