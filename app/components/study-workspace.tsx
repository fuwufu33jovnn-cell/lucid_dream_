"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AiModelControl } from "./ai-model-control";
import { getStudyFile, setStudyFile } from "../lib/study-session";
import { parseStudySegments, youtubeEmbedUrl, type StudySegment } from "../lib/study-workspace";
import { saveVocabularyLocal } from "../lib/vocabulary";
import type { AiProviderId } from "../lib/ai-availability";
import styles from "./study-workspace.module.css";

type Lookup = { word: string; context: string; top: number; left: number };

function previewKind(file: File): "audio" | "video" | "text" | "unsupported" {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  if (/\.(?:srt|vtt|txt)$/i.test(file.name) || file.type === "text/plain" || file.type === "text/vtt") return "text";
  return "unsupported";
}

function tokenise(text: string): string[] {
  return text.match(/[\p{L}\p{N}']+|[^\p{L}\p{N}']+/gu) ?? [text];
}

function formatTime(milliseconds?: number): string | null {
  if (milliseconds === undefined) return null;
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function StudyWorkspace() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const sourceTitle = searchParams.get("title");
  const embed = source ? youtubeEmbedUrl(source) : null;
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(() => getStudyFile(searchParams.get("local")));
  const [segments, setSegments] = useState<StudySegment[]>([]);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState<AiProviderId>("deepseek");
  const [manualTranscript, setManualTranscript] = useState("");

  const kind = file ? previewKind(file) : null;
  const url = useMemo(() => file && (kind === "audio" || kind === "video") ? URL.createObjectURL(file) : null, [file, kind]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => {
    if (!file || kind !== "text") return;
    let active = true;
    void file.text().then((text) => { if (active) setSegments(parseStudySegments(text, file.name)); }).catch(() => { if (active) setSegments([]); });
    return () => { active = false; };
  }, [file, kind]);

  function chooseFile(selected: File | null) {
    if (!selected) return;
    setStudyFile(selected);
    setFile(selected);
    setSegments([]);
    setLookup(null);
    setSaved(false);
  }

  function openLookup(word: string, context: string, target: HTMLButtonElement) {
    const clean = word.replace(/^'+|'+$/g, "");
    if (!clean) return;
    const rect = target.getBoundingClientRect();
    setSaved(false);
    setLookup({ word: clean, context, top: Math.min(rect.bottom + 8, window.innerHeight - 240), left: Math.min(rect.left, window.innerWidth - 310) });
  }

  return <section className={styles.workspace}>
    <header className={styles.heading}>
      <div><p className="eyebrow">ASSISTED STUDY SPACE</p><h1>{file?.name ?? sourceTitle ?? "Open a material to study"}</h1><p>Official embeds stay with their publisher. Transcript parsing, word lookup, notes, and saved words work even while AI is unavailable.</p></div>
      <Link href="/language-lab" className={styles.back}>Back to Language Lab</Link>
    </header>

    <div className={styles.toolbar}>
      <button type="button" className="secondary-action" onClick={() => picker.current?.click()}>Choose local material</button>
      <input ref={picker} className="sr-only" type="file" accept=".srt,.vtt,.txt,audio/*,video/*" onChange={(event) => chooseFile(event.target.files?.item(0) ?? null)} />
      <span>{file ? "Local preview only — not uploaded" : "SRT, VTT, TXT, audio, or video"}</span>
    </div>

    {!file && !source ? <div className={styles.empty}><strong>Choose a file or a catalogue source to start.</strong><p>Text and subtitles become a manual transcript immediately; audio and video remain playable locally while a transcript awaits AI or a subtitle file.</p></div> : <>
      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Material preview">
          <p className="section-kicker">LOCAL PREVIEW</p>
          {kind === "audio" && url && <audio className={styles.media} controls src={url}>Your browser cannot preview this audio file.</audio>}
          {kind === "video" && url && <video className={styles.media} controls src={url}>Your browser cannot preview this video file.</video>}
          {kind === "text" && <p className={styles.textPreview}>{segments.length ? `${segments.length} local segment${segments.length === 1 ? "" : "s"} parsed from ${file?.name ?? "text"}.` : "Reading your local text…"}</p>}
          {embed && <iframe className={styles.embed} src={embed} title={sourceTitle ?? "YouTube learning source"} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
          {source && !embed && <div className={styles.notice}><p>This publisher does not support an in-page preview here.</p><a href={source} target="_blank" rel="noreferrer">Open the source on its publisher site ↗</a></div>}
          {kind === "unsupported" && <p className={styles.notice}>This format cannot be previewed here yet. Try a subtitle, text, audio, or video file.</p>}
          {(kind === "audio" || kind === "video") && <p className={styles.notice}>No transcript has been invented for this media. Add an SRT/VTT file or connect an AI transcription flow.</p>}
        </section>
        <aside className={styles.aiPanel}>
          <AiModelControl capability="structured-text" value={provider} onChange={(next) => setProvider(next)} />
          <p><strong>Translation & explanation: awaiting AI.</strong> This workspace does not send your file to a provider or claim a machine translation.</p>
        </aside>
      </div>

      <section className={styles.transcript} aria-label="Bilingual transcript">
        <div className={styles.transcriptHeading}><div><p className="section-kicker">TRANSCRIPT</p><h2>Original, with space for AI meaning</h2></div><span>Click a word to look it up or save it.</span></div>
        {!segments.length && <div className={styles.manualTranscript}><label><span>Paste a transcript or subtitle text you are allowed to use</span><textarea rows={6} value={manualTranscript} onChange={(event) => setManualTranscript(event.target.value)} placeholder="Paste transcript text here…" /></label><button type="button" className="secondary-action" disabled={!manualTranscript.trim()} onClick={() => setSegments(parseStudySegments(manualTranscript))}>Create study transcript</button></div>}
        {segments.length ? <div className={styles.rows}>{segments.map((segment) => <article className={styles.row} key={segment.id}>
          <div className={styles.time}>{formatTime(segment.startMs) ?? "—"}</div>
          <div><p className={styles.original}>{tokenise(segment.original).map((part, index) => /^[\p{L}\p{N}']/u.test(part) ? <button type="button" className={styles.word} key={`${part}-${index}`} onClick={(event) => openLookup(part, segment.original, event.currentTarget)}>{part}</button> : <span key={`${part}-${index}`}>{part}</span>)}</p><p className={styles.translation}>AI translation awaiting connection</p></div>
        </article>)}</div> : <div className={styles.awaiting}><strong>Manual transcript ready when available.</strong><p>{kind === "text" ? "This text did not contain readable paragraphs." : "Audio and video can play locally; add a subtitle file to create transcript rows without waiting for AI."}</p></div>}
      </section>
    </>}

    {lookup && <aside className={styles.lookup} style={{ top: lookup.top, left: lookup.left }} role="dialog" aria-label={`Lookup ${lookup.word}`}>
      <button type="button" className={styles.close} onClick={() => setLookup(null)} aria-label="Close lookup">×</button>
      <p className="section-kicker">WORD LOOKUP</p><h2>{lookup.word}</h2><p className={styles.lookupDefinition}>Meaning and explanation await AI. You can still keep this word and add your own note now.</p>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Your note (saved locally with the word)" aria-label="Word note" />
      <button type="button" className="primary-action" onClick={() => { saveVocabularyLocal({ term: lookup.word, context: `${lookup.context}${note ? ` — ${note}` : ""}`, sourceModule: "language" }); setSaved(true); }}>Save word</button>
      {saved && <p className={styles.saved} role="status">Saved locally to Vocabulary.</p>}
    </aside>}
  </section>;
}
