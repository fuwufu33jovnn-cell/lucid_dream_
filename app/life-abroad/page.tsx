import { AppShell } from "../components/app-shell";

export default function LifeAbroadPage() {
  return (
    <AppShell active="life">
      <header className="editorial-page-heading life-heading"><p className="editorial-folio">07 / FIELD GUIDE / CLEAR WORDS</p><h1 aria-label="PRACTICAL ENGLISH FOR REAL LIFE"><span className="sr-only">PRACTICAL ENGLISH FOR REAL LIFE</span><span aria-hidden="true">PRACTICAL ENGLISH<br />FOR REAL LIFE.</span></h1><div><p>不是灾难模拟器。以后这里会练真实、平静、能用上的表达：问清楚、确认边界、保留证据。</p><span>CALM / SPECIFIC / POLITE</span></div></header>
      <section className="field-guide-grid">
        <article><span>01</span><h2>RENTING</h2><p>Viewing questions, unclear fees, repairs, deposits and calm follow-up messages.</p><small>COMING AS A SCRIPT WORKSHOP</small></article>
        <article><span>02</span><h2>APPOINTMENTS</h2><p>Booking, rescheduling, describing what you need and checking the next step.</p><small>COMING AS A PHRASE DECK</small></article>
        <article><span>03</span><h2>WORK BOUNDARIES</h2><p>Clarifying scope, asking for a deadline and disagreeing without disappearing.</p><small>COMING AS A ROLEPLAY LAB</small></article>
      </section>
    </AppShell>
  );
}
