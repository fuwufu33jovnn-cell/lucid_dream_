export type EnglishVoiceLike = {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
};

const NOVELTY_VOICE_PATTERN = /fred|zarvox|whisper|trinoids|boing|bells|cellos|bad news|good news|bubbles|jester|organ|superstar|wobble|bahh|albert/i;
const PREMIUM_VOICE_PATTERN = /natural|premium|enhanced|samantha|daniel|ava|serena|oliver|arthur|google .*english|microsoft .*english/i;

export function pickNaturalEnglishVoice<T extends EnglishVoiceLike>(voices: readonly T[]): T | null {
  const english = voices.filter((voice) => /^en(?:-|_)/i.test(voice.lang) && !NOVELTY_VOICE_PATTERN.test(voice.name));
  if (english.length === 0) return null;

  return [...english].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

function scoreVoice(voice: EnglishVoiceLike): number {
  let score = 0;
  if (PREMIUM_VOICE_PATTERN.test(voice.name)) score += 100;
  if (/samantha|daniel/i.test(voice.name)) score += 30;
  if (/natural|premium|enhanced/i.test(voice.name)) score += 25;
  if (/^en-US$/i.test(voice.lang) || /^en-GB$/i.test(voice.lang)) score += 12;
  if (voice.localService) score += 8;
  if (voice.default) score += 1;
  return score;
}
