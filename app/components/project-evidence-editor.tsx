"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { careerCompleteness, createBlankCareerProject, nextCareerAction, type CareerEvidenceClaim, type CareerEvidenceKind, type CareerProjectSummary } from "../lib/career-projects";
import styles from "./career-studio.module.css";

const STORAGE_KEY = "lucid-career-project-v2";
const EVIDENCE_TYPES: Array<{ kind: CareerEvidenceKind; label: string; prompt: string }> = [
  { kind: "problem", label: "Problem", prompt: "What observable problem did people face?" },
  { kind: "role", label: "Your role", prompt: "What did you personally own or contribute?" },
  { kind: "constraint", label: "Constraints", prompt: "What limits shaped the work?" },
  { kind: "decision", label: "Decision", prompt: "What did you choose, and why?" },
  { kind: "iteration", label: "Iteration", prompt: "What changed after feedback or testing?" },
  { kind: "outcome", label: "Outcome", prompt: "What changed, or what would you measure next?" },
];

function actionLabel(project: CareerProjectSummary): string {
  const action = nextCareerAction(project);
  if (action.type === "add-project-context") return "Complete the project context";
  if (action.type === "confirm-evidence") return "Confirm or remove the AI inference";
  if (action.type === "add-support") return "Add support for the highlighted claim";
  if (action.type === "add-evidence") return `Add ${action.kind} evidence`;
  if (action.type === "create-artifact") return "Create your first application artifact";
  if (action.type === "practice-walkthrough") return "Practise the project walkthrough";
  return "Review progress and choose the next role";
}

export function ProjectEvidenceEditor() {
  const [project, setProject] = useState<CareerProjectSummary>(() => createBlankCareerProject());
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState("Loading this project…");
  const localId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setProject(JSON.parse(saved) as CareerProjectSummary); setSaveState("Saved on this device"); }
      catch { setSaveState("Local saving unavailable"); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); setSaveState("Saved on this device"); }
      catch { setSaveState("Local saving unavailable"); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, project]);

  const completeness = useMemo(() => careerCompleteness(project), [project]);
  const nextAction = useMemo(() => nextCareerAction(project), [project]);
  const updateProject = (patch: Partial<CareerProjectSummary>) => { setSaveState("Saving…"); setProject((current) => ({ ...current, ...patch })); };
  const updateEvidence = (id: string, patch: Partial<CareerEvidenceClaim>) => updateProject({ evidence: project.evidence.map((item) => item.id === id ? { ...item, ...patch } : item) });
  function addEvidence(kind: CareerEvidenceKind) {
    localId.current += 1;
    const item: CareerEvidenceClaim = { id: globalThis.crypto.randomUUID?.() ?? `${kind}-${localId.current}`, kind, claim: "", support: "", provenance: "learner-claim" };
    updateProject({ evidence: [...project.evidence, item] });
  }

  return <section className={styles.editorShell}>
    <aside className={styles.editorSidebar}><span className={styles.kicker}>EVIDENCE MAP</span><strong className={styles.bigScore}>{completeness.completed}<small> / {completeness.total}</small></strong><div className={styles.progress}><span style={{ width: `${completeness.completed / completeness.total * 100}%` }} /></div><p>{completeness.supportedClaims} claims have supporting evidence.</p><div className={styles.nextAction}><span>NEXT ACTION</span><strong>{actionLabel(project)}</strong></div><span className={styles.saveState} role="status">{saveState}</span></aside>
    <div className={styles.editorMain}>
      <section className={styles.contextCard}><label><span>Project title</span><input value={project.title} onChange={(event) => updateProject({ title: event.target.value })} placeholder="e.g. Campus wayfinding redesign" /></label><label><span>Project summary</span><textarea rows={3} value={project.summary} onChange={(event) => updateProject({ summary: event.target.value })} placeholder="What did you make and why did it exist?" /></label><label><span>Target role</span><input value={project.targetRole} onChange={(event) => updateProject({ targetRole: event.target.value })} placeholder="e.g. Product designer" /></label></section>
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>CLAIMS + SUPPORT</span><h2>Project evidence</h2></div><span>AI will only use confirmed evidence</span></div>
      <div className={styles.evidenceList}>{EVIDENCE_TYPES.map((type) => { const items = project.evidence.filter((item) => item.kind === type.kind); return <article className={styles.evidenceCard} key={type.kind}><div className={styles.evidenceHeader}><div><span>{type.label}</span><p>{type.prompt}</p></div><button type="button" onClick={() => addEvidence(type.kind)}>+ Add claim</button></div>{items.length === 0 ? <p className={styles.emptyEvidence}>No evidence recorded yet.</p> : items.map((item) => <div className={`${styles.claimGrid} ${nextAction.type === "add-support" && nextAction.evidenceId === item.id ? styles.needsSupport : ""}`} key={item.id}><label><span>Your claim</span><textarea rows={2} value={item.claim} onChange={(event) => updateEvidence(item.id, { claim: event.target.value })} /></label><label><span>How can you support it?</span><textarea rows={2} value={item.support} onChange={(event) => updateEvidence(item.id, { support: event.target.value })} placeholder="Observation, test notes, file, link or metric" /></label><button className={styles.removeButton} type="button" onClick={() => updateProject({ evidence: project.evidence.filter((entry) => entry.id !== item.id) })}>Remove</button></div>)}</article>; })}</div>
    </div>
  </section>;
}
