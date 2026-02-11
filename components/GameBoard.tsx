"use client";

import type { FeedbackResult, FeedbackColor } from "@/lib/types";

interface GameBoardProps {
  guesses: Array<{ movie: string; feedback: FeedbackResult }>;
}

function colorClass(color: FeedbackColor): string {
  switch (color) {
    case "green":
      return "bg-[#2a7a3a] text-white border-[#1e6b2e]";
    case "yellow":
      return "bg-[#c49520] text-white border-[#a87e18]";
    case "red":
      return "bg-[#b82040] text-white border-[#9a1a35]";
  }
}

function directionArrow(direction: "higher" | "lower" | null): string {
  if (direction === "higher") return " \u25B2";
  if (direction === "lower") return " \u25BC";
  return "";
}

const HEADERS = ["Movie", "Year", "Director", "Genre", "Actors", "Rating", "Oscars"];

export default function GameBoard({ guesses }: GameBoardProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-8 text-[#7a6a55]">
        <p className="text-xl font-serif italic">
          Make your first guess to begin...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-2 py-3 text-sm uppercase tracking-wider text-[#c4922e] font-serif border-b-2 border-[#d8cdb8]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((g, i) => (
            <tr key={i} className="animate-fade-in">
              <td className="px-2 py-3 text-base font-bold text-[#2d1b0e] border-b border-[#d8cdb8] max-w-[160px] truncate">
                {g.feedback.movieTitle}
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.year.color
                  )}`}
                >
                  {g.feedback.year.value}
                  {directionArrow(g.feedback.year.direction)}
                </div>
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.director.color
                  )}`}
                >
                  {g.feedback.director.value}
                </div>
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.genres.color
                  )}`}
                >
                  {g.feedback.genres.value.join(", ")}
                </div>
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.actors.color
                  )}`}
                >
                  {g.feedback.actors.value.join(", ")}
                </div>
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.rating.color
                  )}`}
                >
                  {g.feedback.rating.value}
                  {directionArrow(g.feedback.rating.direction)}
                </div>
              </td>
              <td className="px-1 py-2 border-b border-[#d8cdb8]">
                <div
                  className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(
                    g.feedback.oscars?.color ?? "red"
                  )}`}
                >
                  {g.feedback.oscars?.value ?? "?"}
                  {directionArrow(g.feedback.oscars?.direction ?? null)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
