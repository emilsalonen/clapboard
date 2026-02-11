/**
 * TMDB Movie Data Fetch Script
 *
 * Usage: npx tsx scripts/fetch-movies.ts
 *
 * Requires TMDB_API_KEY in .env.local
 * Fetches top-rated + popular movies and saves to data/movies.json
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY!;
const MIN_VOTE_COUNT = 1000;

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  overview: string;
  poster_path: string | null;
  popularity: number;
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  overview: string;
  poster_path: string | null;
  tagline: string;
}

interface TMDBCredits {
  cast: { name: string; order: number }[];
  crew: { name: string; job: string }[];
}

interface TMDBWatchProviders {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: { provider_name: string; logo_path: string }[];
    }
  >;
}

interface MovieData {
  id: number;
  title: string;
  year: number;
  director: string;
  genres: string[];
  actors: string[];
  tagline: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  voteCount: number;
  oscarWins: number;
  watchProviders: Record<string, { link?: string; providers: { name: string; logoPath: string }[] }>;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMovieList(
  endpoint: string,
  label: string,
  pages: number
): Promise<TMDBMovie[]> {
  const allMovies: TMDBMovie[] = [];

  for (let page = 1; page <= pages; page++) {
    console.log(`Fetching ${label} page ${page}/${pages}...`);
    const data = await fetchJSON<{ results: TMDBMovie[] }>(
      `${TMDB_BASE}/movie/${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    allMovies.push(...data.results);
    await sleep(250);
  }

  return allMovies;
}

async function fetchDiscoverMovies(
  pages: number
): Promise<TMDBMovie[]> {
  const allMovies: TMDBMovie[] = [];

  for (let page = 1; page <= pages; page++) {
    console.log(`Fetching discover page ${page}/${pages}...`);
    const data = await fetchJSON<{ results: TMDBMovie[] }>(
      `${TMDB_BASE}/discover/movie?api_key=${API_KEY}&sort_by=vote_count.desc&vote_count.gte=${MIN_VOTE_COUNT}&language=en-US&page=${page}`
    );
    allMovies.push(...data.results);
    await sleep(250);
  }

  return allMovies;
}

async function fetchMovieDetails(movieId: number): Promise<MovieData | null> {
  try {
    const [details, credits, watchProviders] = await Promise.all([
      fetchJSON<TMDBMovieDetails>(
        `${TMDB_BASE}/movie/${movieId}?api_key=${API_KEY}&language=en-US`
      ),
      fetchJSON<TMDBCredits>(
        `${TMDB_BASE}/movie/${movieId}/credits?api_key=${API_KEY}`
      ),
      fetchJSON<TMDBWatchProviders>(
        `${TMDB_BASE}/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      ),
    ]);

    const director =
      credits.crew.find((c) => c.job === "Director")?.name || "Unknown";
    const actors = credits.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map((c) => c.name);

    const providers: Record<string, { link?: string; providers: { name: string; logoPath: string }[] }> = {};
    for (const [country, data] of Object.entries(watchProviders.results)) {
      if (data.flatrate && data.flatrate.length > 0) {
        providers[country] = {
          link: data.link,
          providers: data.flatrate.map((p) => ({
            name: p.provider_name,
            logoPath: p.logo_path,
          })),
        };
      }
    }

    return {
      id: details.id,
      title: details.title,
      year: new Date(details.release_date).getFullYear(),
      director,
      genres: details.genres.map((g) => g.name),
      actors,
      tagline: details.tagline || "",
      overview: details.overview,
      posterPath: details.poster_path || "",
      voteAverage: Math.round(details.vote_average * 10) / 10,
      voteCount: details.vote_count,
      oscarWins: 0,
      watchProviders: providers,
    };
  } catch (error) {
    console.error(`Failed to fetch details for movie ${movieId}:`, error);
    return null;
  }
}

async function main() {
  if (!API_KEY || API_KEY === "your_tmdb_api_key_here") {
    console.error("Error: Set TMDB_API_KEY in .env.local before running this script.");
    console.error("Get a free API key at https://www.themoviedb.org/settings/api");
    process.exit(1);
  }

  // Fetch from multiple sources and merge
  console.log("=== Fetching top-rated movies ===\n");
  const topRated = await fetchMovieList("top_rated", "top-rated", 30);

  console.log("\n=== Fetching popular movies ===\n");
  const popular = await fetchMovieList("popular", "popular", 30);

  console.log("\n=== Fetching now-playing movies ===\n");
  const nowPlaying = await fetchMovieList("now_playing", "now-playing", 5);

  console.log("\n=== Fetching discover movies (by vote count) ===\n");
  const discover = await fetchDiscoverMovies(50);

  // Deduplicate by ID, prioritizing top-rated first, then popular
  const seenIds = new Set<number>();
  const allMovies: TMDBMovie[] = [];

  for (const movie of [...topRated, ...popular, ...nowPlaying, ...discover]) {
    if (!seenIds.has(movie.id)) {
      seenIds.add(movie.id);
      allMovies.push(movie);
    }
  }

  // Filter out obscure movies with too few votes
  const beforeFilterCount = allMovies.length;
  const filteredMovies = allMovies.filter((m) => m.vote_count >= MIN_VOTE_COUNT);
  const filteredOutCount = beforeFilterCount - filteredMovies.length;

  const movieIds = filteredMovies.map((m) => m.id);

  console.log(`\nCombined ${beforeFilterCount} unique movies (from ${topRated.length} top-rated + ${popular.length} popular + ${nowPlaying.length} now-playing + ${discover.length} discover).`);
  console.log(`Filtered out ${filteredOutCount} movies with fewer than ${MIN_VOTE_COUNT} votes.`);
  console.log(`Proceeding with ${movieIds.length} movies.`);
  console.log("Now fetching details...\n");

  const movies: MovieData[] = [];
  const batchSize = 5;

  for (let i = 0; i < movieIds.length; i += batchSize) {
    const batch = movieIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((id) => fetchMovieDetails(id))
    );

    for (const movie of results) {
      if (movie) {
        movies.push(movie);
      }
    }

    console.log(`Progress: ${movies.length}/${movieIds.length} movies fetched`);
    await sleep(300);
  }

  const outputPath = path.resolve(__dirname, "../data/movies.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(movies, null, 2));

  console.log(`\nDone! Saved ${movies.length} movies to data/movies.json`);

  // Print some stats
  const ratings = movies.map((m) => m.voteAverage);
  const years = movies.map((m) => m.year);
  const votes = movies.map((m) => m.voteCount);
  console.log(`Rating range: ${Math.min(...ratings)} - ${Math.max(...ratings)}`);
  console.log(`Year range: ${Math.min(...years)} - ${Math.max(...years)}`);
  console.log(`Vote count range: ${Math.min(...votes)} - ${Math.max(...votes)}`);
  console.log(`Filtered out ${filteredOutCount} obscure movies (< ${MIN_VOTE_COUNT} votes)`);
}

main().catch(console.error);
