"use client";

import { useState, useRef, useEffect } from "react";

interface GuessInputProps {
  onGuess: (title: string) => void;
  disabled: boolean;
  titles: string[];
}

export default function GuessInput({ onGuess, disabled, titles }: GuessInputProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const lower = value.toLowerCase();
      const filtered = titles
        .filter((t) => t.toLowerCase().includes(lower))
        .slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, titles]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(title?: string) {
    const submitTitle = title || value.trim();
    if (!submitTitle || disabled) return;
    onGuess(submitTitle);
    setValue("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={disabled ? "Game over!" : "Type a movie title..."}
          disabled={disabled}
          className="min-w-0 flex-1 px-4 py-3 bg-white text-[#2d1b0e] placeholder-[#a09080] border-2 border-[#d8cdb8] rounded-lg font-sans text-lg focus:outline-none focus:border-[#c4922e] focus:ring-2 focus:ring-[#c4922e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 px-6 py-3 bg-[#c4922e] text-white font-bold rounded-lg border-2 border-[#a87e18] hover:bg-[#d4a23e] active:bg-[#b4821e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          Guess
        </button>
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border-2 border-[#d8cdb8] rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((title, i) => (
            <button
              key={title}
              onClick={() => handleSubmit(title)}
              className={`w-full text-left px-4 py-2.5 text-[#2d1b0e] text-base hover:bg-[#f0e8da] transition-colors ${
                i === selectedIndex ? "bg-[#f0e8da]" : ""
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
