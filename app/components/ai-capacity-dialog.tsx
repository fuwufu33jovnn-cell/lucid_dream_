"use client";

import { providerAccountUrl, type AiAvailability } from "../lib/ai-availability";
import styles from "./ai-capacity-dialog.module.css";

export function AiCapacityDialog({ providers, onClose }: { providers: AiAvailability[]; onClose: () => void }) {
  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="capacity-title">
      <button className={styles.close} type="button" onClick={onClose} aria-label="Close">×</button>
      <span className={styles.kicker}>AI CAPACITY</span>
      <h2 id="capacity-title">免费额度暂时用完了</h2>
      <p>笔记、素材浏览和单词本仍然可以使用。要继续 AI 分析，请选择一个提供商前往其官方控制台充值或升级；网站不会替你自动购买，也不会把内容静默发送给另一家模型。</p>
      <div className={styles.providers}>{providers.map((row) => <a href={providerAccountUrl(row.provider)} target="_blank" rel="noreferrer" key={row.provider}><strong>{row.label}</strong><span>{row.allowanceLabel || "Exhausted"}</span><b>Open official console ↗</b></a>)}</div>
      <button className={styles.later} type="button" onClick={onClose}>Continue without AI</button>
    </section>
  </div>;
}
