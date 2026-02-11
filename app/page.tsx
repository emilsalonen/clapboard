"use client";

import { useState, useEffect, useCallback } from "react";
import GuessInput from "@/components/GuessInput";
import GameBoard from "@/components/GameBoard";
import Lifelines from "@/components/Lifelines";
import ResultModal from "@/components/ResultModal";
import AdBanner from "@/components/AdBanner";
import type { GameState, GuessResponse } from "@/lib/types";

const MAX_GUESSES = 10;
const ROUNDS_PER_DAY = 5;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function storageKey(round: number): string {
  return `clapboard-state-${round}`;
}

function loadGameState(round: number): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(storageKey(round));
    if (!saved) return null;
    const state = JSON.parse(saved) as GameState;
    if (state.date !== getTodayString()) return null;
    return state;
  } catch {
    return null;
  }
}

function saveGameState(state: GameState, round: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(round), JSON.stringify(state));
}

function freshGameState(): GameState {
  return {
    date: getTodayString(),
    guesses: [],
    solved: false,
    gameOver: false,
    lifelines: {},
  };
}

/** Find the first incomplete round for today, or return the last round if all complete. */
function findCurrentRound(): number {
  for (let r = 0; r < ROUNDS_PER_DAY; r++) {
    const state = loadGameState(r);
    if (!state || !state.gameOver) return r;
  }
  return ROUNDS_PER_DAY - 1; // all complete, show last round
}

export default function Home() {
  const [currentRound, setCurrentRound] = useState(0);
  const [gameState, setGameState] = useState<GameState>(freshGameState());
  const [titles, setTitles] = useState<string[]>([]);
  const [puzzleNumber, setPuzzleNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Load saved state and fetch titles
  useEffect(() => {
    const round = findCurrentRound();
    setCurrentRound(round);

    const saved = loadGameState(round);
    if (saved) {
      setGameState(saved);
      if (saved.gameOver) {
        setShowResult(true);
      }
    }

    fetch("/api/daily")
      .then((r) => r.json())
      .then((data) => setPuzzleNumber(data.puzzleNumber))
      .catch(() => {});

    fetch("/api/titles")
      .then((r) => r.json())
      .then((data) => setTitles(data.titles))
      .catch(() => {});
  }, []);

  const handleNextPuzzle = useCallback(() => {
    const nextRound = currentRound + 1;
    if (nextRound >= ROUNDS_PER_DAY) return;

    setCurrentRound(nextRound);
    setShowResult(false);
    setError(null);

    const saved = loadGameState(nextRound);
    if (saved) {
      setGameState(saved);
      if (saved.gameOver) {
        setTimeout(() => setShowResult(true), 300);
      }
    } else {
      setGameState(freshGameState());
    }
  }, [currentRound]);

  const handleRetry = useCallback(() => {
    const newState = freshGameState();
    setGameState(newState);
    setShowResult(false);
    setError(null);
    localStorage.removeItem(storageKey(currentRound));
  }, [currentRound]);

  const handleGuess = useCallback(
    async (title: string) => {
      if (gameState.gameOver || loading) return;

      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guess: title,
            guessCount: gameState.guesses.length,
            round: currentRound,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          setLoading(false);
          return;
        }

        const guessResponse = data as GuessResponse;

        const newGuess = {
          movie: title,
          feedback: guessResponse.feedback,
        };

        const newState: GameState = {
          ...gameState,
          guesses: [...gameState.guesses, newGuess],
          solved: guessResponse.solved,
          gameOver: guessResponse.gameOver,
          lifelines: {
            ...gameState.lifelines,
            ...guessResponse.lifelines,
          },
          answer: guessResponse.answer || gameState.answer,
        };

        setGameState(newState);
        saveGameState(newState, currentRound);

        if (guessResponse.gameOver) {
          setTimeout(() => setShowResult(true), 800);
        }
      } catch {
        setError("Failed to submit guess. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [gameState, loading, currentRound]
  );

  const guessCount = gameState.guesses.length;
  const hasNextPuzzle = currentRound < ROUNDS_PER_DAY - 1;

  return (
    <div className="min-h-screen bg-[#faf6f0] relative overflow-hidden">
      {/* Background image - place your image at /public/bg.jpg */}
      <div
        className="bg-image-container"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      {/* Film grain overlay */}
      <div className="film-grain" />
      {/* Vignette */}
      <div className="vignette" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-1 -mt-6">
          <img
            src="/logo.png"
            alt="Clapboard - Movie Guessing Game"
            className="mx-auto w-[340px] md:w-[450px] h-auto -mb-2"
          />
          <div className="flex justify-center gap-6 mt-4 text-sm text-[#7a6a55]">
            <span>
              Puzzle <span className="text-[#c4922e] font-bold">#{puzzleNumber}</span>
            </span>
            <span>
              Round{" "}
              <span className="text-[#c4922e] font-bold">
                {currentRound + 1}/{ROUNDS_PER_DAY}
              </span>
            </span>
            <span>
              Guesses{" "}
              <span className="text-[#c4922e] font-bold">
                {guessCount}/{MAX_GUESSES}
              </span>
            </span>
          </div>
        </header>

        {/* Guess Input */}
        <div className="mb-6">
          <GuessInput
            onGuess={handleGuess}
            disabled={gameState.gameOver || loading}
            titles={titles}
          />
          {error && (
            <p className="text-center text-[#b82040] text-base mt-2 font-serif">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-center text-[#c4922e] text-base mt-2 animate-pulse">
              Checking...
            </p>
          )}
        </div>

        {/* Game Board */}
        <div className="mb-6 bg-white/60 border border-[#d8cdb8] rounded-xl p-4 backdrop-blur-sm">
          <GameBoard guesses={gameState.guesses} />
        </div>

        {/* Lifelines */}
        <div className="mb-6">
          <Lifelines
            guessCount={guessCount}
            tagline={gameState.lifelines.tagline}
            overview={gameState.lifelines.overview}
          />
        </div>

        {/* Ad Banner */}
        <AdBanner className="mb-6" />

        {/* How to Play */}
        {guessCount === 0 && (
          <div className="mt-8 bg-white/60 border border-[#d8cdb8] rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-serif text-[#c4922e] font-bold mb-3 text-center">
              How to Play
            </h2>
            <div className="space-y-2 text-[#2d1b0e]/80 text-base">
              <p>
                Guess the mystery movie in <strong className="text-[#c4922e]">10 tries</strong>.
                After each guess, you&apos;ll see color-coded clues:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#2a7a3a] border border-[#1e6b2e] inline-block flex-shrink-0" />
                  <span>Exact match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#c49520] border border-[#a87e18] inline-block flex-shrink-0" />
                  <span>Close / partial match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#b82040] border border-[#9a1a35] inline-block flex-shrink-0" />
                  <span>No match</span>
                </div>
              </div>
              <p className="mt-3 text-[#7a6a55]">
                Lifeline clues unlock at guesses 4 (tagline) and 7 (plot).
                Arrows (&#x25B2;&#x25BC;) on Year, Rating, and Oscars show if the answer is higher or lower.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 pb-4 text-[#7a6a55]/60 text-sm">
          <p>Powered by TMDB. Not endorsed or certified by TMDB.</p>
        </footer>
      </div>

      {/* Result Modal */}
      {showResult && gameState.gameOver && gameState.answer && (
        <ResultModal
          solved={gameState.solved}
          answer={gameState.answer}
          guesses={gameState.guesses}
          puzzleNumber={puzzleNumber}
          currentRound={currentRound}
          roundsPerDay={ROUNDS_PER_DAY}
          hasNextPuzzle={hasNextPuzzle}
          onNextPuzzle={handleNextPuzzle}
          onClose={() => setShowResult(false)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
