import { AppShell } from "../../components/app-shell";
import { PracticeStudio } from "../../components/practice-studio";

export default function SpeakingPracticePage() {
  return <AppShell active="career"><header className="editorial-page-heading practice-heading"><p className="editorial-folio">PRACTICE / SPEAKING</p><h1>SPEAKING<br />STUDIO</h1><div><p>录一遍、看转写、再讲一遍。仅有文本时不会冒充做过发音分析。</p><span>TRANSCRIPT-FIRST MODE</span></div></header><PracticeStudio kind="speaking" /></AppShell>;
}
