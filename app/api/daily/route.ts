import { NextResponse } from "next/server";
import { getTodayString, getPuzzleNumber, ROUNDS_PER_DAY } from "@/lib/daily-puzzle";

export async function GET() {
  const date = getTodayString();
  const puzzleNumber = getPuzzleNumber(date);

  return NextResponse.json({
    puzzleNumber,
    date,
    roundsPerDay: ROUNDS_PER_DAY,
    categories: ["Year", "Director", "Genre", "Actors", "Rating"],
  });
}
