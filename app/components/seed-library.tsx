"use client";

import { useMemo, useState } from "react";
import { putRecord } from "../lib/indexed-db";
import { SEED_LIBRARY, type SeedActivity, type SeedCategory } from "../lib/seeds";
import { systemNow } from "../lib/exam";

const CATEGORIES: Array<"All" | SeedCategory> = ["All", "Design", "Work", "Life", "Culture", "Academic"];

export function SeedLibrary() {
  const [category, setCategory] = useState<"All" | SeedCategory>("All");
  const [level, setLevel] = useState("All");
  const [minutes, setMinutes] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SeedActivity | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  const results = useMemo(() => SEED_LIBRARY.filter((item) => {
    const haystack = `${item.title} ${item.publisher} ${item.skills.join(" ")}`.toLowerCase();
    return (category === "All" || item.category === category)
      && (level === "All" || item.level === level)
      && (minutes === "All" || item.minutes === Number(minutes))
      && haystack.includes(query.trim().toLowerCase());
  }), [category, level, minutes, query]);

  async function saveItem(item: SeedActivity) {
    try {
      await putRecord("library", { id: item.id, savedAt: systemNow() });
      setSaved((current) => current.includes(item.id) ? current : [...current, item.id]);
      setSaveMessage("Saved on this device");
    } catch { setSaveMessage("Could not save on this device"); }
  }

  return (
    <section className="library-layout">
      <div className="library-main">
        <div className="library-filters">
          <div className="category-chips" aria-label="Content category">
            {CATEGORIES.map((item) => <button className={category === item ? "is-active" : ""} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="filter-row">
            <label className="search-field"><span className="sr-only">Search activities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics or skills" /></label>
            <label><span className="sr-only">Level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>All</option><option>B1</option><option>B2</option><option>C1</option></select></label>
            <label><span className="sr-only">Duration</span><select value={minutes} onChange={(event) => setMinutes(event.target.value)}><option>All</option><option value="5">5 min</option><option value="15">15 min</option><option value="30">30 min</option></select></label>
          </div>
        </div>

        <div className="library-count"><span>{results.length} activities</span><span>Publisher-hosted sources</span></div>
        <div className="seed-grid">
          {results.map((item, index) => (
            <article className="seed-card" key={item.id}>
              <div className="seed-top"><span>{String(index + 1).padStart(2, "0")}</span><span>{item.minutes} MIN</span></div>
              <div><p>{item.category} · {item.level}</p><h2>{item.title}</h2><span className="publisher">{item.publisher}</span></div>
              <div className="skill-list">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="seed-actions"><button type="button" onClick={() => setSelected(item)}>View activity</button><button className={saved.includes(item.id) ? "is-saved" : ""} type="button" onClick={() => void saveItem(item)}>{saved.includes(item.id) ? "Saved" : "Save"}</button></div>
            </article>
          ))}
        </div>
      </div>

      <aside className={selected ? "activity-drawer is-open" : "activity-drawer"} aria-label="Activity details">
        {selected ? (
          <>
            <button className="drawer-close" type="button" onClick={() => setSelected(null)} aria-label="Close activity">×</button>
            <span className="source-label">{selected.category} · {selected.level} · {selected.minutes} MIN</span>
            <h2>{selected.title}</h2>
            <p className="drawer-publisher">{selected.publisher}</p>
            <div className="activity-step"><span>01</span><div><strong>Before you open it</strong><p>{selected.prompt}</p></div></div>
            <div className="activity-step"><span>02</span><div><strong>Your required output</strong><p>{selected.output}</p></div></div>
            <div className="rights-note"><strong>Usage note</strong><p>{selected.usageBasis}</p><small>Reviewed {selected.reviewedAt}</small></div>
            <a className="primary-action source-action" href={selected.sourceUrl} target="_blank" rel="noreferrer">Open on publisher site ↗</a>
            <button className="secondary-action" type="button" onClick={() => void saveItem(selected)}>Save activity</button>
            <p className="drawer-status" role="status">{saveMessage}</p>
          </>
        ) : (
          <div className="drawer-empty"><span>↗</span><p>选择一个素材，查看专门为它设计的输入与输出练习。</p></div>
        )}
      </aside>
    </section>
  );
}
