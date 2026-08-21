import { AppShell } from "../components/app-shell";
import { ExamWorkspace } from "../components/exam-workspace";

export default function IeltsPage() {
  return (
    <AppShell active="ielts">
      <header className="page-heading compact-heading exam-heading">
        <div><p className="eyebrow">COMPUTER TEST FIRST</p><h1>IELTS Exam</h1><p className="lede">先把机考流程和防丢底座练熟。当前材料是原创模拟题，不冒充官方真题。</p></div>
        <span className="phase-pill">ACADEMIC</span>
      </header>
      <ExamWorkspace />
    </AppShell>
  );
}
