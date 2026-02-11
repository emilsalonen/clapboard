import fs from "fs";
import path from "path";
import type { Movie, DirectorProfile, DirectorSimilarity, SimilarityLabel } from "./types";

// ─── Lazy profile index ───────────────────────────────────────────────
let profileIndex: Map<string, DirectorProfile> | null = null;

function loadMovies(): Movie[] {
  const filePath = path.join(process.cwd(), "data", "movies.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Movie[];
}

function buildProfileIndex(movies: Movie[]): Map<string, DirectorProfile> {
  const raw = new Map<
    string,
    { genres: Set<string>; actors: Set<string>; regions: Set<string>; years: number[] }
  >();

  for (const m of movies) {
    const key = m.director.toLowerCase();
    let entry = raw.get(key);
    if (!entry) {
      entry = { genres: new Set(), actors: new Set(), regions: new Set(), years: [] };
      raw.set(key, entry);
    }
    for (const g of m.genres) entry.genres.add(g.toLowerCase());
    for (const a of m.actors) entry.actors.add(a);
    if (m.watchProviders) {
      for (const code of Object.keys(m.watchProviders)) entry.regions.add(code);
    }
    entry.years.push(m.year);
  }

  const index = new Map<string, DirectorProfile>();
  for (const [key, entry] of raw) {
    entry.years.sort((a, b) => a - b);
    const mid = Math.floor(entry.years.length / 2);
    const medianYear =
      entry.years.length % 2 === 1
        ? entry.years[mid]
        : Math.round((entry.years[mid - 1] + entry.years[mid]) / 2);

    // Retrieve original-cased name from first movie with this director
    const original = movies.find((m) => m.director.toLowerCase() === key)!.director;

    index.set(key, {
      name: original,
      genres: entry.genres,
      actors: entry.actors,
      regions: entry.regions,
      medianYear,
      movieCount: entry.years.length,
    });
  }
  return index;
}

function ensureIndex(): Map<string, DirectorProfile> {
  if (!profileIndex) {
    profileIndex = buildProfileIndex(loadMovies());
  }
  return profileIndex;
}

/** Exposed for testing — allows injecting a custom movie list. */
export function buildProfileIndexFromMovies(movies: Movie[]): Map<string, DirectorProfile> {
  return buildProfileIndex(movies);
}

export function getDirectorProfile(name: string): DirectorProfile | undefined {
  return ensureIndex().get(name.toLowerCase());
}

// ─── Similarity math ──────────────────────────────────────────────────

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const v of a) if (b.has(v)) shared++;
  return shared / (a.size + b.size - shared);
}

function sharedOverMax(a: Set<string>, b: Set<string>): number {
  const maxSize = Math.max(a.size, b.size);
  if (maxSize === 0) return 0;
  let shared = 0;
  for (const v of a) if (b.has(v)) shared++;
  return shared / maxSize;
}

function decadeProximity(yearA: number, yearB: number): number {
  return 1 - Math.min(Math.abs(yearA - yearB) / 30, 1);
}

interface Breakdown {
  genreScore: number;
  actorScore: number;
  regionScore: number;
  decadeScore: number;
  sharedGenres: string[];
  sharedActors: string[];
}

export function computeBreakdown(a: DirectorProfile, b: DirectorProfile): Breakdown {
  const sharedGenres: string[] = [];
  for (const g of a.genres) if (b.genres.has(g)) sharedGenres.push(g);

  const sharedActors: string[] = [];
  for (const actor of a.actors) if (b.actors.has(actor)) sharedActors.push(actor);

  return {
    genreScore: jaccard(a.genres, b.genres),
    actorScore: sharedOverMax(a.actors, b.actors),
    regionScore: jaccard(a.regions, b.regions),
    decadeScore: decadeProximity(a.medianYear, b.medianYear),
    sharedGenres,
    sharedActors,
  };
}

const WEIGHTS = { genre: 0.4, actor: 0.3, region: 0.2, decade: 0.1 };

function scoreFromBreakdown(bd: Breakdown): number {
  return (
    WEIGHTS.genre * bd.genreScore +
    WEIGHTS.actor * bd.actorScore +
    WEIGHTS.region * bd.regionScore +
    WEIGHTS.decade * bd.decadeScore
  );
}

function labelFromScore(score: number): SimilarityLabel {
  if (score >= 0.5) return "Hot";
  if (score >= 0.25) return "Warm";
  return "Cold";
}

// ─── Reason generation ────────────────────────────────────────────────

function generateReasons(bd: Breakdown): string[] {
  // Rank factors by their weighted contribution
  const factors: { key: string; weighted: number; text: () => string }[] = [
    {
      key: "genre",
      weighted: WEIGHTS.genre * bd.genreScore,
      text: () => {
        if (bd.sharedGenres.length === 0) return "";
        const names = bd.sharedGenres.map((g) => g.charAt(0).toUpperCase() + g.slice(1));
        return `Both direct ${names.join(", ")}`;
      },
    },
    {
      key: "actor",
      weighted: WEIGHTS.actor * bd.actorScore,
      text: () => {
        if (bd.sharedActors.length === 0) return "";
        if (bd.sharedActors.length <= 2) return `Share actor ${bd.sharedActors.join(" & ")}`;
        return `Share ${bd.sharedActors.length} actors`;
      },
    },
    {
      key: "region",
      weighted: WEIGHTS.region * bd.regionScore,
      text: () => {
        if (bd.regionScore < 0.1) return "";
        return "Available in similar regions";
      },
    },
    {
      key: "decade",
      weighted: WEIGHTS.decade * bd.decadeScore,
      text: () => {
        if (bd.decadeScore < 0.3) return "";
        return "Active in similar era";
      },
    },
  ];

  factors.sort((a, b) => b.weighted - a.weighted);

  const reasons: string[] = [];
  for (const f of factors) {
    if (reasons.length >= 2) break;
    if (f.weighted <= 0) continue;
    const t = f.text();
    if (t) reasons.push(t);
  }
  return reasons;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Returns null if same director (handled separately as green/exact match).
 */
export function computeDirectorSimilarity(
  dirA: string,
  dirB: string
): DirectorSimilarity | null {
  if (dirA.toLowerCase() === dirB.toLowerCase()) return null;

  const profileA = getDirectorProfile(dirA);
  const profileB = getDirectorProfile(dirB);
  if (!profileA || !profileB) return { score: 0, label: "Cold", reasons: [] };

  const bd = computeBreakdown(profileA, profileB);
  const score = Math.round(scoreFromBreakdown(bd) * 1000) / 1000; // 3 decimal precision
  const label = labelFromScore(score);
  const reasons = generateReasons(bd);

  return { score, label, reasons };
}
