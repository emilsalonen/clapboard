"use client";

import { useState } from "react";
import type { HintType, RevealedHints } from "@/lib/types";

interface HintShopProps {
  tokens: number;
  hints: RevealedHints;
  disabled: boolean;
  onBuyHint: (hintType: HintType) => Promise<void>;
}

interface HintDef {
  type: HintType;
  label: string;
  icon: string;
  description: string;
}

const HINT_DEFS: HintDef[] = [
  { type: "decade", label: "Decade", icon: "\uD83D\uDCC5", description: "Reveal the decade" },
  { type: "firstLetter", label: "1st Letter", icon: "\uD83D\uDD24", description: "First letter of the title" },
  { type: "posterCrop", label: "Poster", icon: "\uD83D\uDDBC\uFE0F", description: "Blurred poster glimpse" },
  { type: "oneActor", label: "Actor", icon: "\uD83C\uDFAD", description: "Reveal one actor" },
  { type: "tagline", label: "Tagline", icon: "\uD83D\uDCAC", description: "Reveal the tagline" },
];

function RevealedHint({ type, value }: { type: HintType; value: string }) {
  if (type === "posterCrop" && value) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-20 rounded overflow-hidden border border-[#d8cdb8] flex-shrink-0 relative">
          <img
            src={value}
            alt="Poster hint"
            className="w-full h-full object-cover blur-[3px] scale-125"
          />
        </div>
        <span className="text-[#5a4d3e] text-sm italic">A blurry glimpse of the poster...</span>
      </div>
    );
  }

  if (type === "decade") {
    return <span className="text-[#2d1b0e] font-bold text-lg">Released in the {value}</span>;
  }
  if (type === "firstLetter") {
    return <span className="text-[#2d1b0e] font-bold text-lg">Title starts with &ldquo;{value}&rdquo;</span>;
  }
  if (type === "oneActor") {
    return <span className="text-[#2d1b0e] font-bold text-lg">Stars: {value}</span>;
  }
  if (type === "tagline") {
    return <span className="text-[#2d1b0e] italic font-serif text-lg">&ldquo;{value}&rdquo;</span>;
  }
  return null;
}

export default function HintShop({ tokens, hints, disabled, onBuyHint }: HintShopProps) {
  const [buying, setBuying] = useState<HintType | null>(null);
  const [expanded, setExpanded] = useState(false);

  const revealedCount = Object.keys(hints).length;
  const hasAnyRevealed = revealedCount > 0;

  async function handleBuy(type: HintType) {
    if (buying || disabled || tokens <= 0 || hints[type]) return;
    setBuying(type);
    try {
      await onBuyHint(type);
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#f0e8da]/80 border border-[#d8cdb8] hover:bg-[#e8dcc8] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\uD83D\uDCA1"}</span>
          <span className="font-semibold text-[#2d1b0e] text-sm">
            Hint Shop
          </span>
          {hasAnyRevealed && (
            <span className="text-xs text-[#7a6a55]">
              ({revealedCount} used)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-bold text-[#c4922e]">
            <span className="text-base">{"\uD83E\uDE99"}</span>
            {tokens}
          </span>
          <svg
            className={`w-4 h-4 text-[#7a6a55] transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="animate-accordion-open space-y-3">
          {/* Token info */}
          {tokens === 0 && (
            <p className="text-center text-[#7a6a55] text-sm">
              No tokens! Solve a puzzle to earn one.
            </p>
          )}

          {/* Hint buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {HINT_DEFS.map((h) => {
              const revealed = !!hints[h.type];
              const isBuying = buying === h.type;
              const canBuy = !disabled && !revealed && tokens > 0 && !buying;

              return (
                <button
                  key={h.type}
                  onClick={() => handleBuy(h.type)}
                  disabled={!canBuy}
                  className={`
                    relative flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-center transition-all text-sm
                    ${revealed
                      ? "bg-[#2a7a3a]/10 border-[#2a7a3a]/30 text-[#2a7a3a] cursor-default"
                      : canBuy
                      ? "bg-white border-[#c4922e]/40 text-[#2d1b0e] hover:border-[#c4922e] hover:shadow-md cursor-pointer"
                      : "bg-[#f0e8da]/50 border-[#d8cdb8]/50 text-[#7a6a55]/50 cursor-not-allowed"
                    }
                  `}
                >
                  <span className="text-xl">{h.icon}</span>
                  <span className="font-semibold text-xs">{h.label}</span>
                  {revealed ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold">Revealed</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <span>{"\uD83E\uDE99"}</span> 1
                    </span>
                  )}
                  {isBuying && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <span className="animate-pulse text-[#c4922e] text-xs font-bold">...</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Revealed hints display */}
          {hasAnyRevealed && (
            <div className="space-y-2 bg-white/50 rounded-lg p-3 border border-[#d8cdb8]/50">
              {(Object.entries(hints) as [HintType, string][]).map(([type, value]) => (
                <div key={type}>
                  <RevealedHint type={type} value={value} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
