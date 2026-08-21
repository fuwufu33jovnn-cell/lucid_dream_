import type { PortfolioDraft } from "./portfolio.ts";

export type CareerEvidenceKind =
  | "audience"
  | "problem"
  | "role"
  | "constraint"
  | "decision"
  | "alternative"
  | "iteration"
  | "outcome"
  | "role-fit";

export type CareerEvidenceProvenance = "learner-claim" | "imported-source" | "ai-inference";

export type CareerEvidenceClaim = {
  id: string;
  kind: CareerEvidenceKind;
  claim: string;
  support: string;
  provenance: CareerEvidenceProvenance;
};

export type CareerProjectSummary = {
  id: string;
  title: string;
  summary: string;
  targetRole: string;
  evidence: CareerEvidenceClaim[];
  artifactCount: number;
  practiceCount: number;
};

export type CareerNextAction =
  | { type: "add-project-context" }
  | { type: "confirm-evidence"; evidenceId: string }
  | { type: "add-support"; evidenceId: string }
  | { type: "add-evidence"; kind: "problem" | "decision" | "outcome" }
  | { type: "create-artifact" }
  | { type: "practice-walkthrough" }
  | { type: "review-progress" };

const REQUIRED_KINDS = ["problem", "decision", "outcome"] as const;

export function careerCompleteness(project: CareerProjectSummary): {
  completed: number;
  total: 7;
  supportedClaims: number;
} {
  const supportedClaims = project.evidence.filter(
    (item) => item.provenance !== "ai-inference" && item.support.trim().length > 0,
  ).length;
  const completed = [
    project.summary.trim().length > 0,
    project.targetRole.trim().length > 0,
    ...REQUIRED_KINDS.map((kind) => project.evidence.some((item) => item.kind === kind && item.claim.trim().length > 0)),
    project.artifactCount > 0,
    project.practiceCount > 0,
  ].filter(Boolean).length;
  return { completed, total: 7, supportedClaims };
}

export function nextCareerAction(project: CareerProjectSummary): CareerNextAction {
  if (!project.title.trim() || !project.summary.trim() || !project.targetRole.trim()) {
    return { type: "add-project-context" };
  }
  const unconfirmed = project.evidence.find((item) => item.provenance === "ai-inference");
  if (unconfirmed) return { type: "confirm-evidence", evidenceId: unconfirmed.id };

  const unsupported = project.evidence.find((item) => item.claim.trim() && !item.support.trim());
  if (unsupported) return { type: "add-support", evidenceId: unsupported.id };

  for (const kind of REQUIRED_KINDS) {
    if (!project.evidence.some((item) => item.kind === kind && item.claim.trim())) {
      return { type: "add-evidence", kind };
    }
  }
  if (project.artifactCount === 0) return { type: "create-artifact" };
  if (project.practiceCount === 0) return { type: "practice-walkthrough" };
  return { type: "review-progress" };
}

function legacyEvidence(kind: CareerEvidenceKind, claim: string, ordinal: number): CareerEvidenceClaim | null {
  const value = claim.trim();
  return value
    ? { id: `legacy-${kind}-${ordinal}`, kind, claim: value, support: "", provenance: "learner-claim" }
    : null;
}

export function normalizeLegacyPortfolioDraft(draft: PortfolioDraft): CareerProjectSummary {
  const candidates = [
    legacyEvidence("audience", draft.audience, 1),
    legacyEvidence("problem", draft.painPoint, 2),
    legacyEvidence("role", draft.role, 3),
    legacyEvidence("decision", draft.choices, 4),
    legacyEvidence("constraint", draft.system, 5),
    legacyEvidence("iteration", draft.iteration, 6),
    legacyEvidence("outcome", draft.impact, 7),
    legacyEvidence("role-fit", draft.nextRole, 8),
  ].filter((item): item is CareerEvidenceClaim => item !== null);

  return {
    id: "legacy-import",
    title: draft.project.trim() || "Imported portfolio project",
    summary: draft.project.trim(),
    targetRole: draft.nextRole.trim(),
    evidence: candidates,
    artifactCount: 0,
    practiceCount: 0,
  };
}

export function createBlankCareerProject(id = "career-project-1"): CareerProjectSummary {
  return { id, title: "", summary: "", targetRole: "", evidence: [], artifactCount: 0, practiceCount: 0 };
}
