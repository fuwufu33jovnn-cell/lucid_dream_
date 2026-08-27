import Link from "next/link";

type NavId = "today" | "ielts" | "language" | "career" | "route" | "progress" | "life";

const NAV_ITEMS: Array<{ id: NavId; href: string; label: string; mark: string }> = [
  { id: "today", href: "/", label: "Current Issue", mark: "01" },
  { id: "language", href: "/language-lab", label: "Language Lab", mark: "02" },
  { id: "ielts", href: "/ielts", label: "IELTS Exam", mark: "03" },
  { id: "career", href: "/career", label: "Portfolio", mark: "04" },
  { id: "route", href: "/route-map", label: "Route Map", mark: "05" },
  { id: "progress", href: "/progress", label: "Archive", mark: "06" },
  { id: "life", href: "/life-abroad", label: "Life Abroad", mark: "07" },
];

export function AppShell({ active, children }: {
  active: NavId;
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame editorial-frame">
      <header className="site-masthead">
        <div className="masthead-line">
          <Link className="brand" href="/" aria-label="LUCID DREAM home">
            <strong>LUCID DREAM</strong>
            <span>English culture magazine + personal lab</span>
          </Link>
          <div className="issue-stamp" aria-label="Current issue">
            <span>ISSUE 08</span><span>AUG—SEP 2026</span>
          </div>
          <Link className="archive-corner" href="/progress">OPEN ARCHIVE ↗</Link>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              aria-current={active === item.id ? "page" : undefined}
              className={active === item.id ? "nav-link is-active" : "nav-link"}
              href={item.href}
              key={item.id}
            >
              <span className="nav-mark">{item.mark}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>
      <main className="main-canvas">{children}</main>
      <footer className="site-footer">
        <span>LUCID DREAM / ISSUE 08</span>
        <span>Learn through what you already care about.</span>
      </footer>
    </div>
  );
}
