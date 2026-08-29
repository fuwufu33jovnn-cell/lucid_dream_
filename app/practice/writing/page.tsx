import { AppShell } from "../../components/app-shell";
import { PracticeStudio } from "../../components/practice-studio";

export default function WritingPracticePage() {
  return <AppShell active="career"><header className="editorial-page-heading practice-heading"><p className="editorial-folio">PRACTICE / WRITING</p><h1>WRITING<br />STUDIO</h1><div><p>写完再评分。反馈会保留你的原意，并明确标注为非官方练习估分。</p><span>DRAFTS STAY ON THIS DEVICE</span></div></header><PracticeStudio kind="writing" /></AppShell>;
}
