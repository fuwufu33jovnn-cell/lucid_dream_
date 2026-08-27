import { AppShell } from "../components/app-shell";
import { ExamWorkspace } from "../components/exam-workspace";

export default function IeltsPage() {
  return (
    <AppShell active="ielts">
      <header className="tool-page-heading"><p>03 / IELTS / FOCUS MODE</p><h1>THE QUIET<br />EXAM DESK.</h1><span>原创模拟阅读材料。进入答题后，世界会安静下来。</span></header>
      <div className="tool-surface"><ExamWorkspace /></div>
    </AppShell>
  );
}
