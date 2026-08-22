"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readVocabularyLocal, scheduleVocabularyReview, writeVocabularyLocal, type LocalVocabularyEntry, type ReviewResult } from "../lib/vocabulary";
import styles from "./vocabulary-notebook.module.css";

export function VocabularyNotebook() {
  const [rows,setRows]=useState<LocalVocabularyEntry[]>([]); const [query,setQuery]=useState(""); const [filter,setFilter]=useState("all");
  useEffect(()=>{const timer=window.setTimeout(()=>setRows(readVocabularyLocal()),0); const sync=()=>setRows(readVocabularyLocal()); window.addEventListener("lucid-vocabulary-updated",sync); return()=>{window.clearTimeout(timer);window.removeEventListener("lucid-vocabulary-updated",sync);};},[]);
  const visible=useMemo(()=>rows.filter((row)=>(filter==="all"||row.familiarity===filter)&&`${row.term} ${row.definitionEn} ${row.definitionZh} ${row.learnerNote}`.toLowerCase().includes(query.toLowerCase())),[filter,query,rows]);
  function update(id:string,patch:Partial<LocalVocabularyEntry>){const next=rows.map((row)=>row.id===id?{...row,...patch}:row);setRows(next);writeVocabularyLocal(next);}
  function review(row:LocalVocabularyEntry,result:ReviewResult){update(row.id,scheduleVocabularyReview(row,result,new Date().toISOString().slice(0,10)));}
  function remove(id:string){const next=rows.filter((row)=>row.id!==id);setRows(next);writeVocabularyLocal(next);}
  return <section className={styles.notebook}>
    <div className={styles.toolbar}><div><strong>{rows.length}</strong><span>saved words</span></div><input aria-label="Search vocabulary" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search word, meaning or note"/><select aria-label="Familiarity" value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">All stages</option><option value="new">New</option><option value="learning">Learning</option><option value="familiar">Familiar</option><option value="mastered">Mastered</option></select><Link href="/language-lab/">Back to Language Lab</Link></div>
    {visible.length===0?<div className={styles.empty}><span>Aa</span><h2>Your word notebook is ready.</h2><p>在学习素材中点击单词并选择 Save word，词汇和当时的语境就会出现在这里。</p><Link href="/language-lab/">Find a learning material</Link></div>:<div className={styles.grid}>{visible.map((row)=><article className={styles.card} key={row.id}><div className={styles.word}><div><h2>{row.term}</h2><span>{row.familiarity} · {row.reviewDueAt?`review ${row.reviewDueAt}`:"not scheduled"}</span></div><button onClick={()=>remove(row.id)} type="button">Remove</button></div><label>English meaning<input value={row.definitionEn} onChange={(e)=>update(row.id,{definitionEn:e.target.value})} placeholder="Add your meaning"/></label><label>中文解释<input value={row.definitionZh} onChange={(e)=>update(row.id,{definitionZh:e.target.value})} placeholder="添加中文释义"/></label><div className={styles.context}><strong>Saved context</strong>{row.sourceRefs.map((ref,index)=><p key={`${ref.module}-${index}`}><span>{ref.module}</span>{ref.context||"No context saved"}</p>)}</div><label>My note<textarea rows={2} value={row.learnerNote} onChange={(e)=>update(row.id,{learnerNote:e.target.value})}/></label><div className={styles.review}><span>How well did you remember it?</span>{(["again","hard","good","easy"] as ReviewResult[]).map((result)=><button key={result} type="button" onClick={()=>review(row,result)}>{result}</button>)}</div></article>)}</div>}
    <p className={styles.localNote}>当前检查点保存在此浏览器；账号云同步将在数据库后端部署后启用。</p>
  </section>;
}
