import type { PlanMode, TodayTask } from "./models";

const PLANS: Record<PlanMode, TodayTask[]> = {
  10: [
    { id: "think-quick", module: "Speaking", title: "Think in English", detail: "看一个情境，用英语连续说 30 秒。", minutes: 5, accent: "coral", href: "/practice/speaking/" },
    { id: "ielts-quick", module: "IELTS", title: "One question, fully understood", detail: "做一道阅读题，并写下错误原因。", minutes: 5, accent: "blue", href: "/ielts/" },
  ],
  45: [
    { id: "portfolio-speak", module: "Speaking", title: "Explain one design decision", detail: "不用中文打草稿，讲清一个作品中的取舍。", minutes: 20, accent: "coral", href: "/practice/speaking/" },
    { id: "ielts-reading", module: "IELTS", title: "Reading accuracy sprint", detail: "完成一小组机考阅读题，标记定位依据。", minutes: 15, accent: "blue", href: "/ielts/" },
    { id: "career-evidence", module: "Career", title: "Build one portfolio sentence", detail: "把一次设计成果写成可用于面试的英文证据。", minutes: 10, accent: "sage", href: "/practice/writing/" },
  ],
  90: [
    { id: "deep-speaking", module: "Speaking", title: "Case-study rehearsal", detail: "完成一次五分钟作品集讲演并复盘卡顿。", minutes: 25, accent: "coral", href: "/practice/speaking/" },
    { id: "deep-ielts", module: "IELTS", title: "Computer Reading set", detail: "在计时界面完成阅读练习。", minutes: 25, accent: "blue", href: "/ielts/" },
    { id: "design-input", module: "Language", title: "Design-driven input", detail: "观看设计演讲并写一段 Design Breakdown。", minutes: 15, accent: "sage", href: "/language-lab/" },
    { id: "career-story", module: "Career", title: "Strengthen a project story", detail: "补充痛点、决策和影响证据。", minutes: 15, accent: "coral", href: "/career/" },
    { id: "route-step", module: "Route", title: "Singapore route check", detail: "整理一个目标岗位要求。", minutes: 10, accent: "blue", href: "/route-map/" },
  ],
};

export function buildTodayPlan(mode: PlanMode): TodayTask[] {
  return PLANS[mode].map((task) => ({ ...task }));
}
