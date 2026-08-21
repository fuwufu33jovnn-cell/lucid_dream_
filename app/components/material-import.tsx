"use client";

import { useRef, useState } from "react";

import { ACCEPTED_IMPORT_TYPES, IMPORT_LIMITS, buildPrivateUploadPath, classifyImport, safeFileName } from "../lib/material-import.ts";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { useAuth } from "./auth-provider";
import styles from "./material-import.module.css";

type Mode = "link" | "file";

export function MaterialImport() {
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

  async function submitFile(selected: File | null) {
    const client = getSupabaseBrowserClient();
    if (!selected) return setStatus("Choose a file first.");
    if (!client || !user) return setStatus("Sign in to upload a private file.");
    if (classifyImport(selected) === "unsupported" || selected.size > IMPORT_LIMITS.maxFileBytes) return setStatus("Choose an accepted file within the stated limit.");
    const materialId = crypto.randomUUID();
    const filename = safeFileName(selected.name);
    const storagePath = buildPrivateUploadPath(user.id, materialId, filename);
    setBusy(true); setStatus("Preparing a private upload…");
    const signed = await client.storage.from("learning-imports").createSignedUploadUrl(storagePath);
    if (signed.error || !signed.data?.token) { setBusy(false); return setStatus("Private upload could not start."); }
    const uploaded = await client.storage.from("learning-imports").uploadToSignedUrl(storagePath, signed.data.token, selected, { contentType: selected.type });
    if (uploaded.error) { setBusy(false); return setStatus("Private upload did not complete."); }
    const { data, error } = await client.functions.invoke("import-learning-material", {
      body: { materialId, storagePath, filename, claimedMime: selected.type, fileSize: selected.size, title: selected.name },
    });
    setBusy(false);
    setStatus(error ? "Upload verification could not start." : data?.needsInput ? "This file needs a permitted subtitle or a different format." : "Private file queued for processing.");
  }

  function pickFile(selected: File | null) { setFile(selected); setStatus(selected ? `${selected.name} selected` : ""); }

  return <section className={styles.importer} aria-busy={busy}>
    <div className={styles.heading}><div><h2>Bring your own study material</h2><p>Links and files stay private to your account. We never promise a transcript when one is unavailable.</p></div><span className={styles.limits}>HTTPS · SRT/VTT/TXT/PDF · audio/video · up to {IMPORT_LIMITS.maxFileBytes / 1024 / 1024} MB</span></div>
    {!configured ? <p className={styles.notice}>Private import becomes available after this site is connected to Supabase.</p> : <>
      <div className={styles.tabs} role="tablist"><button className={mode === "link" ? styles.active : undefined} type="button" onClick={() => setMode("link")}>Paste link</button><button className={mode === "file" ? styles.active : undefined} type="button" onClick={() => setMode("file")}>Upload file</button></div>
      {mode === "link" ? <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void submitLink(); }}><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://publisher.example/item" required /><button className={styles.submit} disabled={busy} type="submit">Import private link</button></form> : <div className={styles.form}><label className={styles.drop} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); pickFile(event.dataTransfer.files.item(0)); }}><strong>{file ? file.name : "Drop a permitted file here"}</strong><span>or choose an SRT, VTT, TXT, PDF, audio, or video file</span><input ref={fileInput} type="file" accept={ACCEPTED_IMPORT_TYPES} onChange={(event) => pickFile(event.target.files?.item(0) ?? null)} /></label><button className={styles.submit} disabled={busy} type="button" onClick={() => void submitFile(file)}>Upload privately</button></div>}
    </>}
    <p className={status.includes("could not") || status.includes("Choose") ? `${styles.status} ${styles.error}` : styles.status} role="status">{status}</p>
  </section>;
}
