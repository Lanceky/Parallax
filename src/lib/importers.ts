export type ImportSource = "spotify" | "whatsapp" | "telegram" | "netflix" | "youtube" | "instagram" | "unknown";

export interface ImportedActivity {
  timestamp: string;
  year: number;
  surface: string;
  typeHint: "artist" | "track" | "message" | "movie" | "video" | "place" | "unknown";
  source: ImportSource;
  author?: string;
  mentions?: number;
}

export interface ImportSummary {
  source: ImportSource;
  activities: ImportedActivity[];
  authors: string[];
  years: Record<string, number>;
  entities: Array<{
    surface: string;
    typeHint: ImportedActivity["typeHint"];
    mentions: number;
    years: number[];
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toYear(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getUTCFullYear();
  }
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function cleanSurface(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function detectImportSource(fileName: string, preview = ""): ImportSource {
  const name = fileName.toLowerCase();
  const normalizedPreview = preview.toLowerCase();

  if (name.includes("spotify") || normalizedPreview.includes("ms_played") || normalizedPreview.includes("master_metadata_track_name")) {
    return "spotify";
  }
  if (name.endsWith(".txt") || /^\[?\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/m.test(preview)) {
    return "whatsapp";
  }
  if (name.includes("telegram") || normalizedPreview.includes('"messages"')) {
    return "telegram";
  }
  if (name.includes("netflix") || normalizedPreview.includes("viewingactivity")) {
    return "netflix";
  }
  if (name.includes("youtube") || normalizedPreview.includes("subtitles")) {
    return "youtube";
  }
  if (name.includes("instagram")) {
    return "instagram";
  }
  return "unknown";
}

function spotifyTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
}

export function parseSpotifyHistory(input: unknown): ImportedActivity[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Spotify history must be a JSON array.");
  }

  return input.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const timestamp = spotifyTimestamp(item.ts ?? item.endTime);
    const surface =
      typeof item.master_metadata_track_name === "string"
        ? item.master_metadata_track_name
        : typeof item.trackName === "string"
          ? item.trackName
          : undefined;
    const artist =
      typeof item.master_metadata_album_artist_name === "string"
        ? item.master_metadata_album_artist_name
        : typeof item.artistName === "string"
          ? item.artistName
          : undefined;
    const playedMs =
      typeof item.ms_played === "number"
        ? item.ms_played
        : typeof item.msPlayed === "number"
          ? item.msPlayed
          : 0;
    const year = toYear(timestamp);

    if (!timestamp || !surface || !artist || !year || playedMs < 30000) {
      return [];
    }

    return [
      {
        timestamp,
        year,
        surface: cleanSurface(artist),
        typeHint: "artist" as const,
        source: "spotify" as const,
        mentions: Math.max(1, Math.round(playedMs / 180000)),
      },
      {
        timestamp,
        year,
        surface: cleanSurface(surface),
        typeHint: "track" as const,
        source: "spotify" as const,
        mentions: 1,
      },
    ];
  });
}

interface WhatsAppMatch {
  timestamp: string;
  author: string;
  message: string;
}

function parseWhatsAppLine(line: string): WhatsAppMatch | null {
  const match = line.match(
    /^\[?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:[-–]\s*)?([^:]+):\s*(.*)$/,
  );
  if (!match) {
    return null;
  }

  const [date, time, author, message] = match.slice(1);
  const [first, second, rawYear] = date.split(/[/-]/).map(Number);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return {
    timestamp: `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}T${time}`,
    author: cleanSurface(author),
    message: cleanSurface(message),
  };
}

export function parseWhatsAppExport(text: string, authorFilter?: string): ImportedActivity[] {
  if (!text.trim()) {
    throw new TypeError("WhatsApp export is empty.");
  }

  let current: WhatsAppMatch | null = null;
  const activities: ImportedActivity[] = [];

  for (const line of text.split(/\r?\n/)) {
    const parsed = parseWhatsAppLine(line);
    if (parsed) {
      current = parsed;
    } else if (current && line.trim()) {
      current.message = cleanSurface(`${current.message} ${line}`);
    }

    if (parsed && (!authorFilter || parsed.author === authorFilter) && !parsed.message.startsWith("<Media omitted>")) {
      activities.push({
        timestamp: parsed.timestamp,
        year: Number(parsed.timestamp.slice(0, 4)),
        surface: parsed.message,
        typeHint: "message",
        source: "whatsapp",
        author: parsed.author,
        mentions: 1,
      });
    }
  }

  return activities;
}

export function summarizeActivities(source: ImportSource, activities: ImportedActivity[]): ImportSummary {
  const years: Record<string, number> = {};
  const authors = new Set<string>();
  const entityMap = new Map<string, { typeHint: ImportedActivity["typeHint"]; mentions: number; years: Set<number> }>();

  for (const activity of activities) {
    years[activity.year] = (years[activity.year] ?? 0) + (activity.mentions ?? 1);
    if (activity.author) {
      authors.add(activity.author);
    }
    const key = `${activity.typeHint}:${activity.surface.toLowerCase()}`;
    const existing = entityMap.get(key) ?? { typeHint: activity.typeHint, mentions: 0, years: new Set<number>() };
    existing.mentions += activity.mentions ?? 1;
    existing.years.add(activity.year);
    entityMap.set(key, existing);
  }

  return {
    source,
    activities,
    authors: Array.from(authors).sort(),
    years,
    entities: Array.from(entityMap.entries())
      .map(([key, value]) => ({
        surface: key.slice(key.indexOf(":") + 1),
        typeHint: value.typeHint,
        mentions: value.mentions,
        years: Array.from(value.years).sort(),
      }))
      .sort((a, b) => b.mentions - a.mentions),
  };
}

export async function parseImportFile(file: File, authorFilter?: string): Promise<ImportSummary> {
  const preview = await file.slice(0, 100000).text();
  const source = detectImportSource(file.name, preview);

  if (source === "spotify") {
    return summarizeActivities(source, parseSpotifyHistory(JSON.parse(await file.text())));
  }
  if (source === "whatsapp") {
    return summarizeActivities(source, parseWhatsAppExport(await file.text(), authorFilter));
  }

  throw new TypeError("This capture hub currently supports Spotify JSON and WhatsApp TXT exports.");
}
