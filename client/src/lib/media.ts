export function getSpotifyTrackId(input?: string): string | null {
  if (!input) return null;
  const id = input.match(/track\/([a-zA-Z0-9]+)/)?.[1]
    || input.match(/spotify:track:([a-zA-Z0-9]+)/)?.[1]
    || input.match(/open\.spotify\.com\/.+\?si=[^&]+&?/)?.[1];
  return id || null;
}

export function getYouTubeId(input?: string): string | null {
  if (!input) return null;
  const m = input.match(/(?:v=|\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
  return m?.[1] || null;
}

export function sanitizeUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return null;
  }
}

