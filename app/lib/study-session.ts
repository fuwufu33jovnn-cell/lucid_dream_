const selectedFiles = new Map<string, File>();

export function setStudyFile(file: File): string {
  const id = crypto.randomUUID();
  selectedFiles.set(id, file);
  return id;
}

export function getStudyFile(id: string | null | undefined): File | null {
  return id ? selectedFiles.get(id) ?? null : null;
}

export function clearStudyFile(id: string): void {
  selectedFiles.delete(id);
}
