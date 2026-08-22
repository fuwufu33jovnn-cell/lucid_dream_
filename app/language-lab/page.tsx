import Link from "next/link";

import { AppShell } from "../components/app-shell";
import { MaterialImport } from "../components/material-import";
import { SeedLibrary } from "../components/seed-library";

export default function LanguageLabPage() {
  return (
    <AppShell active="language">
      <header className="page-heading compact-heading library-heading">
        <div><p className="eyebrow">INPUT THAT EARNS AN OUTPUT</p><h1>Language Lab</h1><p className="lede">从经过核对的公开来源开始。筛选适合你的输入，并用一段英文输出留下收获。</p></div>
        <span className="phase-pill">SOURCE CATALOGUE</span>
      </header>
      <nav className="lab-mode-nav" aria-label="Language Lab tools">
        <Link href="#catalogue"><span>01</span><strong>Browse 81 sources</strong><small>Music · Film · Audio · Text</small></Link>
        <Link href="/language-lab/study"><span>02</span><strong>Study a local file</strong><small>Transcript · lookup · notes</small></Link>
        <Link href="/language-lab/vocabulary"><span>03</span><strong>My Vocabulary</strong><small>Saved words · review queue</small></Link>
      </nav>
      <MaterialImport />
      <div id="catalogue"><SeedLibrary /></div>
    </AppShell>
  );
}
