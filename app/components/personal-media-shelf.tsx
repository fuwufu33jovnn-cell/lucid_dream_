"use client";

import { useEffect, useState } from "react";
import { getAllRecords, putRecord } from "../lib/indexed-db";
import { parsePersonalMediaUrl, type PersonalMediaRecord } from "../lib/personal-media";

export function PersonalMediaShelf() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<PersonalMediaRecord[]>([]);
  const [selected, setSelected] = useState<PersonalMediaRecord | null>(null);
  const [status, setStatus] = useState("SAVED ONLY ON THIS DEVICE");

  useEffect(() => {
    let active = true;
    void getAllRecords<PersonalMediaRecord>("personal-media")
      .then((records) => {
        if (!active) return;
        const ordered = records.sort((a, b) => b.createdAt - a.createdAt);
        setItems(ordered);
        setSelected(ordered[0] ?? null);
      })
      .catch(() => active && setStatus("DEVICE SAVING UNAVAILABLE"));
    return () => { active = false; };
  }, []);

  async function importMedia() {
    const parsed = parsePersonalMediaUrl(url);
    if (!parsed) {
      setStatus("PASTE A SUPPORTED YOUTUBE OR SPOTIFY LINK");
      return;
    }
    const record: PersonalMediaRecord = {
      ...parsed,
      id: `${parsed.provider}:${parsed.kind}:${parsed.resourceId}`,
      title: title.trim() || `${parsed.provider.toUpperCase()} ${parsed.kind.toUpperCase()}`,
      createdAt: Date.now(),
    };
    try {
      await putRecord("personal-media", record);
      setItems((current) => [record, ...current.filter((item) => item.id !== record.id)]);
      setSelected(record);
      setUrl("");
      setTitle("");
      setStatus("IMPORTED · SAVED ON THIS DEVICE");
    } catch {
      setStatus("EMBED READY · DEVICE SAVING UNAVAILABLE");
      setSelected(record);
    }
  }

  return (
    <section className="personal-media-shelf" aria-labelledby="personal-media-title">
      <header>
        <div><span>PERSONAL IMPORT / 01</span><h2 id="personal-media-title">YOUR MEDIA SHELF</h2></div>
        <p>YouTube videos and playlists · Spotify music and podcasts<br />Links stay links. Nothing is downloaded or copied.</p>
      </header>
      <div className="personal-media-importer">
        <label><span>PASTE YOUTUBE OR SPOTIFY LINK</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
        <label><span>YOUR LABEL / OPTIONAL</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Night listening, film notes…" /></label>
        <button type="button" onClick={() => void importMedia()}>IMPORT TO LAB ↗</button>
      </div>
      <div className="personal-media-body">
        <div className="personal-media-index" aria-label="Imported media">
          {items.map((item, index) => (
            <button className={selected?.id === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setSelected(item)}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.provider} / {item.kind}</small>
            </button>
          ))}
          {items.length === 0 && <p>NO IMPORTS YET<br /><small>Paste one link above; it will live only in this browser.</small></p>}
        </div>
        <div className="personal-media-player">
          {selected ? (
            <>
              <iframe title={`${selected.title} — embedded ${selected.provider}`} src={selected.embedUrl} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
              <div><span>{selected.provider.toUpperCase()} / {selected.kind.toUpperCase()}</span><a href={selected.sourceUrl} target="_blank" rel="noreferrer">OPEN ORIGINAL ↗</a></div>
            </>
          ) : (
            <div className="personal-media-empty"><span>YT + SP</span><p>YOUR NEXT LISTENING OR WATCHING SESSION STARTS HERE.</p></div>
          )}
        </div>
      </div>
      <p className="personal-media-status" role="status">{status}</p>
    </section>
  );
}
