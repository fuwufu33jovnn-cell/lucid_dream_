import type { TaskType, TodayTask } from "./models.ts";
import { buildTodayPlan } from "./today.ts";

type CompletionArgs = {
  p_local_date: string;
  p_mode: 10 | 45 | 90;
  p_tasks: TodayTask[];
  p_task_id: string;
  p_task_type: TaskType;
  p_input_text: string | null;
  p_skill: string;
  p_minutes: number;
};

export type TaskCompletionClient = {
  rpc: (functionName: "complete_task_without_ai" | "complete_feedback_task_attempt", args: CompletionArgs | FeedbackCompletionArgs) => Promise<{ data: string | null; error: unknown | null }>;
};

type FeedbackCompletionArgs = {
  p_attempt_id: string;
};

export async function completeTaskWithoutAi(
  client: TaskCompletionClient,
  { localDate, task, inputText }: { localDate: string; task: TodayTask; inputText: string },
): Promise<string> {
  const taskType: TaskType = task.module === "Speaking" ? "speaking" : "writing";
  const { data, error } = await client.rpc("complete_task_without_ai", {
    p_local_date: localDate,
    p_mode: task.planMode,
    p_tasks: buildTodayPlan(task.planMode),
    p_task_id: task.id,
    p_task_type: taskType,
    p_input_text: inputText || null,
    p_skill: task.module,
    p_minutes: task.minutes,
  });
  if (error) throw error;
  if (!data) throw new Error("Cloud completion did not return an attempt ID.");
  return data;
}

export async function completeFeedbackTaskAttempt(
  client: TaskCompletionClient,
  { attemptId }: { attemptId: string },
): Promise<string> {
  const { data, error } = await client.rpc("complete_feedback_task_attempt", {
    p_attempt_id: attemptId,
  });
  if (error) throw error;
  if (!data) throw new Error("Cloud completion did not return an attempt ID.");
  return data;
}
