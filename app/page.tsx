import Link from "next/link";
import { AppShell } from "./components/app-shell";
import { TodayBoard } from "./components/today-board";

const HERO_IMAGE = "https://images.unsplash.com/photo-1697040975575-0baa5b9c7803?auto=format&fit=crop&fm=jpg&q=82&w=1800";

export default function TodayPage() {
  return (
    <AppShell active="today">
      <article className="issue-home">
        <header className="issue-hero">
          <div className="issue-title-block">
            <p className="issue-kicker"><span>VOL. 01</span><span>ISSUE 08</span><span>THE NIGHT EDITION</span></p>
            <h1>NIGHT<br />RADIO</h1>
            <p className="issue-deck">Tonight, we&apos;re learning English through strange websites, good music, design arguments and the sentences worth stealing.</p>
            <Link className="underlined-link" href="/language-lab">ENTER THE LANGUAGE LAB ↗</Link>
          </div>
          <figure className="hero-figure">
            <img src={HERO_IMAGE} alt="A silhouette holding headphones against a dark blue background" />
            <figcaption><span>01 / HOLD THE SOUND</span><span>Photo: Satyam Pathak / Unsplash</span></figcaption>
          </figure>
          <aside className="frequency-note" aria-label="Issue note">
            <span>88.7</span>
            <p>Broadcasting from somewhere between an IELTS desk and a very old music blog.</p>
          </aside>
        </header>

        <section className="issue-grid" aria-label="Issue selections">
          <article className="editorial-module film-module">
            <p className="module-index">A / FILM OF THE WEEK</p>
            <h2>PERFECT DAYS</h2>
            <p>Notice how ordinary routines become a visual language. Describe one repeated detail without translating first.</p>
            <Link href="/language-lab">WATCH / WORDS / TALK ↗</Link>
          </article>
          <article className="editorial-module listening-module">
            <p className="module-index">B / LISTENING ROOM</p>
            <div className="record-mark" aria-hidden="true"><span>LD</span></div>
            <h2>THE 11:47 PM MIX</h2>
            <p>Three voices, one design interview, and a short retell before midnight.</p>
          </article>
          <article className="editorial-module words-module">
            <p className="module-index">C / WORDS I STOLE THIS WEEK</p>
            <ol>
              <li><span>01</span>quietly specific</li>
              <li><span>02</span>visual rhythm</li>
              <li><span>03</span>worth keeping</li>
            </ol>
          </article>
        </section>

        <section className="today-inside">
          <div className="section-rule-heading">
            <p>TODAY, INSIDE THE ISSUE</p>
            <span>Choose the version of today you can actually finish.</span>
          </div>
          <TodayBoard />
        </section>
      </article>
    </AppShell>
  );
}
