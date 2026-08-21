import type { CareerEvidenceClaim } from "./career-projects.ts";

export type CareerArtifactType = "resume_bullet" | "cover_letter" | "case_study" | "walkthrough_short" | "walkthrough_long";
export type EvidencePacketItem = Pick<CareerEvidenceClaim, "id" | "kind" | "claim" | "support">;
export type CareerArtifactVersion = {
  id: string;
  artifactType: CareerArtifactType;
  content: string;
  accepted: boolean;
  parentVersionId: string | null;
  evidenceIds: string[];
  provider: string | null;
  model: string | null;
  createdAt: string;
};

export function buildEvidencePacket(evidence: CareerEvidenceClaim[]): EvidencePacketItem[] {
  if (evidence.some((item) => item.provenance === "ai-inference")) {
    throw new Error("Confirm the evidence before using an AI inference.");
  }
  if (evidence.some((item) => !item.claim.trim() || !item.support.trim())) {
    throw new Error("Every selected claim needs supporting evidence.");
  }
  return evidence.map(({ id, kind, claim, support }) => ({ id, kind, claim, support }));
}

export function createArtifactVersion(
  parent: CareerArtifactVersion,
  generated: Pick<CareerArtifactVersion, "id" | "content" | "evidenceIds" | "provider" | "model" | "createdAt">,
): CareerArtifactVersion {
  return { ...generated, artifactType: parent.artifactType, parentVersionId: parent.id, accepted: false };
}

export function draftArtifactFromEvidence(type: CareerArtifactType, evidence: EvidencePacketItem[]): string {
  const claims = evidence.map((item) => item.claim.trim()).filter(Boolean);
  if (claims.length === 0) return "Select supported evidence before creating a draft.";
  if (type === "resume_bullet") return `${claims.slice(0, 2).join("; ")}. [Add a verified result or learning.]`;
  if (type === "cover_letter") return `In this project, ${claims.join(". ")}. This experience is relevant because [connect it to the target role].`;
  if (type === "case_study") return `Context\n${claims[0]}\n\nDecision\n${claims.slice(1).join(". ") || "Add a supported design decision."}\n\nOutcome\nAdd a verified result or what you would measure next.`;
  return `This project focused on ${claims[0]}. ${claims.slice(1).join(". ")} I can support these points with the evidence attached to this project.`;
}
