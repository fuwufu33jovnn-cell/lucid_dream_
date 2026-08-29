import type { StoredRecord } from "./models";

export type PersonalMediaProvider = "youtube" | "spotify";
export type PersonalMediaKind = "video" | "playlist" | "track" | "album" | "artist" | "show" | "episode";

export type ParsedPersonalMedia = {
  provider: PersonalMediaProvider;
  kind: PersonalMediaKind;
  resourceId: string;
  sourceUrl: string;
  embedUrl: string;
};

export type PersonalMediaRecord = StoredRecord & ParsedPersonalMedia & {
  title: string;
  createdAt: number;
};

const DAY_MS = 86_400_000;

export function recentPersonalMedia<T extends Pick<PersonalMediaRecord, "createdAt">>(
  items: readonly T[],
  now = Date.now(),
  days = 7,
): T[] {
  const oldest = now - Math.max(1, days) * DAY_MS;
  return items
    .filter((item) => item.createdAt >= oldest && item.createdAt <= now)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function expiredPersonalMediaIds<T extends Pick<PersonalMediaRecord, "id" | "createdAt">>(
  items: readonly T[],
  now = Date.now(),
  days = 7,
): string[] {
  const oldest = now - Math.max(1, days) * DAY_MS;
  return items.filter((item) => item.createdAt < oldest || item.createdAt > now).map((item) => item.id);
}

const RESOURCE_ID = /^[A-Za-z0-9_-]{3,128}$/;
const SPOTIFY_KINDS = new Set<PersonalMediaKind>(["track", "album", "playlist", "artist", "show", "episode"]);

export function parsePersonalMediaUrl(value: string): ParsedPersonalMedia | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
    const playlistId = url.searchParams.get("list");
    const videoId = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null;
    if (videoId && RESOURCE_ID.test(videoId)) {
      return {
        provider: "youtube",
        kind: "video",
        resourceId: videoId,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    }
    if (playlistId && RESOURCE_ID.test(playlistId)) {
      return {
        provider: "youtube",
        kind: "playlist",
        resourceId: playlistId,
        sourceUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`,
      };
    }
    return null;
  }

  if (url.hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    if (!videoId || !RESOURCE_ID.test(videoId)) return null;
    return {
      provider: "youtube",
      kind: "video",
      resourceId: videoId,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  }

  if (url.hostname === "open.spotify.com") {
    const [kindValue, resourceId] = url.pathname.split("/").filter(Boolean);
    const kind = kindValue as PersonalMediaKind;
    if (!SPOTIFY_KINDS.has(kind) || !resourceId || !RESOURCE_ID.test(resourceId)) return null;
    return {
      provider: "spotify",
      kind,
      resourceId,
      sourceUrl: `https://open.spotify.com/${kind}/${resourceId}`,
      embedUrl: `https://open.spotify.com/embed/${kind}/${resourceId}`,
    };
  }

  return null;
}
