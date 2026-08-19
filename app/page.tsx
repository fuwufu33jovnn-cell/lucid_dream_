import { AppShell } from "./components/app-shell";
import { TodayBoard } from "./components/today-board";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  return (
    <AppShell active="today">
      <header className="page-heading today-heading">
        <div>
          <p className="eyebrow">Tuesday · Junior year runway</p>
          <h1>Make today quietly count.</h1>
          <p className="lede">
            三件事，45 分钟。先练能在国外真正用上的英语，再向雅思和作品集各走一步。
          </p>
        </div>
        <p className="script-line" aria-hidden="true">dream clearly, move gently</p>
      </header>

      <TodayBoard />
    </AppShell>
  );
}
