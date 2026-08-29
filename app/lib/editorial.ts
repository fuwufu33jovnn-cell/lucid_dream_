import type { ActivityProgress } from "./models.ts";
import { SEED_LIBRARY, type SeedActivity, type SeedLevel } from "./seeds.ts";
import { CULTURAL_ACTIVITIES } from "./cultural-library.ts";
import type { ContentKind, EditorialPrompts, LearningLine, SourceKind } from "./editorial-types.ts";

export const LAB_MODES = ["Watch", "Listen", "Read", "Culture", "Random"] as const;
export type LabMode = (typeof LAB_MODES)[number];

export type EditorialActivity = {
  id: string;
  mode: LabMode;
  format: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  level: SeedLevel;
  minutes: 5 | 15 | 30;
  contentKind: ContentKind;
  sourceKind: SourceKind;
  youtubeId?: string;
  learningText: LearningLine[];
  editorialNote: string;
  prompts: EditorialPrompts;
  usageBasis: string;
  marginaliaLabel: "Fictional editorial marginalia";
  marginalia: readonly string[];
};

const MODE_BY_ID: Record<string, LabMode> = {
  "apple-design-principles": "Watch",
  "apple-ux-writing": "Watch",
  "apple-inclusive-design": "Watch",
  "apple-presenting-work": "Listen",
  "figma-future-apps": "Listen",
  "figma-config-agenda": "Random",
  "mit-computational-media": "Read",
  "mit-media-assignment": "Read",
  "mit-sociable-media": "Read",
  "material-design": "Random",
  "mit-digital-storytelling": "Culture",
  "mit-visual-arguments": "Culture",
  "mit-codesign": "Read",
  "skillsfuture-framework": "Read",
  "mom-ep": "Read",
  "mom-sat": "Random",
  "singapore-digital": "Culture",
  "ielts-speaking-criteria": "Read",
  "ielts-sample": "Random",
  "moma-magazine": "Read",
  "tate-art-terms": "Culture",
  "smithsonian-open": "Culture",
  "nhs-appointment": "Listen",
  "singapore-renting": "Culture",
};

const NOTES_BY_MODE: Record<LabMode, string> = {
  Watch: "Watch how the idea is framed, not only what is said.",
  Listen: "Treat rhythm, hesitation, and emphasis as part of the language.",
  Read: "Steal the structure of one useful sentence, then make it yours.",
  Culture: "Language makes more sense when you can see the world around it.",
  Random: "A small side door for days when choosing is the hardest part.",
};

function toEditorialActivity(seed: SeedActivity): EditorialActivity {
  const mode = MODE_BY_ID[seed.id] ?? "Random";
  return {
    id: seed.id,
    mode,
    format: seed.skills[0] ?? "Explore",
    title: seed.title,
    publisher: seed.publisher,
    sourceUrl: seed.sourceUrl,
    level: seed.level,
    minutes: seed.minutes,
    contentKind: seed.category === "Design" ? "Design" : seed.category === "Culture" ? "Culture" : "Language",
    sourceKind: "external",
    learningText: [
      { id: `${seed.id}-a`, text: seed.prompt },
      { id: `${seed.id}-b`, text: `Use the source to complete this output: ${seed.output}` },
    ],
    editorialNote: NOTES_BY_MODE[mode],
    prompts: {
      notice: seed.prompt,
      words: "Save one phrase you would genuinely reuse. Add your own example.",
      shadow: "Choose one short line from the source and repeat it three times. Store only your reflection here.",
      talk: seed.output,
    },
    usageBasis: seed.usageBasis,
    marginaliaLabel: "Fictional editorial marginalia",
    marginalia: [
      "understood enough to become curious",
      "kept one sentence; released the rest",
      `${seed.minutes} minutes that did not feel like homework`,
    ],
  };
}

export const EDITORIAL_ACTIVITIES: readonly EditorialActivity[] = [
  ...SEED_LIBRARY.map(toEditorialActivity),
  ...CULTURAL_ACTIVITIES,
];

export function filterEditorialActivities(
  items: readonly EditorialActivity[],
  mode: LabMode,
  query = "",
): EditorialActivity[] {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesMode = item.mode === mode;
    const haystack = `${item.title} ${item.publisher} ${item.format}`.toLowerCase();
    return matchesMode && (!normalized || haystack.includes(normalized));
  });
}

export function availableContentKinds(
  items: readonly EditorialActivity[],
  mode: LabMode,
): ContentKind[] {
  const order: ContentKind[] = ["Movie", "Music", "Design", "Language", "Culture"];
  const available = new Set(items.filter((item) => item.mode === mode).map((item) => item.contentKind));
  return order.filter((kind) => available.has(kind));
}

export function summarizeActivityProgress(
  records: ReadonlyArray<Pick<ActivityProgress, "id" | "savedLanguage" | "completedAt">>,
): { started: number; completed: number; phrases: number } {
  return {
    started: records.length,
    completed: records.filter((record) => record.completedAt !== null).length,
    phrases: records.filter((record) => record.savedLanguage.trim().length > 0).length,
  };
}
