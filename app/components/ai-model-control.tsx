"use client";

import { useEffect, useState } from "react";
import { allEligibleProvidersExhausted, defaultAiAvailability, parseAvailabilityResponse, type AiAvailability, type AiCapability, type AiProviderId } from "../lib/ai-availability";
import { getSupabaseBrowserClient } from "../lib/supabase";
import styles from "./ai-model-control.module.css";
import { AiCapacityDialog } from "./ai-capacity-dialog";

export function AiModelControl({ capability, value, onChange }: { capability: AiCapability; value: AiProviderId; onChange: (provider: AiProviderId, model: string, available: boolean) => void }) {
  const [rows, setRows] = useState<AiAvailability[]>(defaultAiAvailability);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const client = getSupabaseBrowserClient();
      if (!client) { if (active) setLoading(false); return; }
      const { data, error } = await client.functions.invoke("ai-availability", { body: { capability } });
      if (!active) return;
      if (!error) { setRows(parseAvailabilityResponse(data)); setDismissed(false); }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [capability]);

  const selected = rows.find((row) => row.provider === value && row.capabilities.includes(capability)) ?? rows.find((row) => row.provider === value) ?? rows[0];
  const exhausted = !loading && allEligibleProvidersExhausted(rows, capability);
  function choose(provider: AiProviderId) {
    const row = rows.find((item) => item.provider === provider) ?? defaultAiAvailability.find((item) => item.provider === provider)!;
    onChange(row.provider, row.model, row.state === "available" && row.capabilities.includes(capability));
  }

  return <><section className={styles.control} aria-label="AI model control">
    <div><span className={styles.label}>CURRENT AI</span><strong>{selected?.label ?? "Not selected"}</strong><small>{selected?.model ?? "No model"}</small></div>
    <label><span className="sr-only">Choose AI provider</span><select value={value} onChange={(event) => choose(event.target.value as AiProviderId)}>{rows.map((row) => <option value={row.provider} key={`${row.provider}:${row.model}`}>{row.label} · {row.state}</option>)}</select></label>
    <span className={`${styles.status} ${selected?.state === "available" ? styles.available : ""}`}>{loading ? "Checking…" : selected?.allowanceLabel ?? "Unavailable"}</span>
  </section>{exhausted && !dismissed && <AiCapacityDialog providers={rows.filter((row) => row.capabilities.includes(capability) && row.state === "exhausted")} onClose={() => setDismissed(true)} />}</>;
}
