/**
 * Enrich movies.json with real Oscar nomination counts
 *
 * Usage: npx tsx scripts/enrich-oscars.ts
 *
 * Reads data/oscar-nominations.json (from github.com/delventhalz/json-nominations)
 * and updates oscarWins in data/movies.json based on TMDB ID matching.
 */

import * as fs from "fs";
import * as path from "path";

interface OscarNomination {
  category: string;
  year: string;
  nominees: string[];
  movies: { title: string; tmdb_id: number; imdb_id: string }[];
  won: boolean;
}

interface MovieData {
  id: number;
  title: string;
  oscarWins: number;
  [key: string]: unknown;
}

const oscarsPath = path.resolve(__dirname, "../data/oscar-nominations.json");
const moviesPath = path.resolve(__dirname, "../data/movies.json");

const oscars: OscarNomination[] = JSON.parse(fs.readFileSync(oscarsPath, "utf-8"));
const movies: MovieData[] = JSON.parse(fs.readFileSync(moviesPath, "utf-8"));

// Count wins per TMDB ID (only where won === true)
const winCounts = new Map<number, number>();

for (const nom of oscars) {
  if (!nom.won) continue;
  for (const movie of nom.movies) {
    if (movie.tmdb_id) {
      winCounts.set(
        movie.tmdb_id,
        (winCounts.get(movie.tmdb_id) || 0) + 1
      );
    }
  }
}

// Update movies
let enriched = 0;
for (const movie of movies) {
  const count = winCounts.get(movie.id) || 0;
  movie.oscarWins = count;
  if (count > 0) {
    enriched++;
  }
}

fs.writeFileSync(moviesPath, JSON.stringify(movies, null, 2));

console.log(`Enriched ${enriched} out of ${movies.length} movies with Oscar wins data.`);

// Show some examples
const topOscar = [...movies]
  .sort((a, b) => b.oscarWins - a.oscarWins)
  .slice(0, 10);

console.log("\nTop 10 most Oscar-winning movies in our database:");
for (const m of topOscar) {
  console.log(`  ${m.oscarWins} wins - ${m.title}`);
}
