export type TaskDraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function taskDraftKey(scope: string, taskId: string): string {
  return `lucid-dream:task-draft:${scope}:${taskId}`;
}

export function getTaskDraftStorage(): TaskDraftStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readTaskDraft(storage: TaskDraftStorage | null, scope: string, taskId: string): string {
  if (!storage) return "";
  try {
    return storage.getItem(taskDraftKey(scope, taskId)) ?? "";
  } catch {
    return "";
  }
}

export function writeTaskDraft(storage: TaskDraftStorage | null, scope: string, taskId: string, inputText: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(taskDraftKey(scope, taskId), inputText);
    return true;
  } catch {
    // A disabled or full browser store must not block practice.
    return false;
  }
}

export function clearTaskDraft(storage: TaskDraftStorage | null, scope: string, taskId: string): void {
  if (!storage) return;
  try {
    storage.removeItem(taskDraftKey(scope, taskId));
  } catch {
    // A disabled browser store must not make a completed task fail.
  }
}
