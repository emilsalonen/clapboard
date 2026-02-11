"use client";

import { useState } from "react";
import type { FeedbackResult, FeedbackColor, DirectorSimilarity } from "@/lib/types";

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

function chipAnim(color: FeedbackColor, isNew: boolean): string {
  if (!isNew) return "";
  return color === "green" ? "animate-chip-pop" : "animate-chip-in";
}

function directionArrow(direction: "higher" | "lower" | null): string {
  if (direction === "higher") return " \u25B2";
  if (direction === "lower") return " \u25BC";
  return "";
}

const COLUMN_TOOLTIPS: Record<string, string> = {
  Year: "Green = exact year. Yellow = within 5 years. Red = more than 5 years off. Arrows show if the answer is higher or lower.",
  Director: "Green = same director. Yellow = similar director (Hot/Warm). Red = different director (Cold).",
  Genre: "Green = all genres match. Yellow = some genres overlap. Red = no genres in common.",
  Actors: "Green = same cast. Yellow = some actors overlap. Red = no actors in common.",
  Rating: "Green = exact IMDB rating. Yellow = within 0.3. Red = more than 0.3 off. Arrows show if the answer is higher or lower.",
  Oscars: "Green = exact Oscar wins. Yellow = within 3. Red = more than 3 off. Arrows show if the answer is higher or lower.",
};

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-trigger relative inline-flex items-center ml-1 cursor-help">
      <svg className="w-3.5 h-3.5 text-[#c4922e]/60 hover:text-[#c4922e]" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 110 2 1 1 0 010-2zM6.5 7h2v4.5h-2V7h1z" />
        <circle cx="8" cy="4.5" r="0.9" />
        <rect x="7.1" y="6.5" width="1.8" height="4" rx="0.4" />
      </svg>
      <span className="tooltip-text">{text}</span>
    </span>
  );
}

function ActorsCell({ actors, color, isNew }: { actors: string[]; color: FeedbackColor; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const maxShow = 3;
  const overflow = actors.length - maxShow;

  const displayed = expanded ? actors : actors.slice(0, maxShow);
  const label = displayed.join(", ") + (overflow > 0 && !expanded ? "" : "");

  return (
    <div
      className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(color)} ${chipAnim(color, isNew)}`}
    >
      {label}
      {overflow > 0 && !expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="ml-1 underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          +{overflow} more
        </button>
      )}
    </div>
  );
}

/* ─── Director chip with similarity label + tooltip ─── */
function DirectorChip({
  director,
  isNew,
}: {
  director: { color: FeedbackColor; value: string; similarity?: DirectorSimilarity };
  isNew: boolean;
}) {
  const sim = director.similarity;
  const label = sim && director.color !== "green" ? ` (${sim.label})` : "";
  const reasonText = sim?.reasons?.length ? sim.reasons.join(". ") + "." : "";

  return (
    <div
      className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(director.color)} ${chipAnim(director.color, isNew)} ${reasonText ? "relative" : ""}`}
    >
      {reasonText ? (
        <span className="tooltip-trigger inline-flex items-center justify-center cursor-help">
          {director.value}{label}
          <span className="tooltip-text">{reasonText}</span>
        </span>
      ) : (
        <>{director.value}{label}</>
      )}
    </div>
  );
}

/* ─── Desktop table row ─── */
function TableRow({ guess, isNew }: { guess: { movie: string; feedback: FeedbackResult }; isNew: boolean }) {
  const f = guess.feedback;
  return (
    <tr className={isNew ? "animate-row-in" : ""}>
      <td className="px-2 py-3 text-base font-bold text-[#2d1b0e] border-b border-[#d8cdb8] max-w-[160px] truncate">
        {f.movieTitle}
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <div className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(f.year.color)} ${chipAnim(f.year.color, isNew)}`}>
          {f.year.value}{directionArrow(f.year.direction)}
        </div>
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <DirectorChip director={f.director} isNew={isNew} />
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <div className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(f.genres.color)} ${chipAnim(f.genres.color, isNew)}`}>
          {f.genres.value.join(", ")}
        </div>
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <ActorsCell actors={f.actors.value} color={f.actors.color} isNew={isNew} />
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <div className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(f.rating.color)} ${chipAnim(f.rating.color, isNew)}`}>
          {f.rating.value}{directionArrow(f.rating.direction)}
        </div>
      </td>
      <td className="px-1 py-2 border-b border-[#d8cdb8]">
        <div className={`rounded-md px-2 py-1.5 text-center text-sm font-bold border ${colorClass(f.oscars?.color ?? "red")} ${chipAnim(f.oscars?.color ?? "red", isNew)}`}>
          {f.oscars?.value ?? "?"}{directionArrow(f.oscars?.direction ?? null)}
        </div>
      </td>
    </tr>
  );
}

/* ─── Mobile accordion card ─── */
function AccordionCard({ guess, index, isNew }: { guess: { movie: string; feedback: FeedbackResult }; index: number; isNew: boolean }) {
  const [open, setOpen] = useState(false);
  const f = guess.feedback;

  // Overall color: green if solved, yellow if any yellow, else red
  const allColors = [f.year.color, f.director.color, f.genres.color, f.actors.color, f.rating.color, f.oscars?.color ?? "red"];
  const summaryColor = allColors.every((c) => c === "green")
    ? "green"
    : allColors.some((c) => c === "green" || c === "yellow")
    ? "yellow"
    : "red";

  const fields: { label: string; value: string; color: FeedbackColor }[] = [
    { label: "Year", value: `${f.year.value}${directionArrow(f.year.direction)}`, color: f.year.color },
    { label: "Director", value: f.director.value + (f.director.similarity && f.director.color !== "green" ? ` (${f.director.similarity.label})` : ""), color: f.director.color },
    { label: "Genre", value: f.genres.value.join(", "), color: f.genres.color },
    { label: "Actors", value: f.actors.value.join(", "), color: f.actors.color },
    { label: "Rating", value: `${f.rating.value}${directionArrow(f.rating.direction)}`, color: f.rating.color },
    { label: "Oscars", value: `${f.oscars?.value ?? "?"}${directionArrow(f.oscars?.direction ?? null)}`, color: f.oscars?.color ?? "red" },
  ];

  return (
    <div className={`rounded-lg border border-[#d8cdb8] overflow-hidden ${isNew ? "animate-row-in" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-white/50 hover:bg-white/70 transition-colors"
      >
        <span className="text-[#7a6a55] text-sm font-mono w-5">#{index + 1}</span>
        <span className="font-bold text-[#2d1b0e] text-base flex-1 truncate">{f.movieTitle}</span>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
          summaryColor === "green" ? "bg-[#2a7a3a]" : summaryColor === "yellow" ? "bg-[#c49520]" : "bg-[#b82040]"
        }`} />
        <svg
          className={`w-4 h-4 text-[#7a6a55] transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-2 animate-accordion-open">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-2">
              <span className="text-[#7a6a55] text-xs uppercase tracking-wider w-16 flex-shrink-0 font-semibold">
                {field.label}
              </span>
              <div
                className={`rounded-md px-2.5 py-1 text-sm font-bold border flex-1 ${colorClass(field.color)} ${chipAnim(field.color, isNew)}`}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameBoard({ guesses }: GameBoardProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-8 text-[#5a4d3e]">
        <p className="text-xl font-serif italic">
          Make your first guess to begin...
        </p>
      </div>
    );
  }

  const lastIndex = guesses.length - 1;
  const headers = ["Year", "Director", "Genre", "Actors", "Rating", "Oscars"] as const;

  return (
    <>
      {/* Desktop table */}
      <div className="w-full overflow-x-auto hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-3 text-sm uppercase tracking-wider text-[#c4922e] font-serif border-b-2 border-[#d8cdb8]">
                Movie
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-2 py-3 text-sm uppercase tracking-wider text-[#c4922e] font-serif border-b-2 border-[#d8cdb8]"
                >
                  <span className="inline-flex items-center">
                    {h}
                    <Tooltip text={COLUMN_TOOLTIPS[h]} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guesses.map((g, i) => (
              <TableRow key={i} guess={g} isNew={i === lastIndex} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile accordion */}
      <div className="md:hidden space-y-2">
        {guesses.map((g, i) => (
          <AccordionCard key={i} guess={g} index={i} isNew={i === lastIndex} />
        ))}
      </div>
    </>
  );
}
