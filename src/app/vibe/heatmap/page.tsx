"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { getVibeHeatmap } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { Loader2, MapPin, TrendingUp } from "lucide-react";

export default function VibeHeatmapPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useLocation, setUseLocation] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Location denied
        }
      );
    }

    fetchHeatmap();
  }, [user, router, useLocation]);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const res = await getVibeHeatmap(
        useLocation && location ? location.lat : undefined,
        useLocation && location ? location.lng : undefined,
        50 // 50km radius
      );
      if (res.success) {
        setHeatmap(res.heatmap);
      }
    } catch (error: any) {
      toast.error("Failed to load heatmap");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-purple-400" />
              Local Vibe Heatmap
            </h1>
            <p className="text-white/60">
              Discover trending moods and vibes in your area
            </p>
          </div>

          {location && (
            <button
              onClick={() => {
                setUseLocation(!useLocation);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                useLocation
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {useLocation ? "Using Your Location" : "Use Global Data"}
            </button>
          )}
        </div>

        {heatmap && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trending Moods */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Trending Moods</h2>
              </div>

              {heatmap.trendingMoods && heatmap.trendingMoods.length > 0 ? (
                <div className="space-y-3">
                  {heatmap.trendingMoods.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold capitalize">{item.mood}</p>
                          <p className="text-white/60 text-sm">{item.count} people</p>
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{
                            width: `${(item.count / heatmap.trendingMoods[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">No data available</p>
              )}
            </div>

            {/* Trending Emojis */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔥</span>
                <h2 className="text-2xl font-bold text-white">Trending Emojis</h2>
              </div>

              {heatmap.trendingEmojis && heatmap.trendingEmojis.length > 0 ? (
                <div className="space-y-3">
                  {heatmap.trendingEmojis.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{item.emoji}</div>
                        <div>
                          <p className="text-white font-semibold">#{idx + 1} Trending</p>
                          <p className="text-white/60 text-sm">{item.count} people</p>
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{
                            width: `${(item.count / heatmap.trendingEmojis[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {heatmap && (
          <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-white mb-2">{heatmap.totalVibes || 0}</p>
                <p className="text-white/60">Total Active Vibes</p>
              </div>
              {heatmap.center && (
                <>
                  <div>
                    <p className="text-3xl font-bold text-white mb-2">
                      {heatmap.center.lat.toFixed(2)}°
                    </p>
                    <p className="text-white/60">Latitude</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-2">
                      {heatmap.center.lng.toFixed(2)}°
                    </p>
                    <p className="text-white/60">Longitude</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

