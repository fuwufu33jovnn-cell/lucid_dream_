"use client";

import type { TaskType } from "../lib/models";
import { RecordingControl } from "./recording-control";

type TaskInputProps = {
  taskType: TaskType;
  value: string;
  disabled: boolean;
  onChange: (inputText: string) => void;
  onRecording: (blob: Blob, durationSeconds: number) => void;
  onRecordingCleared: () => void;
};

export function TaskInput({ taskType, value, disabled, onChange, onRecording, onRecordingCleared }: TaskInputProps) {
  const isSpeaking = taskType === "speaking";

  return (
    <>
      <p className="section-kicker">Your {isSpeaking ? "speaking notes" : "written response"}</p>
      <label className="task-input-label" htmlFor="task-response">Keep the meaning concrete and use evidence where you can.</label>
      <textarea
        id="task-response"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={isSpeaking ? "Outline what you will say, then record your response if you want audio feedback." : "Write your response here."}
        disabled={disabled}
      />
      {isSpeaking ? <RecordingControl disabled={disabled} onRecording={onRecording} onRecordingCleared={onRecordingCleared} /> : <p className="task-input-note">Writing tasks use text responses.</p>}
    </>
  );
}
