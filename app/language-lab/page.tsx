import { AppShell } from "../components/app-shell";
import { SeedLibrary } from "../components/seed-library";

export default function LanguageLabPage() {
  return (
    <AppShell active="language">
      <header className="page-heading compact-heading library-heading">
        <div><p className="eyebrow">INPUT THAT EARNS AN OUTPUT</p><h1>Language Lab</h1><p className="lede">不用面对空白输入框。从 24 个精选入口直接开始，每次看完都留下一个英文输出。</p></div>
        <span className="phase-pill">24 SEEDS</span>
      </header>
      <SeedLibrary />
    </AppShell>
  );
}
