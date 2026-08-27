import { AppShell } from "../components/app-shell";

const ROUTES = [
  { number: "A", name: "VISUAL + BRAND", place: "SINGAPORE / APAC", copy: "English, portfolio storytelling, brand systems and content roles. The most direct bridge from digital media art." },
  { number: "B", name: "GLOBAL TRADE", place: "LANGUAGE + BUSINESS", copy: "Research roles where communication, follow-through and cross-border coordination matter more than specialist software." },
  { number: "C", name: "CULTURE STUDIO", place: "JAPAN / KOREA", copy: "Concept, editorial and artist-facing visual work. A slower portfolio path, kept alive without pretending it is the safest route." },
];

export default function RouteMapPage() {
  return (
    <AppShell active="route">
      <header className="editorial-page-heading route-heading"><p className="editorial-folio">05 / ROUTE MAP / WORKING NOTES</p><h1 aria-label="THREE ROUTES, ONE DECISION"><span className="sr-only">THREE ROUTES, ONE DECISION</span><span aria-hidden="true">THREE ROUTES,<br />ONE DECISION.</span></h1><div><p>不把未来假装成一条确定的直线。先比较每条路需要什么证据，再决定下一段时间把力气放哪里。</p><span>PRIMARY / ADJACENT / LONG SHOT</span></div></header>
      <section className="route-editorial-grid">
        {ROUTES.map((route) => <article key={route.number}><span>{route.number}</span><p>{route.place}</p><h2>{route.name}</h2><div>{route.copy}</div><small>RESEARCH SHELF / NOT A PROMISE</small></article>)}
      </section>
    </AppShell>
  );
}
