import type { SeedLevel } from "./seeds.ts";
import type { ContentKind, EditorialPrompts, LearningLine, SourceKind } from "./editorial-types.ts";
import type { LabMode } from "./editorial.ts";

export type CulturalActivity = {
  id: string;
  mode: LabMode;
  contentKind: Extract<ContentKind, "Movie" | "Music">;
  format: string;
  title: string;
  publisher: string;
  level: SeedLevel;
  minutes: 5 | 15 | 30;
  sourceUrl: string;
  sourceKind: SourceKind;
  youtubeId?: string;
  editorialNote: string;
  learningText: LearningLine[];
  prompts: EditorialPrompts;
  usageBasis: string;
  marginaliaLabel: "Fictional editorial marginalia";
  marginalia: string[];
};

type CulturalSeed = Pick<CulturalActivity, "id" | "contentKind" | "title" | "publisher" | "sourceUrl" | "youtubeId" | "level"> & {
  angle: string;
};

const MUSIC: CulturalSeed[] = [
  { id: "billie-birds", contentKind: "Music", title: "Birds of a Feather — visual intimacy", publisher: "Billie Eilish", sourceUrl: "https://www.youtube.com/watch?v=V9PVRfjEBTI", youtubeId: "V9PVRfjEBTI", level: "B1", angle: "how movement and framing turn closeness into a visual idea" },
  { id: "jbrekkie-be-sweet", contentKind: "Music", title: "Be Sweet — retro pop as character", publisher: "Japanese Breakfast", sourceUrl: "https://www.youtube.com/watch?v=2ZfcZEIo6Bw", youtubeId: "2ZfcZEIo6Bw", level: "B2", angle: "how costume, colour, and deadpan performance create a playful persona" },
  { id: "mitski-my-love", contentKind: "Music", title: "My Love Mine All Mine — one room, one mood", publisher: "Mitski", sourceUrl: "https://www.youtube.com/watch?v=CwGbMYLjIpQ", youtubeId: "CwGbMYLjIpQ", level: "B1", angle: "how a restrained set can support an emotionally direct song" },
  { id: "lorde-solar-power", contentKind: "Music", title: "Solar Power — the unreliable postcard", publisher: "Lorde", sourceUrl: "https://www.youtube.com/watch?v=wvsP_lzh2-8", youtubeId: "wvsP_lzh2-8", level: "B2", angle: "how an idyllic image can feel slightly strange at the same time" },
  { id: "fka-cellophane", contentKind: "Music", title: "Cellophane — performance and vulnerability", publisher: "FKA twigs", sourceUrl: "https://www.youtube.com/watch?v=YkLjqFpBh84", youtubeId: "YkLjqFpBh84", level: "C1", angle: "how choreography carries meaning without explanatory dialogue" },
  { id: "charli-360", contentKind: "Music", title: "360 — fame as an inside joke", publisher: "Charli xcx", sourceUrl: "https://www.youtube.com/watch?v=WJW-VvmRKsE", youtubeId: "WJW-VvmRKsE", level: "B2", angle: "how casting and references build a self-aware pop world" },
  { id: "aespa-supernova", contentKind: "Music", title: "Supernova — hyperreal styling", publisher: "SMTOWN / aespa", sourceUrl: "https://www.youtube.com/watch?v=phuiiNCxRMg", youtubeId: "phuiiNCxRMg", level: "B2", angle: "how surreal effects and sharp styling create controlled visual chaos" },
  { id: "newjeans-ditto", contentKind: "Music", title: "Ditto — memory through a camera", publisher: "HYBE LABELS / NewJeans", sourceUrl: "https://www.youtube.com/watch?v=pSUydWEqKwE", youtubeId: "pSUydWEqKwE", level: "B2", angle: "how point of view changes what a friendship story seems to mean" },
  { id: "hikaru-one-last-kiss", contentKind: "Music", title: "One Last Kiss — editing a goodbye", publisher: "Hikaru Utada", sourceUrl: "https://www.youtube.com/watch?v=0Uhh62MUEic", youtubeId: "0Uhh62MUEic", level: "B2", angle: "how ordinary handheld images can make a large emotion feel personal" },
  { id: "phoebe-motion-sickness", contentKind: "Music", title: "Motion Sickness — sad words, light movement", publisher: "Phoebe Bridgers", sourceUrl: "https://www.youtube.com/watch?v=9sfYpolGCu8", youtubeId: "9sfYpolGCu8", level: "B2", angle: "how tonal contrast keeps a difficult subject from becoming visually flat" },
  { id: "chappell-pink-pony", contentKind: "Music", title: "Pink Pony Club — building a stage identity", publisher: "Chappell Roan", sourceUrl: "https://www.youtube.com/watch?v=GR3Liudev18", youtubeId: "GR3Liudev18", level: "B2", angle: "how performance, community, and costume define a place of belonging" },
  { id: "yorushika-video", contentKind: "Music", title: "Yorushika — image, weather, and distance", publisher: "Yorushika Official", sourceUrl: "https://www.youtube.com/@nbuna/videos", level: "B2", angle: "how recurring natural images give a music catalogue a recognisable atmosphere" },
  { id: "kiikiii-visual", contentKind: "Music", title: "KiiiKiii — playful image systems", publisher: "KiiiKiii Official", sourceUrl: "https://www.youtube.com/results?search_query=KiiiKiii+official+music+video", level: "B1", angle: "how styling and graphic motifs make a new group immediately identifiable" },
  { id: "illit-visual", contentKind: "Music", title: "ILLIT — hair, gesture, and concept", publisher: "HYBE LABELS / ILLIT", sourceUrl: "https://www.youtube.com/results?search_query=ILLIT+official+music+video", level: "B1", angle: "how one styling choice can carry more concept than an overloaded set" },
  { id: "akg-official", contentKind: "Music", title: "Asian Kung-Fu Generation — graphic continuity", publisher: "AKG Official", sourceUrl: "https://www.youtube.com/results?search_query=Asian+Kung-Fu+Generation+official+music+video", level: "B2", angle: "how cover art, typography, and video tone can stay coherent across years" },
];

const MOVIES: CulturalSeed[] = [
  { id: "millennium-actress", contentKind: "Movie", title: "Millennium Actress — running through memory", publisher: "GKIDS / Shout! Studios", sourceUrl: "https://www.youtube.com/watch?v=AiaR25JXGlA", youtubeId: "AiaR25JXGlA", level: "B2", angle: "how transitions collapse cinema, history, and personal memory into one journey" },
  { id: "perfect-days", contentKind: "Movie", title: "Perfect Days — noticing repetition", publisher: "NEON", sourceUrl: "https://www.youtube.com/results?search_query=Perfect+Days+official+trailer+NEON", level: "B1", angle: "how repeated routines reveal changes that dialogue never announces" },
  { id: "monster-koreeda", contentKind: "Movie", title: "Monster — one event, several truths", publisher: "Well Go USA", sourceUrl: "https://www.youtube.com/results?search_query=Monster+2023+official+trailer+Koreeda", level: "B2", angle: "how perspective changes the emotional meaning of the same incident" },
  { id: "tokyo-godfathers", contentKind: "Movie", title: "Tokyo Godfathers — found family in motion", publisher: "GKIDS Films", sourceUrl: "https://www.youtube.com/results?search_query=Tokyo+Godfathers+official+trailer+GKIDS", level: "B2", angle: "how comedy and coincidence keep a winter story humane rather than sentimental" },
  { id: "paprika", contentKind: "Movie", title: "Paprika — match cuts between worlds", publisher: "Sony Pictures", sourceUrl: "https://www.youtube.com/results?search_query=Paprika+official+trailer+Sony", level: "C1", angle: "how editing makes a dream feel continuous even when space keeps changing" },
  { id: "kamikaze-girls", contentKind: "Movie", title: "Kamikaze Girls — style as worldview", publisher: "Third Window Films", sourceUrl: "https://www.youtube.com/results?search_query=Kamikaze+Girls+official+trailer", level: "B2", angle: "how two opposing fashion languages become a fast character introduction" },
  { id: "swing-girls", contentKind: "Movie", title: "Swing Girls — the rhythm of a group", publisher: "Toho", sourceUrl: "https://www.youtube.com/results?search_query=Swing+Girls+official+trailer", level: "B1", angle: "how rehearsal scenes show confidence growing through small visible changes" },
  { id: "past-lives", contentKind: "Movie", title: "Past Lives — saying less", publisher: "A24", sourceUrl: "https://www.youtube.com/watch?v=kA244xewjcI", youtubeId: "kA244xewjcI", level: "B2", angle: "how pauses, framing, and unfinished sentences carry emotional tension" },
  { id: "everything-everywhere", contentKind: "Movie", title: "Everything Everywhere — maximalism with a centre", publisher: "A24", sourceUrl: "https://www.youtube.com/watch?v=wxN1T1uxQ2g", youtubeId: "wxN1T1uxQ2g", level: "B2", angle: "how repeated visual motifs keep a huge premise emotionally readable" },
  { id: "green-book", contentKind: "Movie", title: "Green Book — status in conversation", publisher: "Universal Pictures", sourceUrl: "https://www.youtube.com/watch?v=QkZxoko_HC0", youtubeId: "QkZxoko_HC0", level: "B2", angle: "how politeness, interruption, and word choice reveal shifting power" },
  { id: "bohemian-rhapsody", contentKind: "Movie", title: "Bohemian Rhapsody — staging a public myth", publisher: "20th Century Studios", sourceUrl: "https://www.youtube.com/watch?v=mP0VHJYFOAU", youtubeId: "mP0VHJYFOAU", level: "B2", angle: "how a trailer turns collaboration and performance into a clear rise-and-conflict arc" },
  { id: "boy-and-heron", contentKind: "Movie", title: "The Boy and the Heron — invitation without explanation", publisher: "GKIDS Films", sourceUrl: "https://www.youtube.com/watch?v=t5khm-VjEu4", youtubeId: "t5khm-VjEu4", level: "B2", angle: "how a trailer creates curiosity without explaining every rule of its world" },
  { id: "little-women", contentKind: "Movie", title: "Little Women — voices in an ensemble", publisher: "Sony Pictures", sourceUrl: "https://www.youtube.com/watch?v=AST2-4db4ic", youtubeId: "AST2-4db4ic", level: "B2", angle: "how pace and overlapping ambitions distinguish several characters quickly" },
  { id: "worst-person", contentKind: "Movie", title: "The Worst Person in the World — chaptered uncertainty", publisher: "NEON", sourceUrl: "https://www.youtube.com/watch?v=w_cV1q02cyE", youtubeId: "w_cV1q02cyE", level: "C1", angle: "how chapter titles and tonal shifts make indecision feel like a structure" },
  { id: "decision-to-leave", contentKind: "Movie", title: "Decision to Leave — looking as action", publisher: "MUBI", sourceUrl: "https://www.youtube.com/watch?v=9aMHyTqvIvU", youtubeId: "9aMHyTqvIvU", level: "C1", angle: "how screens, reflections, and eyelines turn observation into suspense" },
];

const RIGHTS = "Official or distributor-hosted media link; LUCID DREAM stores metadata and original learning notes only.";

function build(seed: CulturalSeed, index: number): CulturalActivity {
  const isMusic = seed.contentKind === "Music";
  return {
    ...seed,
    mode: isMusic ? (index % 3 === 0 ? "Watch" : "Listen") : (index % 4 === 0 ? "Culture" : "Watch"),
    format: isMusic ? "Official video / visual study" : "Official trailer / film study",
    minutes: index % 5 === 0 ? 30 : index % 2 === 0 ? 15 : 5,
    sourceKind: seed.youtubeId ? "youtube" : "external",
    editorialNote: isMusic ? "Listen once for feeling; watch again for the visual system." : "Watch the trailer as a compact lesson in framing and tone.",
    learningText: [
      { id: `${seed.id}-a`, text: `This entry focuses on ${seed.angle}.` },
      { id: `${seed.id}-b`, text: `Describe one precise choice, then explain what that choice makes the audience expect or feel.` },
    ],
    prompts: {
      notice: "Name three visual or sonic choices before deciding what they mean.",
      words: "Save one useful phrase for describing tone, pacing, framing, or performance.",
      shadow: "Repeat one short line from the official source, then note its stress and rhythm without copying a transcript.",
      talk: `Give a one-minute response about ${seed.angle}.`,
    },
    usageBasis: RIGHTS,
    marginaliaLabel: "Fictional editorial marginalia",
    marginalia: ["the second viewing changed the first", "one precise detail was enough", "culture first; homework second"],
  };
}

export const CULTURAL_ACTIVITIES: CulturalActivity[] = [...MUSIC, ...MOVIES].map(build);
