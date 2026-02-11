import { NextResponse } from "next/server";
import { getAllMovieTitles } from "@/lib/daily-puzzle";

export async function GET() {
  const titles = getAllMovieTitles();
  return NextResponse.json({ titles });
}
