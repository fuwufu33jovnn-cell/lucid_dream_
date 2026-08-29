export type ContentKind = "Movie" | "Music" | "Design" | "Language" | "Culture";
export type SourceKind = "youtube" | "external";

export type EditorialPrompts = {
  notice: string;
  words: string;
  shadow: string;
  talk: string;
};

export type LearningLine = { id: string; text: string };
