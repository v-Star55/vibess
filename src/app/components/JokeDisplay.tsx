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
        setJoke("Why do programmers prefer dark mode? Because light attracts bugs!");
      }
    } catch (error) {
      console.error("Error fetching joke:", error);
      setJoke("Why do programmers prefer dark mode? Because light attracts bugs!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewJoke();

    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchNewJoke, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="tip-card glass font-sans text-white w-full">
      <div className="tip-ic shrink-0">
        <Sparkles className="w-[22px] h-[22px] text-[#160E22] animate-pulse" />
      </div>
      <div className="tip-body">
        <div className="tip-head">
          <h3>Giggles</h3>
          <span className="tip-tag glass">A tiny laugh, every half hour</span>
        </div>
        {loading ? (
          <div className="h-6 w-2/3 rounded bg-white/10 animate-pulse mt-2"></div>
        ) : (
          <p className="text-[15.5px] leading-[1.45] text-[#f3efff]">{joke}</p>
        )}
      </div>
    </div>
  );
}

