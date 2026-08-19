"use client";

import { useEffect, useMemo, useState } from "react";
import {
  REALISTIC_READING_MOCK,
  answerQuestion,
  createExamSnapshot,
  remainingSeconds,
  systemNow,
  type ExamSnapshot,
} from "../lib/exam";
import { getRecord, isIndexedDbAvailable, putRecord } from "../lib/indexed-db";

type SaveState = "checking" | "ready" | "saving" | "saved" | "unavailable";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamWorkspace() {
  const [snapshot, setSnapshot] = useState<ExamSnapshot | null>(null);
  const [recoverable, setRecoverable] = useState<ExamSnapshot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("checking");
  const [secondsLeft, setSecondsLeft] = useState(REALISTIC_READING_MOCK.durationSeconds);

  useEffect(() => {
    let active = true;
    async function checkStorage() {
      if (!(await isIndexedDbAvailable())) {
        if (active) setSaveState("unavailable");
        return;
      }
      const saved = await getRecord<ExamSnapshot>("examSessions", REALISTIC_READING_MOCK.id);
      if (!active) return;
      if (saved && !saved.submitted) setRecoverable(saved);
      setSaveState("ready");
    }
    void checkStorage().catch(() => { if (active) setSaveState("unavailable"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    const update = () => setSecondsLeft(remainingSeconds(snapshot.endAt, systemNow()));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [snapshot]);

  const currentIndex = useMemo(() => snapshot
    ? Math.max(0, REALISTIC_READING_MOCK.questions.findIndex((item) => item.id === snapshot.currentQuestion))
    : 0, [snapshot]);
  const currentQuestion = REALISTIC_READING_MOCK.questions[currentIndex];
  const locked = Boolean(snapshot?.submitted) || secondsLeft === 0;

  async function persist(next: ExamSnapshot) {
    setSnapshot(next);
    setSaveState("saving");
    try {
      await putRecord("examSessions", next);
      setSaveState("saved");
    } catch { setSaveState("unavailable"); }
  }

  async function startNew() {
    const now = systemNow();
    const next = createExamSnapshot(
      REALISTIC_READING_MOCK.id,
      now + REALISTIC_READING_MOCK.durationSeconds * 1_000,
    );
    setRecoverable(null);
    setSecondsLeft(REALISTIC_READING_MOCK.durationSeconds);
    await persist(next);
  }

  function resume() {
    if (!recoverable) return;
    setSnapshot(recoverable);
    setRecoverable(null);
    setSaveState("saved");
  }

  async function updateAnswer(value: string) {
    if (!snapshot || locked) return;
    await persist(answerQuestion(snapshot, currentQuestion.id, value, systemNow()));
  }

  async function navigate(questionId: string) {
    if (!snapshot) return;
    await persist({ ...snapshot, currentQuestion: questionId, lastSavedAt: systemNow() });
  }

  async function submit() {
    if (!snapshot) return;
    await persist({ ...snapshot, submitted: true, lastSavedAt: systemNow() });
  }

  if (!snapshot) {
    return (
      <section className="exam-launch">
        <div className="exam-launch-copy">
          <span className="source-label">{REALISTIC_READING_MOCK.label}</span>
          <h2>{REALISTIC_READING_MOCK.title}</h2>
          <p>{REALISTIC_READING_MOCK.subtitle}</p>
          <ul><li>原创建筑与信息设计主题文章</li><li>选择题与简答题混合</li><li>答案实时写入 IndexedDB</li></ul>
        </div>
        <div className="exam-launch-actions">
          {recoverable && (
            <button className="primary-action" type="button" onClick={resume}>Resume saved attempt</button>
          )}
          <button className={recoverable ? "secondary-action" : "primary-action"} type="button"
            disabled={saveState === "checking" || saveState === "unavailable"} onClick={() => void startNew()}>
            Start 20-minute practice
          </button>
          <p className={`storage-proof ${saveState}`} role="status">
            {saveState === "checking" && "正在检查本地保存能力…"}
            {saveState === "ready" && "✓ IndexedDB ready"}
            {saveState === "unavailable" && "无法启动严格练习：本地持久化不可用。"}
          </p>
        </div>
      </section>
    );
  }

  const answered = Object.values(snapshot.answers).filter(Boolean).length;
  return (
    <section className="exam-shell" aria-label="IELTS Reading computer practice">
      <div className="exam-bar">
        <div><span>READING</span><strong>{REALISTIC_READING_MOCK.title}</strong></div>
        <div className={`exam-save ${saveState}`} role="status">{saveState === "saving" ? "Saving…" : saveState === "unavailable" ? "Save failed" : "Saved locally"}</div>
        <div className={secondsLeft < 120 ? "exam-timer is-low" : "exam-timer"} aria-label={`${secondsLeft} seconds remaining`}>{formatTime(secondsLeft)}</div>
      </div>

      <div className="exam-split">
        <article className="passage-pane" aria-label="Reading passage" tabIndex={0}>
          <div className="passage-title"><span>{REALISTIC_READING_MOCK.label}</span><h2>{REALISTIC_READING_MOCK.title}</h2></div>
          {REALISTIC_READING_MOCK.passage.map((paragraph) => (
            <section className="passage-paragraph" key={paragraph.heading}>
              <strong>{paragraph.heading}</strong><p>{paragraph.text}</p>
            </section>
          ))}
        </article>

        <section className="question-pane" aria-label="Questions">
          <div className="question-progress"><span>Question {currentQuestion.number} of {REALISTIC_READING_MOCK.questions.length}</span><strong>{answered} answered</strong></div>
          <div className="question-card">
            <span className="question-number">{String(currentQuestion.number).padStart(2, "0")}</span>
            <h2>{currentQuestion.prompt}</h2>
            {currentQuestion.type === "choice" ? (
              <fieldset disabled={locked}>
                <legend className="sr-only">Choose one answer</legend>
                {currentQuestion.options?.map((option) => (
                  <label className="answer-option" key={option.value}>
                    <input type="radio" name={currentQuestion.id} value={option.value}
                      checked={snapshot.answers[currentQuestion.id] === option.value}
                      onChange={(event) => void updateAnswer(event.target.value)} />
                    <span className="option-letter">{option.value}</span><span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <label className="short-answer"><span>{currentQuestion.placeholder}</span><input disabled={locked} value={snapshot.answers[currentQuestion.id] ?? ""} onChange={(event) => void updateAnswer(event.target.value)} /></label>
            )}
          </div>
          {locked && <div className="exam-locked" role="status">{snapshot.submitted ? "Attempt submitted and locked." : "Time ended. Your last saved answers remain on this device."}</div>}
        </section>
      </div>

      <footer className="exam-footer">
        <div className="question-nav" aria-label="Question navigation">
          {REALISTIC_READING_MOCK.questions.map((question) => (
            <button className={`${question.id === currentQuestion.id ? "is-current" : ""} ${snapshot.answers[question.id] ? "is-answered" : ""}`} key={question.id} type="button" onClick={() => void navigate(question.id)}>{question.number}</button>
          ))}
        </div>
        <button className="submit-test" type="button" disabled={snapshot.submitted} onClick={() => void submit()}>Submit</button>
      </footer>
    </section>
  );
}
