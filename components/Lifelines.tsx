"use client";

interface LifelinesProps {
  guessCount: number;
  tagline?: string;
  overview?: string;
}

export default function Lifelines({
  guessCount,
  tagline,
  overview,
}: LifelinesProps) {
  const taglineUnlocked = guessCount >= 4;
  const overviewUnlocked = guessCount >= 7;

  if (!taglineUnlocked && !overviewUnlocked) {
    return (
      <div className="text-center text-[#5a4d3e] text-lg">
        <p>
          Lifeline clues unlock as you guess:{" "}
          <span className="text-[#c4922e] font-semibold">Tagline at guess 4</span>,{" "}
          <span className="text-[#c4922e] font-semibold">Plot at guess 7</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {taglineUnlocked && (
        <div className="bg-white/70 border border-[#c4922e]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#c4922e] text-sm font-bold uppercase tracking-wider font-serif">
              Tagline Clue
            </span>
          </div>
          <p className="text-[#2d1b0e] italic font-serif text-xl">
            &ldquo;{tagline || "No tagline available."}&rdquo;
          </p>
        </div>
      )}

      {overviewUnlocked && (
        <div className="bg-white/70 border border-[#c4922e]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#c4922e] text-sm font-bold uppercase tracking-wider font-serif">
              Plot Clue
            </span>
          </div>
          <p className="text-[#2d1b0e] text-base leading-relaxed">
            {overview || "No plot available."}
          </p>
        </div>
      )}

      {!overviewUnlocked && (
        <div className="text-center text-[#5a4d3e] text-lg">
          <p>
            <span className="text-[#c4922e] font-semibold">Plot clue</span> unlocks at guess 7
          </p>
        </div>
      )}
    </div>
  );
}
