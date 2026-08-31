"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EDITORIAL_ACTIVITIES,
  LAB_MODES,
  availableContentKinds,
  filterEditorialActivities,
  type EditorialActivity,
  type LabMode,
} from "../lib/editorial";
import { getRecord, putRecord } from "../lib/indexed-db";
import type { ActivityProgress } from "../lib/models";
import type { ContentKind } from "../lib/editorial-types";
import { MediaLearningPanel } from "./media-learning-panel";
import { PersonalMediaShelf } from "./personal-media-shelf";
import { FloatingStudyWindow } from "./floating-study-window";

function emptyProgress(id: string): ActivityProgress {
  return { id, notice: "", savedLanguage: "", shadowNote: "", speakingOutline: "", completedAt: null, updatedAt: 0 };
}

export function EditorialLab() {
  const [mode, setMode] = useState<LabMode>("Watch");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [minutes, setMinutes] = useState("All");
  const [contentKind, setContentKind] = useState<"All" | ContentKind>("All");
  const [selected, setSelected] = useState<EditorialActivity>(EDITORIAL_ACTIVITIES[0]);
  const [progress, setProgress] = useState<ActivityProgress>(() => emptyProgress(EDITORIAL_ACTIVITIES[0].id));
  const [saveState, setSaveState] = useState("Checking this device…");
  const contentFilters = useMemo<Array<"All" | ContentKind>>(() => ["All", ...availableContentKinds(EDITORIAL_ACTIVITIES, mode)], [mode]);

  const results = useMemo(() => filterEditorialActivities(EDITORIAL_ACTIVITIES, mode, query)
    .filter((item) => contentKind === "All" || item.contentKind === contentKind)
    .filter((item) => level === "All" || item.level === level)
    .filter((item) => minutes === "All" || item.minutes === Number(minutes)), [mode, query, level, minutes, contentKind]);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get("activity");
    if (!requestedId) return;
    const requested = EDITORIAL_ACTIVITIES.find((item) => item.id === requestedId);
    if (!requested) return;
    setMode(requested.mode);
    setContentKind(requested.contentKind);
    setSelected(requested);
  }, []);

  useEffect(() => {
    let active = true;
    void getRecord<ActivityProgress>("activity-progress", selected.id)
      .then((record) => {
        if (!active) return;
        setProgress(record ?? emptyProgress(selected.id));
        setSaveState("Saved on this device");
      })
      .catch(() => {
        if (!active) return;
        setProgress(emptyProgress(selected.id));
        setSaveState("Device saving unavailable");
      });
    return () => { active = false; };
  }, [selected.id]);

  function chooseActivity(activity: EditorialActivity) {
    setSaveState("Checking this device…");
    setSelected(activity);
  }

  function chooseMode(nextMode: LabMode) {
    setMode(nextMode);
    setContentKind("All");
    const first = EDITORIAL_ACTIVITIES.find((item) => item.mode === nextMode);
    if (first) chooseActivity(first);
  }

  function chooseContentKind(nextKind: "All" | ContentKind) {
    setContentKind(nextKind);
    const first = EDITORIAL_ACTIVITIES.find((item) => item.mode === mode && (nextKind === "All" || item.contentKind === nextKind));
    if (first) chooseActivity(first);
  }

  async function updateProgress(field: keyof Pick<ActivityProgress, "notice" | "savedLanguage" | "shadowNote" | "speakingOutline">, value: string) {
    const next = { ...progress, [field]: value, updatedAt: Date.now() };
    setProgress(next);
    setSaveState("Saving…");
    try {
      await putRecord("activity-progress", next);
      setSaveState("Saved on this device");
    } catch { setSaveState("Device saving unavailable"); }
  }

  async function toggleComplete() {
    const next = { ...progress, completedAt: progress.completedAt ? null : Date.now(), updatedAt: Date.now() };
    setProgress(next);
    setSaveState("Saving…");
    try {
      await putRecord("activity-progress", next);
      setSaveState("Saved on this device");
    } catch { setSaveState("Device saving unavailable"); }
  }

  return (
    <section className="editorial-lab">
      <PersonalMediaShelf />
      <FloatingStudyWindow activityId={selected.id} title={selected.title} initialText={selected.learningText.map((line) => line.text).join("\n")} />
      <div className="lab-mode-strip" aria-label="Language Lab modes">
        {LAB_MODES.map((item, index) => (
          <button className={mode === item ? "is-active" : ""} type="button" key={item} onClick={() => chooseMode(item)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{item.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="content-kind-strip" aria-label="Content collections">
        {contentFilters.map((kind) => (
          <button className={contentKind === kind ? "is-active" : ""} key={kind} type="button" onClick={() => chooseContentKind(kind)}>{kind.toUpperCase()}</button>
        ))}
      </div>

      <div className="lab-utility-row">
        <label><span>SEARCH THE INDEX</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="title, publisher, format" /></label>
        <label><span>LEVEL</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>All</option><option>B1</option><option>B2</option><option>C1</option></select></label>
        <label><span>TIME</span><select value={minutes} onChange={(event) => setMinutes(event.target.value)}><option>All</option><option value="5">5 min</option><option value="15">15 min</option><option value="30">30 min</option></select></label>
        <p>{results.length} ENTRIES / {mode.toUpperCase()}</p>
      </div>

      <div className="lab-workspace">
        <div className="lab-index">
          {results.map((item, index) => (
            <button className={selected.id === item.id ? "lab-index-item is-selected" : "lab-index-item"} key={item.id} type="button" onClick={() => chooseActivity(item)}>
              <span className="lab-item-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="lab-item-copy"><small>{item.format} / {item.publisher}</small><strong>{item.title}</strong><em>{item.editorialNote}</em></span>
              <span className="lab-item-meta">{item.level}<br />{item.minutes} MIN<br />↗</span>
            </button>
          ))}
          {results.length === 0 && <div className="lab-empty"><strong>NOTHING IN THIS DRAWER.</strong><span>Your place will not jump. Clear the smaller filters or search.</span><button type="button" onClick={() => { setQuery(""); setLevel("All"); setMinutes("All"); setContentKind("All"); }}>CLEAR SMALLER FILTERS</button></div>}
        </div>

        <aside className="lab-dossier" aria-label="Selected activity dossier">
          <div className="dossier-cover">
            <p>{selected.mode.toUpperCase()} / {selected.format.toUpperCase()}</p>
            <h2>{selected.title}</h2>
            <div><span>{selected.publisher}</span><span>{selected.level} / {selected.minutes} MIN</span></div>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer">OPEN ORIGINAL SOURCE ↗</a>
          </div>
          <div className="dossier-fields">
            <MediaLearningPanel activity={selected} />
            <label><span>01 / NOTICE</span><p>{selected.prompts.notice}</p><textarea rows={3} value={progress.notice} onChange={(event) => void updateProgress("notice", event.target.value)} placeholder="Three details, expressions, or choices…" /></label>
            <label><span>02 / WORDS</span><p>{selected.prompts.words}</p><textarea rows={3} value={progress.savedLanguage} onChange={(event) => void updateProgress("savedLanguage", event.target.value)} placeholder="The phrase + your own example…" /></label>
            <label><span>03 / SHADOW</span><p>{selected.prompts.shadow}</p><textarea rows={3} value={progress.shadowNote} onChange={(event) => void updateProgress("shadowNote", event.target.value)} placeholder="What changed on the third repetition?" /></label>
            <label><span>04 / TALK</span><p>{selected.prompts.talk}</p><textarea rows={3} value={progress.speakingOutline} onChange={(event) => void updateProgress("speakingOutline", event.target.value)} placeholder="A tiny speaking outline, not a full script…" /></label>
          </div>
          <div className="dossier-finish">
            <span role="status">{saveState}</span>
            <button type="button" onClick={() => void toggleComplete()}>{progress.completedAt ? "RETURN TO WORK" : "FINISH THIS ENTRY"} ↗</button>
          </div>
          {progress.completedAt ? (
            <section className="marginalia-reveal">
              <p>MARGINALIA / AFTER COMPLETION</p>
              <small>{selected.marginaliaLabel}. These are designed notes, not real user reviews.</small>
              <div>{selected.marginalia.map((note, index) => <blockquote key={note}><span>{index + 3}.{index + 1} / 5</span>{note}</blockquote>)}</div>
            </section>
          ) : (
            <p className="marginalia-lock">Complete the entry to unlock its fictional editorial MARGINALIA.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
