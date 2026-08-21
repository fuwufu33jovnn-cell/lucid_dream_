"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { formatRecordingDuration, pickSupportedMimeType, RecordingSession, type RecordingSessionState } from "../lib/recording";

const AUDIO_NOTICE_KEY = "lucid-dream:audio-transcription-notice:acknowledged";

type RecordingControlProps = {
  disabled?: boolean;
  onRecording: (blob: Blob, durationSeconds: number) => void;
  onRecordingCleared: () => void;
};

function supportsRecording(): boolean {
  return typeof window !== "undefined"
    && typeof navigator !== "undefined"
    && typeof navigator.mediaDevices?.getUserMedia === "function"
    && typeof MediaRecorder !== "undefined"
    && pickSupportedMimeType(MediaRecorder) !== null;
}

function subscribeToBrowserCapabilities() {
  return () => {};
}

function readNoticeAcknowledgement(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUDIO_NOTICE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveNoticeAcknowledgement(): void {
  try {
    window.localStorage.setItem(AUDIO_NOTICE_KEY, "true");
  } catch {
    // The acknowledgement remains valid for this mounted browser session.
  }
}

function idleState(noticeAcknowledged: boolean): RecordingSessionState {
  return {
    phase: "idle",
    elapsedSeconds: 0,
    durationSeconds: 0,
    previewUrl: null,
    pendingBlob: null,
    noticeAcknowledged,
    status: "Ready to record up to five minutes.",
  };
}

function requestBrowserStream() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

function createBrowserRecorder(stream: import("../lib/recording").RecordingStream, mimeType: string) {
  return new MediaRecorder(stream as MediaStream, { mimeType }) as unknown as import("../lib/recording").RecordingRecorder;
}

function browserNow() { return Date.now(); }
function browserSetTimeout(callback: () => void, delay: number) { return window.setTimeout(callback, delay); }
function browserClearTimeout(id: unknown) { window.clearTimeout(id as number); }
function browserSetInterval(callback: () => void, delay: number) { return window.setInterval(callback, delay); }
function browserClearInterval(id: unknown) { window.clearInterval(id as number); }
function createBrowserObjectUrl(blob: Blob) { return URL.createObjectURL(blob); }
function revokeBrowserObjectUrl(url: string) { URL.revokeObjectURL(url); }

export function RecordingControl({ disabled = false, onRecording, onRecordingCleared }: RecordingControlProps) {
  const recordingSupported = useSyncExternalStore(subscribeToBrowserCapabilities, supportsRecording, () => false);
  const [sessionState, setSessionState] = useState(() => idleState(readNoticeAcknowledgement()));
  const [session] = useState(() =>
    new RecordingSession({
      mimeType: "audio/webm",
      noticeAcknowledged: sessionState.noticeAcknowledged,
      requestStream: requestBrowserStream,
      createRecorder: createBrowserRecorder,
      now: browserNow,
      setTimeout: browserSetTimeout,
      clearTimeout: browserClearTimeout,
      setInterval: browserSetInterval,
      clearInterval: browserClearInterval,
      createObjectUrl: createBrowserObjectUrl,
      revokeObjectUrl: revokeBrowserObjectUrl,
      onStateChange: setSessionState,
      onRecording,
      onCleared: onRecordingCleared,
      onNoticeAcknowledged: saveNoticeAcknowledgement,
    }),
  );

  useEffect(() => () => session.dispose(), [session]);

  const isActive = sessionState.phase === "recording" || sessionState.phase === "requesting" || sessionState.phase === "stopping";
  const displayedSeconds = sessionState.phase === "recording" || sessionState.phase === "stopping" ? sessionState.elapsedSeconds : sessionState.durationSeconds;

  async function startRecording() {
    const mimeType = pickSupportedMimeType(MediaRecorder);
    if (!mimeType || disabled || !recordingSupported || isActive) return;
    await session.start(mimeType);
  }

  return (
    <section className="recording-control" aria-labelledby="recording-heading">
      <div className="recording-control-heading">
        <div>
          <p className="section-kicker" id="recording-heading">Optional audio response</p>
          <p>Record a spoken response, then listen before you choose it for feedback.</p>
        </div>
        <strong aria-label={`Recording time ${formatRecordingDuration(displayedSeconds)}`}>{formatRecordingDuration(displayedSeconds)} / 5:00</strong>
      </div>

      <div className="recording-actions">
        <button className="secondary-action" type="button" onClick={() => void startRecording()} disabled={disabled || !recordingSupported || isActive}>Record</button>
        <button className="secondary-action" type="button" onClick={() => session.stop()} disabled={sessionState.phase !== "recording"}>Stop</button>
        <button className="secondary-action" type="button" onClick={() => session.discard()} disabled={sessionState.phase === "idle" && !sessionState.pendingBlob}>Discard recording</button>
      </div>

      {sessionState.previewUrl && <audio className="recording-preview" controls src={sessionState.previewUrl} aria-label="Recorded audio preview" />}

      {sessionState.pendingBlob && !sessionState.noticeAcknowledged && (
        <div className="audio-processing-notice" role="region" aria-label="Audio processing notice">
          <p>Before submitting this recording: audio is sent for transcription and is not retained by default. This acknowledgement applies only on this device.</p>
          <button className="primary-action" type="button" onClick={() => session.acknowledgeAndSelect()} disabled={disabled}>I understand — use recording</button>
        </div>
      )}

      {sessionState.pendingBlob && sessionState.noticeAcknowledged && <button className="primary-action" type="button" onClick={() => session.selectRecording()} disabled={disabled}>Use recording for feedback</button>}
      <p className="recording-status" role="status" aria-live="polite">{recordingSupported ? sessionState.status : "Recording is unavailable in this browser. You can use text instead."}</p>
    </section>
  );
}
