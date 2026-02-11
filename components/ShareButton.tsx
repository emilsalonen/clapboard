"use client";

import { useState } from "react";
import type { FeedbackResult } from "@/lib/types";

interface ShareButtonProps {
  puzzleNumber: number;
  guesses: Array<{ movie: string; feedback: FeedbackResult }>;
  solved: boolean;
  maxGuesses: number;
}

function colorToEmoji(color: "green" | "yellow" | "red"): string {
  switch (color) {
    case "green":
      return "\uD83D\uDFE9";
    case "yellow":
      return "\uD83D\uDFE8";
    case "red":
      return "\uD83D\uDFE5";
  }
}

export default function ShareButton({
  puzzleNumber,
  guesses,
  solved,
  maxGuesses,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function generateShareText(): string {
    const score = solved ? `${guesses.length}/${maxGuesses}` : `X/${maxGuesses}`;
    const grid = guesses
      .map((g) => {
        const f = g.feedback;
        return [
          colorToEmoji(f.year.color),
          colorToEmoji(f.director.color),
          colorToEmoji(f.genres.color),
          colorToEmoji(f.actors.color),
          colorToEmoji(f.rating.color),
          colorToEmoji(f.oscars?.color ?? "red"),
        ].join("");
      })
      .join("\n");

    return `\uD83C\uDFAC Clapboard #${puzzleNumber} - ${score}\n\n${grid}\n\nhttps://clapboard.vercel.app`;
  }

  async function handleShare() {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="px-6 py-3 bg-[#c4922e] text-white font-bold rounded-lg border-2 border-[#a87e18] hover:bg-[#d4a23e] active:bg-[#b4821e] transition-colors text-sm uppercase tracking-wider"
    >
      {copied ? "Copied!" : "Share Result"}
    </button>
  );
}
