import { AppShell } from "../components/app-shell";
import { PortfolioWalkthrough } from "../components/portfolio-walkthrough";

export default function CareerPage() {
  return (
    <AppShell active="career">
      <header className="page-heading compact-heading portfolio-heading">
        <div><p className="eyebrow">DIGITAL MEDIA ART · ENGLISH OUTPUT</p><h1>Portfolio Walkthrough</h1><p className="lede">不是背一段漂亮自我介绍。把痛点、取舍、系统、迭代与影响讲成可信的设计故事。</p></div>
        <span className="phase-pill">CASE STUDY 01</span>
      </header>
      <PortfolioWalkthrough />
    </AppShell>
  );
}
