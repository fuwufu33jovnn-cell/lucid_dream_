"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAiStatus, requestAi } from "../lib/ai-client";
import { validateSpeakingFeedback, validateWritingFeedback, type SpeakingFeedback, type WritingFeedback } from "../lib/ai-contracts";
import { putRecord } from "../lib/indexed-db";

export function PracticeStudio({ kind }: { kind: "writing" | "speaking" }) {
  const writing = kind === "writing";
  const [prompt, setPrompt] = useState(writing ? "Describe a design decision that improved clarity for the user." : "Explain one project choice and the trade-off behind it.");
  const [response, setResponse] = useState("");
  const [taskType, setTaskType] = useState<"ielts" | "work" | "general">(writing ? "ielts" : "work");
  const [status, setStatus] = useState("AI NOT CONNECTED");
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedback | null>(null);
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedback | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const wordCount = useMemo(() => response.trim() ? response.trim().split(/\s+/).length : 0, [response]);

  useEffect(() => {
    let active = true;
    void getAiStatus().then((aiStatus) => {
      if (!active) return;
      setStatus(aiStatus.configured ? `AI READY · ${aiStatus.providers.map((provider) => provider.toUpperCase()).join(" / ")}` : "AI NOT CONNECTED");
    });
    return () => { active = false; };
  }, []);

  async function save() {
    await putRecord(writing ? "writing-practice" : "speaking-practice", { id: `${kind}-${Date.now()}`, prompt, response, taskType, updatedAt: Date.now() });
    setStatus("SAVED ON THIS DEVICE");
  }

  async function feedback() {
    if (!response.trim()) { setStatus(writing ? "WRITE A RESPONSE FIRST" : "ADD A TRANSCRIPT FIRST"); return; }
    setStatus("CHECKING…");
    const result = writing
      ? await requestAi<WritingFeedback>({ capability: "writing-feedback", prompt, response, taskType })
      : await requestAi<SpeakingFeedback>({ capability: "speaking-feedback", prompt, transcript: response, audioAnalyzed: false });
    if (!result.ok) { setStatus(result.message); return; }
    if (writing && validateWritingFeedback(result.data)) { setWritingFeedback(result.data); setStatus("UNOFFICIAL FEEDBACK READY"); return; }
    if (!writing && validateSpeakingFeedback(result.data)) { setSpeakingFeedback(result.data); setStatus("UNOFFICIAL FEEDBACK READY"); return; }
    setStatus("INVALID AI RESPONSE — YOUR DRAFT IS UNCHANGED");
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setStatus("RECORDING STOPPED — TYPE OR PASTE THE TRANSCRIPT BELOW");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setStatus("RECORDING UNAVAILABLE — USE THE TRANSCRIPT BOX"); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream.current);
      recorder.current.start();
      setRecording(true);
      setStatus("RECORDING… AUDIO STAYS IN THIS BROWSER SESSION");
    } catch { setStatus("MICROPHONE ACCESS WAS NOT AVAILABLE"); }
  }

  return (
    <section className="practice-studio">
      <header className="studio-status"><span>{writing ? "WRITING" : "SPEAKING"} / DEVICE-LOCAL</span><strong>{status}</strong></header>
      <div className="studio-grid">
        <div className="studio-editor">
          <label><span>PROMPT</span><textarea rows={3} value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label>
          {writing && <label><span>TASK TYPE</span><select value={taskType} onChange={(event) => setTaskType(event.target.value as typeof taskType)}><option value="ielts">IELTS-style</option><option value="work">International work</option><option value="general">General</option></select></label>}
          {!writing && <button className="record-button" type="button" onClick={() => void toggleRecording()}>{recording ? "STOP RECORDING" : "RECORD A PRACTICE TAKE"}</button>}
          <label><span>{writing ? "YOUR DRAFT" : "TRANSCRIPT"}</span><textarea className="practice-response" rows={14} value={response} onChange={(event) => setResponse(event.target.value)} placeholder={writing ? "Write here. Your draft remains even if AI feedback fails." : "Type or paste what you said. Transcript-only feedback never claims pronunciation analysis."} /></label>
          <div className="studio-actions"><span>{wordCount} WORDS</span><button type="button" onClick={() => void save()}>SAVE</button><button type="button" onClick={() => void feedback()}>GET AI FEEDBACK ↗</button></div>
        </div>
        <aside className="feedback-panel">
          <p>UNOFFICIAL PRACTICE FEEDBACK</p>
          {!writingFeedback && !speakingFeedback && <div className="feedback-empty"><strong>{status}</strong><span>Your prompt and response can still be written and saved on this device.</span></div>}
          {writingFeedback && <><h2>Unofficial estimate</h2><p>{writingFeedback.bandRange ?? "Not scored for this task type"}</p><h2>What works</h2>{writingFeedback.criteria.map((item) => <p key={item.heading}><strong>{item.heading}</strong> {item.observation}</p>)}<h2>Priority corrections</h2>{writingFeedback.corrections.map((item) => <p key={item.original}>{item.original} → {item.revision}<br /><small>{item.explanation}</small></p>)}<h2>Next practice</h2><ul>{writingFeedback.nextActions.map((item) => <li key={item}>{item}</li>)}</ul></>}
          {speakingFeedback && <><h2>Fluency and clarity</h2>{speakingFeedback.observations.map((item) => <p key={item}>{item}</p>)}<h2>Vocabulary and grammar</h2><p>Review the alternatives below and keep only the ones that sound like you.</p><h2>Natural alternatives</h2><ul>{speakingFeedback.alternatives.map((item) => <li key={item}>{item}</li>)}</ul><h2>Next attempt</h2><p>{speakingFeedback.nextAttempt}</p></>}
        </aside>
      </div>
    </section>
  );
}
