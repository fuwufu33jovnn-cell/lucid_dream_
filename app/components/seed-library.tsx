"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  fallbackCatalogue,
  filterCatalogue,
  sourceFromRow,
  type LearningMediaType,
  type NormalizedSource,
} from "../lib/learning-sources.ts";
import { systemNow } from "../lib/exam";
import { putRecord } from "../lib/indexed-db";
import { getSupabaseBrowserClient } from "../lib/supabase";
import styles from "./language-catalogue.module.css";

type CatalogueState = "fallback" | "loading" | "ready" | "error";

const KIND_OPTIONS: Array<{ value: "all" | LearningMediaType; label: string }> = [
  { value: "all", label: "All formats" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "article", label: "Article" },
  { value: "course", label: "Course" },
  { value: "text", label: "Text" },
];
const FEATURED_TOPICS = ["Music", "Film"];
const LEVEL_OPTIONS = ["all", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
const DURATION_OPTIONS = [
  { value: "all", label: "Any duration" },
  { value: "900", label: "Up to 15 min" },
  { value: "1800", label: "Up to 30 min" },
];

function labelForHealth(health: NormalizedSource["health"]): string {
  return health === "healthy" ? "Available" : health === "stale" ? "Needs review" : "Unavailable";
}

function durationLabel(seconds: number | null): string {
  return seconds === null ? "Flexible" : `${Math.max(1, Math.round(seconds / 60))} min`;
}

export function SeedLibrary() {
  const [sources, setSources] = useState<NormalizedSource[]>(fallbackCatalogue);
  const [catalogueState, setCatalogueState] = useState<CatalogueState>("fallback");
  const [kind, setKind] = useState<"all" | LearningMediaType>("all");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState<(typeof LEVEL_OPTIONS)[number]>("all");
  const [duration, setDuration] = useState("all");
  const [textAvailability, setTextAvailability] = useState("all");
  const [health, setHealth] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<NormalizedSource | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCatalogue() {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      setCatalogueState("loading");
      const { data, error } = await client.from("learning_sources").select("*").order("updated_at", { ascending: false }).limit(120);
      if (!active) return;
      if (error) { setCatalogueState("error"); return; }
      if (!data?.length) { setCatalogueState("fallback"); return; }
      setSources(data.map(sourceFromRow));
      setCatalogueState("ready");
    }
    void loadCatalogue().catch(() => { if (active) setCatalogueState("error"); });
    return () => { active = false; };
  }, []);

  const topics = useMemo(() => [...new Set([...FEATURED_TOPICS, ...sources.flatMap((source) => source.topics)])].sort((left, right) => left.localeCompare(right)), [sources]);
  const results = useMemo(() => filterCatalogue(sources, {
    kind: kind === "all" ? undefined : kind,
    topic: topic === "all" ? undefined : topic,
    cefrLevel: level === "all" ? undefined : level,
    maxDurationSeconds: duration === "all" ? undefined : Number(duration),
    hasText: textAvailability === "all" ? undefined : textAvailability === "with-text",
    health: health === "all" ? undefined : health as NormalizedSource["health"],
    query,
    page,
    pageSize: 8,
  }), [duration, health, kind, level, page, query, sources, textAvailability, topic]);

  function resetPage(action: () => void) { action(); setPage(0); }
  async function saveItem(item: NormalizedSource) {
    try {
      await putRecord("library", { id: item.canonicalKey, sourceUrl: item.canonical_url, savedAt: systemNow() });
      setSaved((current) => current.includes(item.canonicalKey) ? current : [...current, item.canonicalKey]);
      setSaveMessage("Saved on this device");
    } catch { setSaveMessage("Could not save on this device"); }
  }

  const sourceNotice = catalogueState === "ready" ? "Live public catalogue" : catalogueState === "loading" ? "Checking public catalogue…" : catalogueState === "error" ? "Using bundled catalogue while the public catalogue is unavailable." : "Bundled catalogue for offline or unconfigured builds";

  return (
    <section className={styles.catalogue} aria-busy={catalogueState === "loading"}>
      <div className={styles.toolbar}>
        <label className={styles.search}><span className="sr-only">Search catalogue</span><input value={query} onChange={(event) => resetPage(() => setQuery(event.target.value))} placeholder="Search topics, skills, or publishers" /></label>
        <div className={styles.filters}>
          <select aria-label="Source format" value={kind} onChange={(event) => resetPage(() => setKind(event.target.value as "all" | LearningMediaType))}>{KIND_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <select aria-label="Topic" value={topic} onChange={(event) => resetPage(() => setTopic(event.target.value))}><option value="all">All topics</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select aria-label="CEFR level" value={level} onChange={(event) => resetPage(() => setLevel(event.target.value as (typeof LEVEL_OPTIONS)[number]))}>{LEVEL_OPTIONS.map((item) => <option key={item} value={item}>{item === "all" ? "All levels" : item}</option>)}</select>
          <select aria-label="Duration" value={duration} onChange={(event) => resetPage(() => setDuration(event.target.value))}>{DURATION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <select aria-label="Transcript or text availability" value={textAvailability} onChange={(event) => resetPage(() => setTextAvailability(event.target.value))}><option value="all">Text optional</option><option value="with-text">Text available</option><option value="without-text">No text</option></select>
          <select aria-label="Health" value={health} onChange={(event) => resetPage(() => setHealth(event.target.value))}><option value="all">All availability</option><option value="healthy">Available</option><option value="stale">Needs review</option><option value="unavailable">Unavailable</option></select>
        </div>
      </div>
      <div className={styles.summary} role="status"><span>{results.total} sources</span><span>{sourceNotice}</span></div>
      {results.items.length ? <div className={styles.grid}>{results.items.map((item) => {
        const isSaved = saved.includes(item.canonicalKey);
        return <article className={styles.card} key={item.canonicalKey}>
          <div className={styles.cardMeta}><span>{item.media_type}</span><span className={`${styles.health} ${styles[item.health]}`}>{labelForHealth(item.health)}</span></div>
          <div><p>{item.topics.join(" · ") || "General"} · {item.cefr_level ?? "Any level"}</p><h2>{item.title}</h2><span>{item.publisher}</span></div>
          <div className={styles.tags}>{item.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}<span>{durationLabel(item.expected_duration_seconds)}</span>{item.has_text && <span>Text</span>}</div>
          <div className={styles.actions}><button type="button" onClick={() => setSelected(item)}>Details</button><button className={isSaved ? styles.saved : undefined} type="button" onClick={() => void saveItem(item)}>{isSaved ? "Saved" : "Save"}</button></div>
        </article>;
      })}</div> : <div className={styles.empty} role="status"><strong>No sources match those filters.</strong><p>Clear a filter or try a broader search. The catalogue stores metadata and links only.</p><button type="button" onClick={() => { setKind("all"); setTopic("all"); setLevel("all"); setDuration("all"); setTextAvailability("all"); setHealth("all"); setQuery(""); setPage(0); }}>Clear filters</button></div>}
      {results.hasMore && <button className={styles.loadMore} type="button" onClick={() => setPage((current) => current + 1)}>Load more sources</button>}
      <aside className={selected ? `${styles.drawer} ${styles.open}` : styles.drawer} aria-label="Source details">
        {selected ? <><button className={styles.close} type="button" onClick={() => setSelected(null)} aria-label="Close source details">×</button><span>{selected.media_type} · {selected.cefr_level ?? "Any level"} · {durationLabel(selected.expected_duration_seconds)}</span><h2>{selected.title}</h2><p className={styles.publisher}>{selected.publisher}</p><div className={styles.detail}><strong>Study prompt</strong><p>Open this publisher-hosted source, note one idea you can reuse, then create a short English response.</p></div><div className={styles.detail}><strong>Source status</strong><p>{labelForHealth(selected.health)}. {selected.has_text ? "Text or captions may be available from the source." : "Text availability is not guaranteed."}</p></div><div className={styles.rights}><strong>Usage note</strong><p>{selected.usage_basis}</p><small>{selected.last_checked_at ? `Checked ${new Date(selected.last_checked_at).toLocaleDateString()}` : "Check date unavailable"}</small></div><Link className={styles.openSource} href={{ pathname: "/language-lab/study", query: { source: selected.canonical_url, title: selected.title } }}>Study in Language Lab →</Link><a className={styles.openSource} href={selected.canonical_url} target="_blank" rel="noreferrer">Open on publisher site ↗</a><button className={styles.saveDetail} type="button" onClick={() => void saveItem(selected)}>Save source</button><p role="status">{saveMessage}</p></> : <div className={styles.emptyDrawer}><span>↗</span><p>Choose a source to check its availability, rights note, and study prompt.</p></div>}
      </aside>
    </section>
  );
}
