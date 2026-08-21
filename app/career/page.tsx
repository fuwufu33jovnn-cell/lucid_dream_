import { AppShell } from "../components/app-shell";
import { CareerDashboard } from "../components/career-dashboard";

export default function CareerPage() {
  return (
    <AppShell active="career">
      <header className="page-heading compact-heading portfolio-heading">
        <div><p className="eyebrow">EVIDENCE · APPLICATIONS · SPEAKING</p><h1>Career Studio</h1><p className="lede">把项目证据变成可信的作品集、简历表达和英语面试练习。AI 只使用你确认过的事实。</p></div>
        <span className="phase-pill">GUIDED WORKFLOW</span>
      </header>
      <CareerDashboard />
    </AppShell>
  );
}
