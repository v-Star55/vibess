"use client";

import { useEffect, useState } from "react";
import { fetchJoke } from "../lib/api";
import { Sparkles } from "lucide-react";


export default function JokeDisplay() {
  const [joke, setJoke] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchNewJoke = async () => {
    try {
      setLoading(true);
      const data = await fetchJoke();
      if (Array.isArray(data) && data.length > 0 && data[0].joke) {
        setJoke(data[0].joke);
      } else {
        setJoke("Why did the developer go broke? Because he used up all his cache!");
      }
    } catch (error) {
      console.error("Error fetching joke:", error);
      setJoke("Why did the developer go broke? Because he used up all his cache!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch joke immediately on mount
    fetchNewJoke();

    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchNewJoke, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-gradient-to-br from-purple-600/10 to-pink-500/20 border border-purple-400/20 rounded-2xl py-5 px-10 shadow-xl backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="flex-shrink-0 flex flex-col items-center mr-0 sm:mr-5">
          <span className="bg-purple-500/20 rounded-full p-3">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
          </span>
        </div>
        <div className="flex-1 w-full min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
            <h3 className="text-lg font-bold text-white/90 tracking-wide">Giggles</h3>
            <span className="ml-0 sm:ml-4 text-xs text-purple-100 bg-purple-800/30 rounded px-3 py-1 font-mono">
              A tiny laugh, every half hour.
            </span>
          </div>
          <div className="mt-3 min-h-[32px]">
            {loading ? (
              <div className="h-7 w-2/3 rounded bg-white/15 animate-pulse"></div>
            ) : (
              <p className="text-white/90 text-base sm:text-lg leading-relaxed break-words">{joke}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

