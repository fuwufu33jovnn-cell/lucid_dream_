export type StudySegment = {
  id: string;
  original: string;
  startMs?: number;
  endMs?: number;
};

function timecodeToMilliseconds(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const match = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})\.(\d{1,3})$/.exec(normalized);
  if (!match) return 0;
  const [, hours = "0", minutes, seconds, milliseconds] = match;
  return Number(hours) * 3_600_000 + Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(milliseconds.padEnd(3, "0"));
}

function segment(id: number, original: string, startMs?: number, endMs?: number): StudySegment | null {
  const cleaned = original.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return cleaned ? { id: `segment-${id}`, original: cleaned, ...(startMs === undefined ? {} : { startMs }), ...(endMs === undefined ? {} : { endMs }) } : null;
}

export function parseStudySegments(text: string, fileName = ""): StudySegment[] {
  const blocks = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
  const subtitle = /\.(?:srt|vtt)$/i.test(fileName) || /-->/.test(text);
  if (subtitle) {
    let segmentNumber = 0;
    return blocks.flatMap((block) => {
      const lines = block.split("\n").filter((line) => !/^WEBVTT(?:\s|$)/.test(line)).filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex < 0) return [];
      const [from = "", to = ""] = lines[timingIndex].split("-->").map((value) => value.trim().split(/\s+/)[0]);
      const item = segment(segmentNumber + 1, lines.slice(timingIndex + 1).join(" "), timecodeToMilliseconds(from), timecodeToMilliseconds(to));
      if (item) segmentNumber += 1;
      return item ? [item] : [];
    });
  }
  return blocks.flatMap((block, index) => {
    const item = segment(index + 1, block);
    return item ? [item] : [];
  });
}
