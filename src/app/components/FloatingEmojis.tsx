"use client";

import { useEffect, useState } from "react";
import { getVibeHeatmap } from "../lib/vibeApi";

interface EmojiData {
  emoji: string;
  count: number;
}

export default function FloatingEmojis() {
  const [topEmojis, setTopEmojis] = useState<EmojiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopEmojis = async () => {
      try {
        const data = await getVibeHeatmap();
        if (data?.success && data?.heatmap?.trendingEmojis) {
          // Get top 5 emojis
          const top5 = data.heatmap.trendingEmojis.slice(0, 5);
          setTopEmojis(top5);
        }
      } catch (error) {
        console.error("Error fetching top emojis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopEmojis();
    // Refresh every 30 minutes
    const interval = setInterval(fetchTopEmojis, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || topEmojis.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {topEmojis.map((item, index) => (
        <div
          key={index}
          className="animate-bounce"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "2s",
          }}
        >
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full p-2 shadow-lg hover:scale-110 transition-transform duration-300">
            <span className="text-xl block">{item.emoji}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

