import type { Movie, FeedbackResult, FeedbackColor, Direction } from "./types";

/**
 * Compare a guessed movie against the target movie.
 * Returns color-coded feedback for each category.
 */
export function compareMovies(
  guess: Movie,
  target: Movie
): FeedbackResult {
  return {
    movieTitle: guess.title,
    year: compareYear(guess.year, target.year),
    director: compareDirector(guess.director, target.director),
    genres: compareGenres(guess.genres, target.genres),
    actors: compareActors(guess.actors, target.actors),
    rating: compareRating(guess.voteAverage, target.voteAverage),
    oscars: compareOscars(guess.oscarWins ?? 0, target.oscarWins ?? 0),
  };
}

function compareYear(
  guess: number,
  target: number
): { color: FeedbackColor; direction: Direction; value: number } {
  const diff = Math.abs(guess - target);
  let color: FeedbackColor;

  if (diff === 0) {
    color = "green";
  } else if (diff <= 5) {
    color = "yellow";
  } else {
    color = "red";
  }

  const direction: Direction =
    guess === target ? null : target > guess ? "higher" : "lower";

  return { color, direction, value: guess };
}

function compareDirector(
  guess: string,
  target: string
): { color: FeedbackColor; value: string } {
  const color: FeedbackColor =
    guess.toLowerCase() === target.toLowerCase() ? "green" : "red";
  return { color, value: guess };
}

function compareGenres(
  guess: string[],
  target: string[]
): { color: FeedbackColor; value: string[] } {
  const guessSet = new Set(guess.map((g) => g.toLowerCase()));
  const targetSet = new Set(target.map((g) => g.toLowerCase()));

  const allMatch =
    guessSet.size === targetSet.size &&
    [...guessSet].every((g) => targetSet.has(g));

  if (allMatch) {
    return { color: "green", value: guess };
  }

  const hasOverlap = [...guessSet].some((g) => targetSet.has(g));
  if (hasOverlap) {
    return { color: "yellow", value: guess };
  }

  return { color: "red", value: guess };
}

function compareActors(
  guess: string[],
  target: string[]
): { color: FeedbackColor; value: string[] } {
  const guessSet = new Set(guess.map((a) => a.toLowerCase()));
  const targetSet = new Set(target.map((a) => a.toLowerCase()));

  const allMatch =
    guessSet.size === targetSet.size &&
    [...guessSet].every((a) => targetSet.has(a));

  if (allMatch) {
    return { color: "green", value: guess };
  }

  const hasOverlap = [...guessSet].some((a) => targetSet.has(a));
  if (hasOverlap) {
    return { color: "yellow", value: guess };
  }

  return { color: "red", value: guess };
}

function compareRating(
  guess: number,
  target: number
): { color: FeedbackColor; direction: Direction; value: number } {
  const diff = Math.abs(guess - target);
  let color: FeedbackColor;

  if (diff <= 0.5) {
    color = "green";
  } else if (diff <= 1.5) {
    color = "yellow";
  } else {
    color = "red";
  }

  const direction: Direction =
    guess === target ? null : target > guess ? "higher" : "lower";

  return { color, direction, value: guess };
}

function compareOscars(
  guess: number,
  target: number
): { color: FeedbackColor; direction: Direction; value: number } {
  const diff = Math.abs(guess - target);
  let color: FeedbackColor;

  if (diff === 0) {
    color = "green";
  } else if (diff <= 3) {
    color = "yellow";
  } else {
    color = "red";
  }

  const direction: Direction =
    guess === target ? null : target > guess ? "higher" : "lower";

  return { color, direction, value: guess };
}
