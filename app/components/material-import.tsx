"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { IMPORT_LIMITS, classifyImport } from "../lib/material-import.ts";
import { setStudyFile } from "../lib/study-session";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { useAuth } from "./auth-provider";
import styles from "./material-import.module.css";

type Mode = "link" | "file";

export function MaterialImport() {
  const router = useRouter();
  const { user, configured } = useAuth();
  const [mode, setMode] = useState<Mode>("link");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submitLink() {
    const client = getSupabaseBrowserClient();
    if (!client || !user) return setStatus("Sign in to import a personal link.");
    setBusy(true); setStatus("Checking the link…");
    const { data, error } = await client.functions.invoke("import-learning-material", { body: { url } });
    setBusy(false);
    setStatus(error ? "Link import could not start." : data?.needsInput ? "This source needs a permitted subtitle or file." : "Link queued for private study setup.");
  }

  function pickFile(selected: File | null) {
    if (!selected) { setFile(null); setStatus(""); return; }
    if (classifyImport(selected) === "unsupported" || classifyImport(selected) === "pdf" || selected.size > IMPORT_LIMITS.maxFileBytes) {
      setStatus("Choose an accepted file within the stated limit.");
      return;
    }
    setFile(selected);
    setStatus(`Opening ${selected.name} in your local study workspace…`);
    router.push(`/language-lab/study?local=${encodeURIComponent(setStudyFile(selected))}`);
  }

  return <section className={styles.importer} aria-busy={busy}>
    <div className={styles.heading}><div><h2>Bring your own study material</h2><p>Links and files stay private to your account. We never promise a transcript when one is unavailable.</p></div><span className={styles.limits}>HTTPS · SRT/VTT/TXT · audio/video · up to {IMPORT_LIMITS.maxFileBytes / 1024 / 1024} MB</span></div>
    <div className={styles.tabs} role="tablist"><button className={mode === "link" ? styles.active : undefined} type="button" onClick={() => setMode("link")}>Paste link</button><button className={mode === "file" ? styles.active : undefined} type="button" onClick={() => setMode("file")}>Open local file</button></div>
    {mode === "link" ? configured ? <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void submitLink(); }}><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://publisher.example/item" required /><button className={styles.submit} disabled={busy} type="submit">Import private link</button></form> : <p className={styles.notice}>Private link import becomes available after this site is connected to Supabase. Local files remain available now.</p> : <div className={styles.form}><label className={styles.drop} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); pickFile(event.dataTransfer.files.item(0)); }}><strong>{file ? file.name : "Drop a permitted file here"}</strong><span>Open SRT, VTT, TXT, audio, or video for immediate local study</span><input ref={fileInput} type="file" accept=".srt,.vtt,.txt,audio/*,video/*" onChange={(event) => pickFile(event.target.files?.item(0) ?? null)} /></label></div>}
    <p className={status.includes("could not") || status.includes("Choose") ? `${styles.status} ${styles.error}` : styles.status} role="status">{status}</p>
  </section>;
}
