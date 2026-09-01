export type EnglishVoiceLike = {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
};

export type VoiceGender = "auto" | "female" | "male";
export type SpeechLanguage = "en-US" | "zh-CN" | "ja-JP" | "ko-KR";

const NOVELTY_VOICE_PATTERN = /fred|zarvox|whisper|trinoids|boing|bells|cellos|bad news|good news|bubbles|jester|organ|superstar|wobble|bahh|albert/i;
const PREMIUM_VOICE_PATTERN = /natural|premium|enhanced|samantha|daniel|ava|serena|oliver|arthur|google|microsoft/i;
const FEMALE_VOICE_PATTERN = /samantha|ava|serena|victoria|karen|tessa|zira|aria|susan|hazel|sunhi|yuna|sora|kyoko|mei-jia|tingting|female/i;
const MALE_VOICE_PATTERN = /daniel|oliver|arthur|alex|tom|david|mark|george|injoon|ichiro|male/i;

const languagePrefix: Record<SpeechLanguage, string> = {
  "en-US": "en",
  "zh-CN": "zh",
  "ja-JP": "ja",
  "ko-KR": "ko",
};

export function detectSpeechLanguage(text: string): SpeechLanguage {
  if (/[\uac00-\ud7af]/u.test(text)) return "ko-KR";
  if (/[\u3040-\u30ff]/u.test(text)) return "ja-JP";
  if (/[\u3400-\u9fff]/u.test(text)) return "zh-CN";
  return "en-US";
}

export function pickNaturalVoice<T extends EnglishVoiceLike>(voices: readonly T[], language: SpeechLanguage, gender: VoiceGender = "auto"): T | null {
  const prefix = languagePrefix[language];
  const candidates = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix) && !NOVELTY_VOICE_PATTERN.test(voice.name));
  if (candidates.length === 0) return null;

  const preferred = gender === "auto" ? candidates : candidates.filter((voice) => gender === "female" ? FEMALE_VOICE_PATTERN.test(voice.name) : MALE_VOICE_PATTERN.test(voice.name));
  const pool = preferred.length > 0 ? preferred : candidates;
  return [...pool].sort((a, b) => scoreVoice(b, language, gender) - scoreVoice(a, language, gender))[0] ?? null;
}

export function pickNaturalEnglishVoice<T extends EnglishVoiceLike>(voices: readonly T[]): T | null {
  return pickNaturalVoice(voices, "en-US", "auto");
}

function scoreVoice(voice: EnglishVoiceLike, language: SpeechLanguage, gender: VoiceGender): number {
  let score = 0;
  if (PREMIUM_VOICE_PATTERN.test(voice.name)) score += 100;
  if (/samantha|daniel/i.test(voice.name)) score += 30;
  if (/natural|premium|enhanced/i.test(voice.name)) score += 25;
  if (voice.lang.toLowerCase() === language.toLowerCase()) score += 16;
  if (gender === "female" && FEMALE_VOICE_PATTERN.test(voice.name)) score += 40;
  if (gender === "male" && MALE_VOICE_PATTERN.test(voice.name)) score += 40;
  if (voice.localService) score += 8;
  if (voice.default) score += 1;
  return score;
}
