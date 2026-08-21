import type {
  LearningSourceHealth,
  LearningSourceInsert,
  LearningSourceRow,
} from "./cloud-models.ts";
import { SEED_LIBRARY } from "./seeds.ts";

export type LearningMediaType = LearningSourceRow["media_type"];

export type SourceCandidate = {
  publisher: string;
  title: string;
  canonicalUrl: string;
  mediaType: LearningMediaType;
  topics?: string[];
  cefrLevel?: LearningSourceRow["cefr_level"];
  expectedDurationSeconds?: number | null;
  skills?: string[];
  hasText?: boolean;
  usageBasis: string;
  lastCheckedAt?: string | null;
  health?: LearningSourceHealth;
};

export type NormalizedSource = Omit<LearningSourceInsert,
  "topics" | "cefr_level" | "expected_duration_seconds" | "skills" | "has_text" | "last_checked_at" | "health"
> & {
  canonicalKey: string;
  topics: string[];
  cefr_level: LearningSourceRow["cefr_level"];
  expected_duration_seconds: number | null;
  skills: string[];
  has_text: boolean;
  last_checked_at: string | null;
  health: LearningSourceHealth;
};

export type CatalogueFilters = {
  kind?: LearningMediaType;
  topic?: string;
  cefrLevel?: NonNullable<LearningSourceRow["cefr_level"]>;
  maxDurationSeconds?: number;
  hasText?: boolean;
  health?: LearningSourceHealth;
  query?: string;
  page?: number;
  pageSize?: number;
};

export type CataloguePage = {
  items: NormalizedSource[];
  total: number;
  hasMore: boolean;
};

function isTrackingParameter(key: string): boolean {
  return key.toLowerCase().startsWith("utm_") || ["fbclid", "gclid"].includes(key.toLowerCase());
}

function canonicalizeUrl(value: string): { canonicalKey: string; canonicalUrl: string } {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Learning sources must use HTTPS URLs.");

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const videoId = host === "youtu.be"
    ? url.pathname.slice(1)
    : host.endsWith("youtube.com") ? url.searchParams.get("v") : null;
  if (videoId && /^[A-Za-z0-9_-]+$/.test(videoId)) {
    return {
      canonicalKey: `youtube:${videoId}`,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  const kept = [...url.searchParams.entries()]
    .filter(([key]) => !isTrackingParameter(key))
    .sort(([left], [right]) => left.localeCompare(right));
  const path = url.pathname.replace(/\/$/, "") || "/";
  const query = kept.length ? `?${new URLSearchParams(kept).toString()}` : "";
  const canonicalUrl = `https://${host}${path}${query}`;
  return { canonicalKey: `url:${host}${path}${query}`, canonicalUrl };
}

export function normalizeSource(candidate: SourceCandidate): NormalizedSource {
  const { canonicalKey, canonicalUrl } = canonicalizeUrl(candidate.canonicalUrl);
  return {
    canonicalKey,
    publisher: candidate.publisher.trim(),
    title: candidate.title.trim(),
    canonical_url: canonicalUrl,
    media_type: candidate.mediaType,
    topics: [...new Set((candidate.topics ?? []).map((topic) => topic.trim()).filter(Boolean))],
    cefr_level: candidate.cefrLevel ?? null,
    expected_duration_seconds: candidate.expectedDurationSeconds ?? null,
    skills: [...new Set((candidate.skills ?? []).map((skill) => skill.trim()).filter(Boolean))],
    has_text: candidate.hasText ?? false,
    usage_basis: candidate.usageBasis.trim(),
    last_checked_at: candidate.lastCheckedAt ?? new Date().toISOString(),
    health: candidate.health ?? "healthy",
  };
}

export function dedupeSources(candidates: SourceCandidate[]): NormalizedSource[] {
  const byCanonicalKey = new Map<string, NormalizedSource>();
  for (const candidate of candidates) {
    const row = normalizeSource(candidate);
    const existing = byCanonicalKey.get(row.canonicalKey);
    if (!existing) {
      byCanonicalKey.set(row.canonicalKey, row);
      continue;
    }
    byCanonicalKey.set(row.canonicalKey, {
      ...existing,
      topics: [...new Set([...existing.topics, ...row.topics])],
      skills: [...new Set([...existing.skills, ...row.skills])],
      has_text: existing.has_text || row.has_text,
      health: existing.health === "healthy" || row.health === "healthy" ? "healthy" : existing.health,
    });
  }
  return [...byCanonicalKey.values()];
}

export function filterCatalogue(rows: NormalizedSource[], filters: CatalogueFilters = {}): CataloguePage {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const matches = rows.filter((row) => {
    const haystack = `${row.title} ${row.publisher} ${row.topics.join(" ")} ${row.skills.join(" ")}`.toLowerCase();
    const topic = filters.topic?.trim().toLowerCase();
    return (!filters.kind || row.media_type === filters.kind)
      && (!topic || row.topics.some((item) => item.toLowerCase() === topic))
      && (!filters.cefrLevel || row.cefr_level === filters.cefrLevel)
      && (filters.maxDurationSeconds === undefined || (row.expected_duration_seconds ?? Number.POSITIVE_INFINITY) <= filters.maxDurationSeconds)
      && (filters.hasText === undefined || row.has_text === filters.hasText)
      && (!filters.health || row.health === filters.health)
      && (!query || haystack.includes(query));
  });
  const pageSize = Math.min(Math.max(filters.pageSize ?? 8, 1), 24);
  const page = Math.max(filters.page ?? 0, 0);
  const start = page * pageSize;
  return { items: matches.slice(start, start + pageSize), total: matches.length, hasMore: start + pageSize < matches.length };
}

function fallbackMediaType(sourceUrl: string): LearningMediaType {
  if (sourceUrl.includes("developer.apple.com/videos") || sourceUrl.includes("config.figma.com")) return "video";
  if (sourceUrl.includes("ocw.mit.edu")) return "course";
  return "article";
}

export const fallbackCatalogue: NormalizedSource[] = SEED_LIBRARY.map((seed) => normalizeSource({
  publisher: seed.publisher,
  title: seed.title,
  canonicalUrl: seed.sourceUrl,
  mediaType: fallbackMediaType(seed.sourceUrl),
  topics: [seed.category],
  cefrLevel: seed.level,
  expectedDurationSeconds: seed.minutes * 60,
  skills: seed.skills,
  hasText: true,
  usageBasis: seed.usageBasis,
  lastCheckedAt: `${seed.reviewedAt}T00:00:00.000Z`,
  health: "healthy",
}));

export function sourceFromRow(row: LearningSourceRow): NormalizedSource {
  return {
    ...row,
    canonicalKey: canonicalizeUrl(row.canonical_url).canonicalKey,
  };
}
