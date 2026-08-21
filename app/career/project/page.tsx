import { AppShell } from "../../components/app-shell";
import { ProjectEvidenceEditor } from "../../components/project-evidence-editor";

export default function CareerProjectPage() {
  return <AppShell active="career"><header className="page-heading compact-heading portfolio-heading"><div><p className="eyebrow">CAREER STUDIO · PROJECT 01</p><h1>Evidence workspace</h1><p className="lede">先写事实，再生成表达。每条重要说法都应该能回答“你怎么知道？”</p></div><span className="phase-pill">AUTOSAVE</span></header><ProjectEvidenceEditor /></AppShell>;
}
