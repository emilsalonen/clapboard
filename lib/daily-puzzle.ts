import moviesData from "@/data/movies.json";
import type { Movie } from "./types";

const movies = moviesData as Movie[];

export const ROUNDS_PER_DAY = 5;

/**
 * Simple hash function for deterministic daily movie selection.
 * Uses the date string as seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Get the puzzle number (days since launch).
 */
export function getPuzzleNumber(dateStr: string): number {
  const launch = new Date("2026-02-11");
  const current = new Date(dateStr);
  const diffTime = current.getTime() - launch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Get today's movie deterministically based on the date and round.
 * Ensures all rounds within a day pick distinct movies.
 */
export function getDailyMovie(dateStr: string, round: number = 0): Movie {
  const usedIndices = new Set<number>();

  // Compute indices for all prior rounds to avoid collisions
  for (let r = 0; r < round; r++) {
    let idx = hashString(`${dateStr}-${r}`) % movies.length;
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % movies.length;
    }
    usedIndices.add(idx);
  }

  // Compute index for the requested round
  let index = hashString(`${dateStr}-${round}`) % movies.length;
  while (usedIndices.has(index)) {
    index = (index + 1) % movies.length;
  }

  return movies[index];
}

/**
 * Find a movie by title (case-insensitive, fuzzy matching).
 */
export function findMovieByTitle(title: string): Movie | null {
  const normalized = normalizeTitle(title);

  // Exact match first
  const exact = movies.find(
    (m) => normalizeTitle(m.title) === normalized
  );
  if (exact) return exact;

  // Fuzzy match: ignore "the", "a", "an" at start
  const fuzzyNorm = stripArticles(normalized);
  const fuzzy = movies.find(
    (m) => stripArticles(normalizeTitle(m.title)) === fuzzyNorm
  );
  if (fuzzy) return fuzzy;

  // Substring match
  const substring = movies.find(
    (m) => normalizeTitle(m.title).includes(normalized) || normalized.includes(normalizeTitle(m.title))
  );
  if (substring) return substring;

  return null;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripArticles(title: string): string {
  return title.replace(/^(the|a|an)\s+/, "").trim();
}

/**
 * Get all movie titles for client-side matching display.
 */
export function getAllMovieTitles(): string[] {
  return movies.map((m) => m.title);
}
