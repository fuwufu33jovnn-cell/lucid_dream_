"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CareerProjectRow } from "../lib/cloud-models";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { useAuth } from "./auth-provider";
import styles from "./career-studio.module.css";

const FLOW = [
  ["01", "Project evidence", "记录问题、角色、限制、决策、迭代和结果，并为每个说法补充依据。"],
  ["02", "Application artifacts", "基于已确认的证据生成简历要点、求职信段落和作品集结构。"],
  ["03", "English practice", "进行 60 秒介绍、5 分钟 walkthrough 和职位面试练习，获得语言反馈。"],
];

export function CareerDashboard() {
  const auth = useAuth();
  const [projects, setProjects] = useState<CareerProjectRow[]>([]);
  useEffect(() => {
    if (auth.loading || !auth.user) return;
    let active = true;
    void (async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      const { data } = await client.from("career_projects").select("*").eq("status", "active").order("updated_at", { ascending: false }).limit(6);
      if (active && data) setProjects(data);
    })();
    return () => { active = false; };
  }, [auth.loading, auth.user]);
  const latest = projects[0];
  return <section className={styles.dashboard}>
    <div className={styles.heroCard}><div><span className={styles.kicker}>YOUR NEXT ACTION</span><h2>先建立一份可信的项目证据</h2><p>Career Studio 不再只是草稿本。它会检查证据缺口，再引导你生成材料和练习表达。</p></div><Link className={styles.primaryAction} href="/career/project/">Create project</Link></div>
    <div className={styles.flowGrid}>{FLOW.map(([number,title,copy]) => <article className={styles.flowCard} key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    <div className={styles.projectGrid}>
      <article className={styles.projectCard}><div className={styles.projectTop}><span>{latest ? `${projects.length} ACCOUNT PROJECT${projects.length === 1 ? "" : "S"}` : "PROJECT TEMPLATE"}</span><b>{latest ? "CLOUD" : "0 / 7"}</b></div><h3>{latest?.title ?? "New evidence-based case study"}</h3><p>{latest ? "继续补充证据、生成申请材料并练习英文表达。" : "目标职位、项目背景与证据还未填写。"}</p><div className={styles.progress}><span /></div><Link href={latest ? `/career/project/?id=${latest.id}` : "/career/project/"}>{latest ? "Continue project" : "Open workspace"} →</Link></article>
      <article className={styles.insightCard}><span className={styles.kicker}>WHY IT HELPS</span><h3>每段生成内容都能追溯到证据</h3><p>缺少数据时，系统会向你提问，不会替你编造影响、职责或研究结果。</p></article>
    </div>
  </section>;
}
