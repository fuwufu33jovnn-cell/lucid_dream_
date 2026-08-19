import { AppShell } from "./app-shell";

export function DeferredPage({ active, eyebrow, title, phase, children }: {
  active: "route" | "progress" | "life";
  eyebrow: string;
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell active={active}>
      <header className="page-heading compact-heading">
        <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
        <span className="phase-pill">{phase}</span>
      </header>
      <section className="deferred-card">
        <div className="deferred-index" aria-hidden="true">↗</div>
        <div>
          <p>{children}</p>
          <p className="muted-copy">入口先保留，功能不假装上线。当前开发优先保证 Today 和 IELTS 的数据底座可靠。</p>
        </div>
      </section>
    </AppShell>
  );
}
