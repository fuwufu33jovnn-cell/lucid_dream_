import { AppShell } from "../components/app-shell";
import { ArchiveBoard } from "../components/archive-board";

export default function ProgressPage() {
  return (
    <AppShell active="progress">
      <header className="editorial-page-heading archive-heading">
        <p className="editorial-folio">06 / EVIDENCE WITHOUT PRESSURE</p>
        <h1 aria-label="THE ARCHIVE">
          <span className="sr-only">THE ARCHIVE</span>
          <span aria-hidden="true">THE<br />ARCHIVE</span>
        </h1>
        <div><p>不是连续打卡，也不是分数墙。这里只保存你真正做过、写过、留下过的东西。</p><span>DEVICE-LOCAL / PRIVATE NOTES</span></div>
      </header>
      <ArchiveBoard />
    </AppShell>
  );
}
