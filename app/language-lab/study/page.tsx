import { Suspense } from "react";

import { AppShell } from "../../components/app-shell";
import { StudyWorkspace } from "../../components/study-workspace";

export default function LanguageStudyPage() {
  return <AppShell active="language"><Suspense fallback={<p>Opening local study workspace…</p>}><StudyWorkspace /></Suspense></AppShell>;
}
