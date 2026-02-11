import { NextRequest, NextResponse } from "next/server";
import { getDailyMovie, getTodayString } from "@/lib/daily-puzzle";
import type { HintType } from "@/lib/types";

const VALID_HINTS: HintType[] = ["decade", "firstLetter", "posterCrop", "oneActor", "tagline"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { round, hintType } = body as { round?: number; hintType?: string };

    if (!hintType || !VALID_HINTS.includes(hintType as HintType)) {
      return NextResponse.json(
        { error: "Invalid hint type" },
        { status: 400 }
      );
    }

    const date = getTodayString();
    const target = getDailyMovie(date, round ?? 0);

    let value: string;

    switch (hintType as HintType) {
      case "decade": {
        const decade = Math.floor(target.year / 10) * 10;
        value = `${decade}s`;
        break;
      }
      case "firstLetter": {
        // Strip leading "The ", "A ", "An " to get the meaningful first letter
        const stripped = target.title.replace(/^(The|A|An)\s+/i, "");
        value = stripped.charAt(0).toUpperCase();
        break;
      }
      case "posterCrop": {
        // Return the poster path — client will render a cropped/blurred version
        value = target.posterPath
          ? `https://image.tmdb.org/t/p/w200${target.posterPath}`
          : "";
        break;
      }
      case "oneActor": {
        // Pick a deterministic actor (middle of the list for variety)
        const idx = Math.floor(target.actors.length / 2);
        value = target.actors[idx] || target.actors[0] || "Unknown";
        break;
      }
      case "tagline": {
        value = target.tagline || "No tagline available.";
        break;
      }
    }

    return NextResponse.json({ hintType, value });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
