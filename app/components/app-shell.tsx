import Link from "next/link";

type NavId = "today" | "ielts" | "language" | "career" | "route" | "progress" | "life";

const NAV_ITEMS: Array<{ id: NavId; href: string; label: string; mark: string }> = [
  { id: "today", href: "/", label: "Today", mark: "01" },
  { id: "ielts", href: "/ielts", label: "IELTS Exam", mark: "02" },
  { id: "language", href: "/language-lab", label: "Language Lab", mark: "03" },
  { id: "career", href: "/career", label: "Career Studio", mark: "04" },
  { id: "route", href: "/route-map", label: "Route Map", mark: "05" },
  { id: "progress", href: "/progress", label: "Progress", mark: "06" },
  { id: "life", href: "/life-abroad", label: "Life Abroad", mark: "07" },
];

export function AppShell({ active, children }: {
  active: NavId;
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame">
      <aside className="side-rail">
        <Link className="brand" href="/" aria-label="LUCID DREAM home">
          <span className="brand-orbit" aria-hidden="true">◎</span>
          <span><strong>LUCID</strong><strong>DREAM</strong></span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link aria-current={active === item.id ? "page" : undefined}
              className={active === item.id ? "nav-link is-active" : "nav-link"}
              href={item.href} key={item.id}>
              <span className="nav-mark">{item.mark}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="account-card">
          <span className="avatar" aria-hidden="true">LD</span>
          <span className="account-copy"><strong>Dreamer</strong><small>Saved on this device</small></span>
        </div>
      </aside>
      <main className="main-canvas">{children}</main>
    </div>
  );
}
