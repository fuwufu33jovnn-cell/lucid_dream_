export const MAX_RECORDING_SECONDS = 5 * 60;

const AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

type MediaRecorderCapabilities = Pick<typeof MediaRecorder, "isTypeSupported">;

export function pickSupportedMimeType(recorder: MediaRecorderCapabilities): string | null {
  return AUDIO_MIME_TYPES.find((type) => recorder.isTypeSupported(type)) ?? null;
}

export function formatRecordingDuration(durationSeconds: number): string {
  const roundedSeconds = Math.max(0, Math.floor(durationSeconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export type RecordingTrack = { stop: () => void };
export type RecordingStream = { getTracks: () => RecordingTrack[] };
export type RecordingEventName = "dataavailable" | "error" | "stop";
export type RecordingRecorder = {
  state: string;
  start: () => void;
  stop: () => void;
  addEventListener: (type: RecordingEventName, listener: (event: { data?: Blob }) => void) => void;
};

type TimerId = unknown;

export type RecordingSessionState = {
  phase: "idle" | "requesting" | "recording" | "stopping" | "preview" | "error";
  elapsedSeconds: number;
  durationSeconds: number;
  previewUrl: string | null;
  pendingBlob: Blob | null;
  noticeAcknowledged: boolean;
  status: string;
};

export type RecordingSessionOptions = {
  mimeType: string;
  requestStream: () => Promise<RecordingStream>;
  createRecorder: (stream: RecordingStream, mimeType: string) => RecordingRecorder;
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => TimerId;
  clearTimeout: (id: TimerId) => void;
  setInterval: (callback: () => void, delay: number) => TimerId;
  clearInterval: (id: TimerId) => void;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  noticeAcknowledged?: boolean;
  onStateChange?: (state: RecordingSessionState) => void;
  onRecording?: (blob: Blob, durationSeconds: number) => void;
  onCleared?: () => void;
  onNoticeAcknowledged?: () => void;
};

type ActiveRun = {
  stream: RecordingStream;
  recorder: RecordingRecorder;
  mimeType: string;
  startedAt: number;
  chunks: Blob[];
  keep: boolean;
};

export class RecordingSession {
  private readonly options: RecordingSessionOptions;
  private run: ActiveRun | null = null;
  private requestGeneration = 0;
  private elapsedTimer: TimerId | null = null;
  private maximumTimer: TimerId | null = null;
  private previewUrl: string | null = null;
  private blob: Blob | null = null;
  private phase: RecordingSessionState["phase"] = "idle";
  private elapsedSeconds = 0;
  private durationSeconds = 0;
  private noticeAcknowledged: boolean;
  private status = "Ready to record up to five minutes.";

  constructor(options: RecordingSessionOptions) {
    this.options = options;
    this.noticeAcknowledged = options.noticeAcknowledged ?? false;
  }

  get state(): RecordingSessionState {
    return {
      phase: this.phase,
      elapsedSeconds: this.elapsedSeconds,
      durationSeconds: this.durationSeconds,
      previewUrl: this.previewUrl,
      pendingBlob: this.blob,
      noticeAcknowledged: this.noticeAcknowledged,
      status: this.status,
    };
  }

  get pendingBlob(): Blob | null { return this.blob; }
  get currentStream(): RecordingStream | null { return this.run?.stream ?? null; }

  async start(mimeType = this.options.mimeType): Promise<void> {
    this.clearCurrentRecording();
    const requestGeneration = ++this.requestGeneration;
    this.phase = "requesting";
    this.status = "Requesting microphone access…";
    this.notify();

    let stream: RecordingStream;
    try {
      stream = await this.options.requestStream();
    } catch {
      if (requestGeneration !== this.requestGeneration) return;
      this.phase = "error";
      this.status = "Microphone access was not available. You can use text instead.";
      this.notify();
      return;
    }

    if (requestGeneration !== this.requestGeneration) {
      this.stopTracks(stream);
      return;
    }

    let recorder: RecordingRecorder;
    try {
      recorder = this.options.createRecorder(stream, mimeType);
    } catch {
      this.stopTracks(stream);
      this.phase = "error";
      this.status = "Recording could not start. You can use text instead.";
      this.notify();
      return;
    }

    const run: ActiveRun = { stream, recorder, mimeType, startedAt: this.options.now(), chunks: [], keep: true };
    this.run = run;
    recorder.addEventListener("dataavailable", (event) => this.receiveData(run, event.data));
    recorder.addEventListener("error", () => this.handleError(run));
    recorder.addEventListener("stop", () => this.finishRun(run));

    try {
      recorder.start();
    } catch {
      this.handleError(run);
      return;
    }

    this.phase = "recording";
    this.elapsedSeconds = 0;
    this.durationSeconds = 0;
    this.status = "Recording in progress. It will stop automatically after five minutes.";
    this.elapsedTimer = this.options.setInterval(() => this.updateElapsed(run), 250);
    this.maximumTimer = this.options.setTimeout(() => this.stop(), MAX_RECORDING_SECONDS * 1000);
    this.notify();
  }

  stop(): void {
    const run = this.run;
    if (!run || this.phase !== "recording") return;
    this.clearTimers();
    this.phase = "stopping";
    this.elapsedSeconds = this.durationFor(run);
    this.stopTracks(run.stream);
    try {
      if (run.recorder.state !== "inactive") run.recorder.stop();
    } catch {
      this.handleError(run);
      return;
    }
    this.notify();
  }

  discard(shouldNotify = true): void {
    this.requestGeneration += 1;
    const hadRecording = Boolean(this.run || this.blob || this.previewUrl);
    const run = this.run;
    this.run = null;
    if (run) this.retireRun(run, true);
    this.clearTimers();
    this.releasePreview();
    this.blob = null;
    this.elapsedSeconds = 0;
    this.durationSeconds = 0;
    this.phase = "idle";
    this.status = "Recording discarded. You can record again or use text instead.";
    if (hadRecording) this.options.onCleared?.();
    if (shouldNotify) this.notify();
  }

  dispose(): void {
    this.discard(false);
  }

  selectRecording(): boolean {
    if (!this.blob || !this.noticeAcknowledged) return false;
    this.options.onRecording?.(this.blob, this.durationSeconds);
    this.status = "Recording selected for feedback. It remains only in this browser until you submit it.";
    this.notify();
    return true;
  }

  acknowledgeAndSelect(): boolean {
    if (!this.noticeAcknowledged) {
      this.noticeAcknowledged = true;
      this.options.onNoticeAcknowledged?.();
    }
    return this.selectRecording();
  }

  private receiveData(run: ActiveRun, blob: Blob | undefined): void {
    if (this.run !== run || !run.keep || !blob || blob.size === 0) return;
    run.chunks.push(blob);
  }

  private finishRun(run: ActiveRun): void {
    if (this.run !== run || !run.keep) {
      run.chunks.length = 0;
      return;
    }
    this.clearTimers();
    this.stopTracks(run.stream);
    this.run = null;
    const durationSeconds = this.durationFor(run);
    const blob = new Blob(run.chunks, { type: run.mimeType });
    run.chunks.length = 0;
    this.elapsedSeconds = durationSeconds;
    this.durationSeconds = durationSeconds;
    if (blob.size === 0) {
      this.phase = "error";
      this.status = "No audio was captured. Try again or use text instead.";
      this.notify();
      return;
    }
    this.blob = blob;
    this.releasePreview();
    this.previewUrl = this.options.createObjectUrl(blob);
    this.phase = "preview";
    this.status = `Recording ready (${formatRecordingDuration(durationSeconds)}). Review it before using it for feedback.`;
    this.notify();
  }

  private handleError(run: ActiveRun): void {
    if (this.run !== run) {
      run.chunks.length = 0;
      return;
    }
    this.run = null;
    this.retireRun(run, true);
    this.clearTimers();
    this.phase = "error";
    this.status = "Recording failed. Your text notes are still available.";
    this.notify();
  }

  private clearCurrentRecording(): void {
    this.requestGeneration += 1;
    const run = this.run;
    this.run = null;
    if (run) this.retireRun(run, true);
    this.clearTimers();
    const hadPreview = Boolean(this.blob || this.previewUrl);
    this.releasePreview();
    this.blob = null;
    this.elapsedSeconds = 0;
    this.durationSeconds = 0;
    if (run || hadPreview) this.options.onCleared?.();
  }

  private retireRun(run: ActiveRun, stopRecorder: boolean): void {
    run.keep = false;
    run.chunks.length = 0;
    if (stopRecorder) {
      try {
        if (run.recorder.state !== "inactive") run.recorder.stop();
      } catch {
        // Track cleanup still releases microphone access.
      }
    }
    this.stopTracks(run.stream);
  }

  private updateElapsed(run: ActiveRun): void {
    if (this.run !== run || this.phase !== "recording") return;
    this.elapsedSeconds = this.durationFor(run);
    this.notify();
  }

  private durationFor(run: ActiveRun): number {
    return Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.round((this.options.now() - run.startedAt) / 1000)));
  }

  private releasePreview(): void {
    if (!this.previewUrl) return;
    this.options.revokeObjectUrl(this.previewUrl);
    this.previewUrl = null;
  }

  private clearTimers(): void {
    if (this.elapsedTimer !== null) this.options.clearInterval(this.elapsedTimer);
    if (this.maximumTimer !== null) this.options.clearTimeout(this.maximumTimer);
    this.elapsedTimer = null;
    this.maximumTimer = null;
  }

  private stopTracks(stream: RecordingStream): void {
    stream.getTracks().forEach((track) => track.stop());
  }

  private notify(): void {
    this.options.onStateChange?.(this.state);
  }
}
