import { AppShell } from "../../components/app-shell";
import { TaskWorkspace } from "../../components/task-workspace";
import { getTodayTask, getTodayTaskIds } from "../../lib/today";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTodayTaskIds().map((taskId) => ({ taskId }));
}

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = getTodayTask(taskId);

  if (!task) notFound();

  return <AppShell active="today"><TaskWorkspace task={task} /></AppShell>;
}
