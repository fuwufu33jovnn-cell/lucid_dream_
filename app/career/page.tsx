import { AppShell } from "../components/app-shell";
import { PortfolioWalkthrough } from "../components/portfolio-walkthrough";

export default function CareerPage() {
  return (
    <AppShell active="career">
      <header className="tool-page-heading portfolio-tool-heading"><p>04 / PORTFOLIO / CASE STUDY 01</p><h1>MAKE THE WORK<br />SPEAK CLEARLY.</h1><span>把痛点、取舍、系统、迭代与影响讲成可信的设计故事。</span></header>
      <div className="tool-surface"><PortfolioWalkthrough /></div>
    </AppShell>
  );
}
