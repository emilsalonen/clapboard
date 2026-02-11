"use client";

import { useState, useEffect, useCallback } from "react";
import GuessInput from "@/components/GuessInput";
import GameBoard from "@/components/GameBoard";
import Lifelines from "@/components/Lifelines";
import HintShop from "@/components/HintShop";
import ResultModal from "@/components/ResultModal";
import AdBanner from "@/components/AdBanner";
import type { GameState, GuessResponse, HintType } from "@/lib/types";

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

const TOKEN_KEY = "clapboard-tokens";

function loadTokens(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(TOKEN_KEY);
  return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
}

function saveTokens(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, String(Math.max(0, count)));
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
  const [tokens, setTokens] = useState(0);

  // Load saved state and fetch titles
  useEffect(() => {
    setTokens(loadTokens());

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
          if (guessResponse.solved) {
            const newTokens = tokens + 1;
            setTokens(newTokens);
            saveTokens(newTokens);
          }
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

  const handleBuyHint = useCallback(
    async (hintType: HintType) => {
      if (tokens <= 0 || gameState.gameOver || gameState.hints?.[hintType]) return;

      try {
        const res = await fetch("/api/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: currentRound, hintType }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const newTokens = tokens - 1;
        setTokens(newTokens);
        saveTokens(newTokens);

        const newState: GameState = {
          ...gameState,
          hints: { ...gameState.hints, [hintType]: data.value },
        };
        setGameState(newState);
        saveGameState(newState, currentRound);
      } catch {
        // silently fail
      }
    },
    [tokens, gameState, currentRound]
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
        </header>

        {/* Frosted glass game container */}
        <div className="frosted-panel rounded-2xl p-5 md:p-8 mt-4">
          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-5 text-lg font-medium text-[#2d1b0e]">
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

          {/* Guess Input */}
          <div className="mb-6">
            <GuessInput
              onGuess={handleGuess}
              disabled={gameState.gameOver || loading}
              titles={titles}
            />
            {error && (
              <p className="text-center text-[#b82040] text-lg mt-2 font-serif font-semibold">
                {error}
              </p>
            )}
            {loading && (
              <p className="text-center text-[#c4922e] text-lg mt-2 animate-pulse font-medium">
                Checking...
              </p>
            )}
          </div>

          {/* Game Board */}
          <div className="mb-4">
            <GameBoard guesses={gameState.guesses} />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-5 text-sm text-[#3d2e1e]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#2a7a3a] border border-[#1e6b2e] inline-block" />
              Exact
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#c49520] border border-[#a87e18] inline-block" />
              Close
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#b82040] border border-[#9a1a35] inline-block" />
              No match
            </span>
            <span className="text-[#5a4d3e]">
              &#x25B2; = answer is higher &nbsp; &#x25BC; = answer is lower
            </span>
          </div>

          {/* Hint Shop — only show after first guess */}
          {!gameState.gameOver && guessCount > 0 && (
            <div className="mb-4">
              <HintShop
                tokens={tokens}
                hints={gameState.hints || {}}
                disabled={gameState.gameOver}
                onBuyHint={handleBuyHint}
              />
            </div>
          )}

          {/* Lifelines */}
          <div className="mb-2">
            <Lifelines
              guessCount={guessCount}
              tagline={gameState.lifelines.tagline}
              overview={gameState.lifelines.overview}
            />
          </div>
        </div>

        {/* Ad Banner */}
        <div className="mt-6">
          <AdBanner className="mb-6" />
        </div>

        {/* How to Play */}
        {guessCount === 0 && (
          <div className="mt-6 frosted-panel rounded-2xl p-6">
            <h2 className="text-xl font-serif text-[#c4922e] font-bold mb-3 text-center">
              How to Play
            </h2>
            <div className="space-y-2 text-[#2d1b0e] text-lg">
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
              <p className="mt-3 text-[#3d2e1e]">
                Lifeline clues unlock at guesses 4 (tagline) and 7 (plot).
                Arrows (&#x25B2;&#x25BC;) on Year, Rating, and Oscars show if the answer is higher or lower.
              </p>
            </div>
          </div>
        )}

        {/* DEV: Hard restart */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-center mt-6">
            <button
              onClick={() => {
                for (let r = 0; r < ROUNDS_PER_DAY; r++) {
                  localStorage.removeItem(storageKey(r));
                }
                window.location.reload();
              }}
              className="px-4 py-2 text-sm bg-[#2d1b0e] text-white rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              Dev: Hard Restart (clear all rounds)
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 pb-4 text-[#5a4d3e] text-base">
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
