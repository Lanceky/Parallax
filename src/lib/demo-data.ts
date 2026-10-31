export type SelfKind = "then" | "now" | "future";
export type Provenance = "tap" | "export" | "screenshot" | "photo" | "anchor" | "inferred";

export interface DemoEntity {
  name: string;
  domain: string;
  signal: "love" | "curious" | "avoid";
  provenance: Provenance;
  confidence: number;
}

export interface DemoSelf {
  id: string;
  label: string;
  years: string;
  kind: SelfKind;
  description: string;
  voice: string;
  color: string;
  completeness: number;
  entities: DemoEntity[];
}

export interface EraGridCard {
  id: string;
  name: string;
  domain: string;
  type: string;
  year: number;
  description: string;
  tags: string[];
  imageUrl?: string;
  popularity: number;
  provenance: "qloo" | "demo";
}

export const demoSelves: DemoSelf[] = [
  {
    id: "campus",
    label: "Campus-me",
    years: "2016 - 2019",
    kind: "then",
    description: "Late-night playlists, loud rooms, and the first taste of independence.",
    voice: "restless / warm / spontaneous",
    color: "#ff876f",
    completeness: 82,
    entities: [
      { name: "Burna Boy", domain: "Music", signal: "love", provenance: "export", confidence: 0.96 },
      { name: "Inception", domain: "Film/TV", signal: "love", provenance: "tap", confidence: 0.9 },
      { name: "Jollof rice", domain: "Food", signal: "love", provenance: "inferred", confidence: 0.76 },
      { name: "Carhartt WIP", domain: "Fashion", signal: "curious", provenance: "inferred", confidence: 0.71 },
      { name: "Nintendo Switch", domain: "Games", signal: "love", provenance: "tap", confidence: 0.88 },
    ],
  },
  {
    id: "new-city",
    label: "New-city-me",
    years: "2020 - 2022",
    kind: "then",
    description: "A smaller circle, deeper rituals, and a taste for thoughtful escapes.",
    voice: "observant / precise / hopeful",
    color: "#62d9d4",
    completeness: 68,
    entities: [
      { name: "Tems", domain: "Music", signal: "love", provenance: "export", confidence: 0.94 },
      { name: "Atlanta", domain: "Film/TV", signal: "love", provenance: "tap", confidence: 0.9 },
      { name: "Ramen", domain: "Food", signal: "love", provenance: "photo", confidence: 0.64 },
      { name: "Salomon", domain: "Fashion", signal: "curious", provenance: "inferred", confidence: 0.7 },
      { name: "Lisbon", domain: "Places", signal: "love", provenance: "tap", confidence: 0.87 },
    ],
  },
  {
    id: "now",
    label: "Now-me",
    years: "Today",
    kind: "now",
    description: "The mediator: curious about what lasts, careful with money, open to surprise.",
    voice: "clear / grounded / curious",
    color: "#b7a3ff",
    completeness: 91,
    entities: [
      { name: "Little Simz", domain: "Music", signal: "love", provenance: "export", confidence: 0.98 },
      { name: "The Bear", domain: "Film/TV", signal: "love", provenance: "tap", confidence: 0.92 },
      { name: "Tacos", domain: "Food", signal: "love", provenance: "tap", confidence: 0.9 },
      { name: "A.P.C.", domain: "Fashion", signal: "curious", provenance: "inferred", confidence: 0.72 },
      { name: "Kyoto", domain: "Places", signal: "love", provenance: "tap", confidence: 0.86 },
    ],
  },
];

export const domainTabs = ["All", "Music", "Film/TV", "Food", "Fashion", "Places"] as const;

export const captureTiles = [
  { label: "Tap the Grid", detail: "Tune a year in 60 seconds", accent: "coral" },
  { label: "Drop an export", detail: "Spotify or WhatsApp history", accent: "cyan" },
  { label: "Drop screenshots", detail: "Wrapped, shelves, playlists", accent: "lilac" },
  { label: "Scan photos", detail: "Labels stay on your device", accent: "lime" },
  { label: "Tell a memory", detail: "Type or speak three prompts", accent: "coral" },
];

export const timelineYears = [
  { year: "2016", label: "First signal", selfId: "campus" },
  { year: "2019", label: "Campus peak", selfId: "campus" },
  { year: "2020", label: "Moved cities", selfId: "new-city" },
  { year: "2022", label: "New rituals", selfId: "new-city" },
  { year: "Now", label: "Mediator", selfId: "now" },
];

export const eraGridPools: Record<number, EraGridCard[]> = {
  2016: [
    { id: "demo-2016-burna-boy", name: "Burna Boy", domain: "Music", type: "artist", year: 2016, description: "Afrofusion with a restless pulse.", tags: ["Afrofusion", "Global"], popularity: 0.94, provenance: "demo" },
    { id: "demo-2016-inception", name: "Inception", domain: "Film/TV", type: "movie", year: 2016, description: "A high-concept world built for repeat viewing.", tags: ["Sci-fi", "Thriller"], popularity: 0.9, provenance: "demo" },
    { id: "demo-2016-jollof", name: "Jollof rice", domain: "Food", type: "place", year: 2016, description: "Comfort, heat, and a table that gets louder.", tags: ["Comfort", "Shared"], popularity: 0.86, provenance: "demo" },
    { id: "demo-2016-carhartt", name: "Carhartt WIP", domain: "Fashion", type: "brand", year: 2016, description: "Workwear codes with a sharper street edge.", tags: ["Streetwear", "Utility"], popularity: 0.82, provenance: "demo" },
    { id: "demo-2016-switch", name: "Nintendo Switch", domain: "Games", type: "video_game", year: 2016, description: "A social console for bedrooms and train rides.", tags: ["Play", "Social"], popularity: 0.84, provenance: "demo" },
    { id: "demo-2016-lagos", name: "Lagos", domain: "Places", type: "destination", year: 2016, description: "A city of movement, music, and late dinners.", tags: ["City", "Nightlife"], popularity: 0.8, provenance: "demo" },
    { id: "demo-2016-adele", name: "Adele", domain: "Music", type: "artist", year: 2016, description: "Big feelings with an unmistakable voice.", tags: ["Soul", "Pop"], popularity: 0.88, provenance: "demo" },
    { id: "demo-2016-moonlight", name: "Moonlight", domain: "Film/TV", type: "movie", year: 2016, description: "Quiet intensity and a tender coming-of-age lens.", tags: ["Drama", "A24"], popularity: 0.83, provenance: "demo" },
  ],
  2019: [
    { id: "demo-2019-tems", name: "Tems", domain: "Music", type: "artist", year: 2019, description: "Low-lit vocals and a patient groove.", tags: ["Alté", "R&B"], popularity: 0.91, provenance: "demo" },
    { id: "demo-2019-parasite", name: "Parasite", domain: "Film/TV", type: "movie", year: 2019, description: "A sharp social thriller that rewards attention.", tags: ["Thriller", "International"], popularity: 0.92, provenance: "demo" },
    { id: "demo-2019-ramen", name: "Ramen", domain: "Food", type: "place", year: 2019, description: "A focused bowl for rainy-night rituals.", tags: ["Warm", "Solo"], popularity: 0.85, provenance: "demo" },
    { id: "demo-2019-salomon", name: "Salomon", domain: "Fashion", type: "brand", year: 2019, description: "Trail utility reinterpreted for the city.", tags: ["Outdoor", "Technical"], popularity: 0.8, provenance: "demo" },
    { id: "demo-2019-lisbon", name: "Lisbon", domain: "Places", type: "destination", year: 2019, description: "A walkable city with a late, easy rhythm.", tags: ["Walkable", "Escape"], popularity: 0.87, provenance: "demo" },
    { id: "demo-2019-control", name: "Control", domain: "Games", type: "video_game", year: 2019, description: "Strange architecture and a cinematic sense of place.", tags: ["Surreal", "Action"], popularity: 0.78, provenance: "demo" },
    { id: "demo-2019-little-simz", name: "Little Simz", domain: "Music", type: "artist", year: 2019, description: "Precise bars with a world-building instinct.", tags: ["Rap", "Independent"], popularity: 0.87, provenance: "demo" },
    { id: "demo-2019-atlanta", name: "Atlanta", domain: "Film/TV", type: "tv_show", year: 2019, description: "Surreal comedy with a lived-in cultural texture.", tags: ["Comedy", "Cult"], popularity: 0.89, provenance: "demo" },
  ],
  2022: [
    { id: "demo-2022-little-simz", name: "Little Simz", domain: "Music", type: "artist", year: 2022, description: "A confident, expansive voice for a new chapter.", tags: ["Rap", "Artful"], popularity: 0.9, provenance: "demo" },
    { id: "demo-2022-the-bear", name: "The Bear", domain: "Film/TV", type: "tv_show", year: 2022, description: "Pressure, care, and craft in a very small kitchen.", tags: ["Drama", "Food"], popularity: 0.94, provenance: "demo" },
    { id: "demo-2022-tacos", name: "Tacos", domain: "Food", type: "place", year: 2022, description: "A low-friction favorite with endless local variation.", tags: ["Casual", "Social"], popularity: 0.89, provenance: "demo" },
    { id: "demo-2022-apc", name: "A.P.C.", domain: "Fashion", type: "brand", year: 2022, description: "Quiet staples that get better with repetition.", tags: ["Minimal", "Durable"], popularity: 0.79, provenance: "demo" },
    { id: "demo-2022-kyoto", name: "Kyoto", domain: "Places", type: "destination", year: 2022, description: "Texture, ritual, and an invitation to slow down.", tags: ["Culture", "Calm"], popularity: 0.88, provenance: "demo" },
    { id: "demo-2022-stray", name: "Stray", domain: "Games", type: "video_game", year: 2022, description: "A curious world seen from a different height.", tags: ["Exploration", "Atmosphere"], popularity: 0.77, provenance: "demo" },
    { id: "demo-2022-sza", name: "SZA", domain: "Music", type: "artist", year: 2022, description: "Messy honesty and an ear for emotional detail.", tags: ["R&B", "Confessional"], popularity: 0.93, provenance: "demo" },
    { id: "demo-2022-everything", name: "Everything Everywhere All at Once", domain: "Film/TV", type: "movie", year: 2022, description: "Tender maximalism for an overfull moment.", tags: ["Sci-fi", "Heart"], popularity: 0.95, provenance: "demo" },
  ],
};

export const eraGridYears = Object.keys(eraGridPools).map(Number).sort((a, b) => a - b);
