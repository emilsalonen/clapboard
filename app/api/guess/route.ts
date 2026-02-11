import { NextRequest, NextResponse } from "next/server";
import { getDailyMovie, findMovieByTitle, getTodayString } from "@/lib/daily-puzzle";
import { compareMovies } from "@/lib/game-logic";
import type { GuessResponse } from "@/lib/types";

const MAX_GUESSES = 10;
const TAGLINE_THRESHOLD = 4;
const OVERVIEW_THRESHOLD = 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guess, guessCount: clientGuessCount, round } = body as {
      guess: string;
      guessCount: number;
      round?: number;
    };

    if (!guess || typeof guess !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid guess" },
        { status: 400 }
      );
    }

    const date = getTodayString();
    const target = getDailyMovie(date, round ?? 0);
    const guessedMovie = findMovieByTitle(guess);

    if (!guessedMovie) {
      return NextResponse.json(
        { error: "Movie not found in our database. Try again!" },
        { status: 404 }
      );
    }

    const feedback = compareMovies(guessedMovie, target);
    const guessCount = (clientGuessCount || 0) + 1;
    const solved =
      guessedMovie.title.toLowerCase() === target.title.toLowerCase();
    const gameOver = solved || guessCount >= MAX_GUESSES;

    const lifelines: { tagline?: string; overview?: string } = {};
    if (guessCount >= TAGLINE_THRESHOLD && !solved) {
      lifelines.tagline = target.tagline || "No tagline available.";
    }
    if (guessCount >= OVERVIEW_THRESHOLD && !solved) {
      lifelines.overview = target.overview;
    }

    const response: GuessResponse = {
      feedback,
      guessCount,
      solved,
      gameOver,
      lifelines,
    };

    // Reveal the answer when game is over (win or lose)
    if (gameOver) {
      response.answer = target;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
