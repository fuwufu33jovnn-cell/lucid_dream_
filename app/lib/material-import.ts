export type ImportKind = "link" | "subtitle" | "text" | "pdf" | "audio" | "video" | "unsupported";
export type ImportJobState = "queued" | "processing" | "ready" | "needs-input" | "failed" | "deleted";

export const IMPORT_LIMITS = {
  maxFileBytes: 50 * 1024 * 1024,
  maxRemoteRedirects: 3,
} as const;

export type ImportFileDescriptor = { name: string; type: string };

const subtitleExtensions = new Set(["srt", "vtt"]);
const textExtensions = new Set(["txt"]);
const audioExtensions = new Set(["mp3", "m4a", "wav", "ogg", "webm"]);
const videoExtensions = new Set(["mp4", "mov", "webm"]);

function extensionFor(name: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(name.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

export function classifyImport(input: string | ImportFileDescriptor): ImportKind {
  if (typeof input === "string") return /^https:\/\//i.test(input.trim()) ? "link" : "unsupported";
  const extension = extensionFor(input.name);
  const mime = input.type.toLowerCase();
  if (subtitleExtensions.has(extension) || mime === "text/vtt") return "subtitle";
  if (textExtensions.has(extension) || mime === "text/plain") return "text";
  if (extension === "pdf" || mime === "application/pdf") return "pdf";
  if (audioExtensions.has(extension) || mime.startsWith("audio/")) return "audio";
  if (videoExtensions.has(extension) || mime.startsWith("video/")) return "video";
  return "unsupported";
}

export function safeFileName(value: string): string {
  const leaf = value.trim().split(/[\\/]/).pop() ?? "upload";
  const dot = leaf.lastIndexOf(".");
  const rawBase = dot > 0 ? leaf.slice(0, dot) : leaf;
  const rawExtension = dot > 0 ? leaf.slice(dot + 1) : "";
  const base = rawBase.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "upload";
  const extension = rawExtension.replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  return extension ? `${base}.${extension}` : base;
}

function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function buildPrivateUploadPath(userId: string, materialId: string, fileName: string): string {
  if (!uuid(userId) || !uuid(materialId)) throw new Error("A valid owner and material ID are required.");
  return `${userId}/${materialId}/${safeFileName(fileName)}`;
}

export const ACCEPTED_IMPORT_TYPES = ".srt,.vtt,.txt,.pdf,audio/*,video/*";
