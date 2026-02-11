"use client";

import type { Movie, FeedbackResult } from "@/lib/types";
import ShareButton from "./ShareButton";

interface ResultModalProps {
  solved: boolean;
  answer: Movie;
  guesses: Array<{ movie: string; feedback: FeedbackResult }>;
  puzzleNumber: number;
  currentRound: number;
  roundsPerDay: number;
  hasNextPuzzle: boolean;
  onNextPuzzle: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export default function ResultModal({
  solved,
  answer,
  guesses,
  puzzleNumber,
  currentRound,
  roundsPerDay,
  hasNextPuzzle,
  onNextPuzzle,
  onClose,
  onRetry,
}: ResultModalProps) {
  const providers = answer.watchProviders || {};
  const region = providers["SE"] || providers["US"] || providers["GB"];
  const regionProviders = region?.providers || [];
  const watchLink = region?.link;

  const posterUrl = answer.posterPath
    ? `https://image.tmdb.org/t/p/w300${answer.posterPath}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border-2 border-[#c4922e] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-[#d8cdb8]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#7a6a55] hover:text-[#2d1b0e] text-2xl leading-none"
          >
            &times;
          </button>
          <div className="text-4xl mb-2">{solved ? "\uD83C\uDFC6" : "\uD83C\uDFAC"}</div>
          <h2 className="text-2xl font-serif text-[#c4922e] font-bold">
            {solved ? "Bravo!" : "Better Luck Tomorrow!"}
          </h2>
          <p className="text-[#7a6a55] text-base mt-1">
            {solved
              ? `You got it in ${guesses.length} guess${guesses.length === 1 ? "" : "es"}!`
              : "The movie was..."}
          </p>
          <p className="text-[#7a6a55] text-sm mt-1">
            Round {currentRound + 1} of {roundsPerDay}
          </p>
        </div>

        {/* Movie info */}
        <div className="p-6 text-center">
          <div className="flex items-start justify-center gap-4 mb-4">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={answer.title}
                className="w-28 rounded-lg shadow-lg border border-[#d8cdb8]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="text-left">
              <h3 className="text-xl font-serif text-[#2d1b0e] font-bold">
                {answer.title}
              </h3>
              <p className="text-[#c4922e] text-base font-medium">
                {answer.year} &middot; {answer.director}
              </p>
              <p className="text-[#7a6a55] text-sm mt-1">
                {answer.genres.join(", ")}
              </p>
              <p className="text-[#7a6a55] text-sm">
                {answer.actors.join(", ")}
              </p>
              {answer.oscarWins > 0 && (
                <p className="text-[#c4922e] text-sm mt-1 font-medium">
                  {answer.oscarWins} Oscar win{answer.oscarWins !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {answer.tagline && (
            <p className="text-[#7a6a55] italic font-serif text-base mb-4">
              &ldquo;{answer.tagline}&rdquo;
            </p>
          )}

          {/* Streaming */}
          {regionProviders.length > 0 && (
            <div className="mt-4">
              <p className="text-[#c4922e] text-sm uppercase tracking-wider mb-2 font-bold">
                Watch on
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {regionProviders.map((p) => (
                  <a
                    key={p.name}
                    href={watchLink || `https://www.themoviedb.org/movie/${answer.id}/watch`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#f0e8da] border border-[#d8cdb8] rounded-full text-sm text-[#2d1b0e] hover:bg-[#e8dcc8] transition-colors cursor-pointer"
                  >
                    {p.logoPath && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logoPath}`}
                        alt={p.name}
                        className="w-4 h-4 rounded"
                      />
                    )}
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Share & Next/Retry */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <ShareButton
              puzzleNumber={puzzleNumber}
              guesses={guesses}
              solved={solved}
              maxGuesses={10}
            />
            {hasNextPuzzle ? (
              <button
                onClick={onNextPuzzle}
                className="px-6 py-3 bg-[#2a7a3a] text-white font-bold rounded-lg border-2 border-[#1e6b2e] hover:bg-[#348a44] active:bg-[#1e6b2e] transition-colors text-sm uppercase tracking-wider"
              >
                Next Puzzle
              </button>
            ) : (
              <p className="text-[#7a6a55] text-sm">
                Come back tomorrow for new puzzles!
              </p>
            )}
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-[#f0e8da] text-[#2d1b0e] font-medium rounded-lg border border-[#d8cdb8] hover:bg-[#e8dcc8] transition-colors text-sm"
            >
              Play Again (Test Mode)
            </button>
          </div>

          {/* Ad placeholder */}
          <div className="mt-4 p-3 border border-dashed border-[#d8cdb8] rounded text-[#7a6a55]/50 text-xs">
            Ad space
          </div>
        </div>
      </div>
    </div>
  );
}
