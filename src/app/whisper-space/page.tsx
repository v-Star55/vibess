"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Flag, Loader2, Heart, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  createConfession,
  getConfessionsWall,
  reportConfession,
  checkConfessionLimit,
  relateConfession,
  getUserLocation,
} from "../lib/api";

interface Confession {
  _id: string;
  text: string;
  mood: string;
  relates: number;
  hasRelated: boolean;
  dist: string;
  createdAt: string;
}

function calculateDistance(coords1: number[], coords2: number[]): number | null {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) return null;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  if (lon1 === 0 && lat1 === 0) return null;
  if (lon2 === 0 && lat2 === 0) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function WhisperSpacePage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confessionText, setConfessionText] = useState("");
  const [activeMood, setActiveMood] = useState<string>("overthinking");
  const [filter, setFilter] = useState<string>("global"); // "global" | "nearby" | "trending"
  const [canPost, setCanPost] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null); // in seconds
  const [reportingId, setReportingId] = useState<string | null>(null);
  
  // Geolocation states
  const [city, setCity] = useState<string>("Bhiwadi");
  const [distText, setDistText] = useState<string>("10km");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalWhispers, setTotalWhispers] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initialize = async () => {
      await checkLimit();
      await loadConfessions(1, filter);
      await initLocation();
    };
    initialize();

    // Refresh confessions every 30 seconds
    const interval = setInterval(() => loadConfessions(1, filter), 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const initLocation = async () => {
    try {
      const res = await getUserLocation();
      if (res && res.success && res.location) {
        const { latitude, longitude } = res.location;
        if (latitude && longitude) {
          fetchCity(latitude, longitude);
          
          // Reference point is Bhiwadi coordinates (approx. 28.21, 76.84)
          const bLat = 28.21;
          const bLon = 76.84;
          const dist = calculateDistance([longitude, latitude], [bLon, bLat]);
          if (dist) {
            setDistText(`${Math.round(dist)}km`);
          }
        }
      }
    } catch (err) {
      console.error("Location init error:", err);
    }
  };

  const fetchCity = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        {
          headers: {
            "User-Agent": "vibess-app/1.0",
          },
        }
      );
      const data = await res.json();
      if (data && data.address) {
        const locName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county ||
          "Nearby";
        setCity(locName);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const loadConfessions = async (pageNum: number = page, currentFilter: string = filter) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      const res = await getConfessionsWall(pageNum, 15, currentFilter);
      if (res.success) {
        if (pageNum === 1) {
          setConfessions(res.confessions);
        } else {
          setConfessions((prev) => [...prev, ...res.confessions]);
        }
        setHasMore(res.pagination.hasMore);
        if (res.pagination?.total !== undefined) {
          setTotalWhispers(res.pagination.total);
        }
      }
    } catch (error) {
      console.error("Error loading confessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async () => {
    try {
      const res = await checkConfessionLimit();
      if (res.success) {
        setCanPost(res.canPost);
        if (!res.canPost && res.timeRemaining) {
          setSecondsRemaining(res.timeRemaining * 60);
        } else {
          setSecondsRemaining(null);
        }
      }
    } catch (error) {
      console.error("Error checking limit:", error);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) {
      if (secondsRemaining !== null && secondsRemaining <= 0) {
        setCanPost(true);
        setSecondsRemaining(null);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setCanPost(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confessionText.trim()) {
      toast.error("Please write something");
      return;
    }

    if (confessionText.length > 300) {
      toast.error("Confession must be 300 characters or less");
      return;
    }

    if (!canPost) {
      toast.error("Your heart already spoke. Come back later 🤍");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createConfession(confessionText.trim(), activeMood);

      if (res.success) {
        toast.success("Sent into the void. Someone nearby will read it.");
        setConfessionText("");
        setCanPost(false);
        await checkLimit();
        await loadConfessions(1, filter);
        setPage(1);
      } else {
        toast.error(res.message || "Failed to post confession");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to post confession";
      toast.error(errorMessage);
      if (errorMessage.includes("Come back later")) {
        setCanPost(false);
        checkLimit();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelate = async (confessionId: string) => {
    try {
      const res = await relateConfession(confessionId);
      if (res.success) {
        setConfessions((prev) =>
          prev.map((c) => {
            if (c._id === confessionId) {
              return {
                ...c,
                relates: res.relatesCount,
                hasRelated: res.hasRelated,
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Relate Error:", error);
    }
  };

  const handleReport = async (confessionId: string) => {
    if (reportingId) return;

    setReportingId(confessionId);
    try {
      const res = await reportConfession(confessionId);
      if (res.success) {
        if (res.removed) {
          toast.success("Confession removed");
          setConfessions((prev) => prev.filter((c) => c._id !== confessionId));
        } else {
          toast.success("Report submitted. Thank you for keeping Whisper Space safe.");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to report confession");
    } finally {
      setReportingId(null);
    }
  };

  const formatWaitTime = (seconds: number | null) => {
    if (seconds === null) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-slate-100 overflow-y-auto">
      {/* Dynamic inline styles for smooth keyframes */}
      <style jsx global>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(51, 214, 192, 0.55); }
          70% { box-shadow: 0 0 0 8px rgba(51, 214, 192, 0); }
          100% { box-shadow: 0 0 0 0 rgba(51, 214, 192, 0); }
        }
        @keyframes spin-conic {
          to { transform: rotate(360deg); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 1.8s infinite;
        }
        .animate-spin-slow {
          animation: spin-conic 8s linear infinite;
        }
      `}</style>

      {/* Decorative Blur Background Grains */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[8%] left-[15%] w-[42%] h-[42%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[15%] right-[12%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[30%] w-[45%] h-[45%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[5%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>
        
        {/* SVG overlay grain */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>



      {/* Content Container */}
      <div className="max-w-[920px] mx-auto px-6 py-8 relative z-10 w-full flex-1">
        
        {/* Hero Section */}
        <div className="text-center py-12 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[pulse_1.2s_infinite]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-[pulse_1.2s_infinite_0.15s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-[pulse_1.2s_infinite_0.3s]"></span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-bricolage leading-none">
            Whisper <span className="bg-gradient-to-r from-rose-400 via-purple-500 to-teal-400 bg-clip-text text-transparent">Space</span>
          </h1>
          <p className="text-white/60 text-sm mt-3.5 max-w-md">
            Where unsaid things feel safe. No judgment. Just space.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] text-white/50 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-ring"></span>
            {totalWhispers.toLocaleString()} whispers floating near you
          </div>
        </div>

        {/* Composer Card */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[24px] p-6 sm:p-8 mb-10 shadow-2xl">
          <div className="absolute -top-[40%] -right-[15%] w-80 h-80 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none"></div>

          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-sm shadow-md shadow-rose-500/20">
              🪶
            </div>
            <h3 className="text-base font-bold text-white font-bricolage">Share your confession</h3>
          </div>

          {/* Mood Selection */}
          <div className="flex gap-2 flex-wrap mb-5 relative z-10">
            {[
              { id: "chill", label: "Chill", color: "border-amber-400/50 bg-amber-400/10 text-amber-300 ring-amber-400/20", dot: "bg-amber-400" },
              { id: "fun", label: "Fun", color: "border-rose-400/50 bg-rose-400/10 text-rose-300 ring-rose-400/20", dot: "bg-rose-400" },
              { id: "overthinking", label: "Overthinking", color: "border-purple-400/50 bg-purple-400/10 text-purple-300 ring-purple-400/20", dot: "bg-purple-400" },
              { id: "chaos", label: "Chaos", color: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/20", dot: "bg-fuchsia-400" },
              { id: "calm", label: "Calm", color: "border-teal-400/50 bg-teal-400/10 text-teal-300 ring-teal-400/20", dot: "bg-teal-400" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMood(m.id)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMood === m.id
                    ? `${m.color} scale-[1.05] ring-4`
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}></span>
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative z-10 mb-4">
            <textarea
              ref={textareaRef}
              value={confessionText}
              onChange={(e) => setConfessionText(e.target.value)}
              maxLength={300}
              disabled={!canPost || submitting}
              placeholder="Type your confession here… no names, no faces, just you."
              className="w-full min-h-[120px] rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/10 p-4 text-white text-sm placeholder-white/30 outline-none resize-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 mb-6 relative z-10">
            <span className={`font-mono ${confessionText.length > 260 ? "text-amber-400" : ""}`}>
              {confessionText.length}/300 characters
            </span>
            {!canPost && secondsRemaining !== null && (
              <span className="font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                ⏱ {formatWaitTime(secondsRemaining)}
              </span>
            )}
          </div>

          {canPost ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !confessionText.trim()}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-purple-500 to-teal-400 hover:scale-[1.01] text-zinc-950 font-bold text-sm transition-all shadow-xl shadow-purple-500/20 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send it into the void ✦</span>
              )}
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 text-center flex items-center justify-center gap-2 text-xs text-white/60 relative z-10">
              <Heart className="w-4 h-4 text-rose-500 animate-[heartbeat_1.8s_infinite]" />
              Your heart already spoke. Come back in <span className="text-white font-mono">{formatWaitTime(secondsRemaining)}</span>
            </div>
          )}
        </div>

        {/* Wall Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white font-bricolage">Confessions Wall</h2>
            <div className="flex p-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              {(["global", "nearby", "trending"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilter(tab);
                    setPage(1);
                    loadConfessions(1, tab);
                  }}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition-all capitalize cursor-pointer ${
                    filter === tab
                      ? "bg-gradient-to-r from-rose-500 to-purple-500 text-zinc-950 shadow-md font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            🔒 All confessions are 100% anonymous
          </div>
        </div>

        {/* Wall Content */}
        {loading && confessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-[20px]">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-3" />
            <p className="text-xs text-white/40 font-mono">Drawing whispers from the void...</p>
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <MessageCircle className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <p className="text-white/60 text-base font-bold font-bricolage mb-1.5">No whispers floating here yet</p>
            <p className="text-white/40 text-xs max-w-[280px] mx-auto">
              Be the first to release your unsaid thoughts into this void.
            </p>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 pb-12">
              {confessions.map((w) => {
                const borderColors = {
                  chill: "border-l-amber-400 border-l-[3px]",
                  fun: "border-l-rose-500 border-l-[3px]",
                  overthinking: "border-l-purple-500 border-l-[3px]",
                  chaos: "border-l-fuchsia-500 border-l-[3px]",
                  calm: "border-l-teal-400 border-l-[3px]",
                };

                const moodDots = {
                  chill: "bg-amber-400 shadow-[0_0_8px_#ffb25e]",
                  fun: "bg-rose-500 shadow-[0_0_8px_#ff5d73]",
                  overthinking: "bg-purple-500 shadow-[0_0_8px_#c65cff]",
                  chaos: "bg-fuchsia-500 shadow-[0_0_8px_#c65cff]",
                  calm: "bg-teal-400 shadow-[0_0_8px_#33d6c0]",
                };

                const activeBorder = borderColors[w.mood as keyof typeof borderColors] || borderColors.chill;
                const activeDot = moodDots[w.mood as keyof typeof moodDots] || moodDots.chill;

                return (
                  <div
                    key={w._id}
                    className={`break-inside-avoid relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 ${activeBorder} transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-white/20 group`}
                  >
                    {/* Header bar of the card */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-12 h-2 rounded-full bg-gradient-to-r from-white/5 via-white/20 to-white/5 blur-[0.5px]"></div>
                      <span className="text-[10px] font-mono text-white/40">
                        {w.dist} · {formatTimeAgo(w.createdAt)}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ml-auto ${activeDot}`}></span>
                    </div>

                    {/* Confession text */}
                    <p className="text-sm text-white/90 leading-relaxed mb-5 whitespace-pre-wrap select-text">
                      {w.text}
                    </p>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleRelate(w._id)}
                        className={`flex items-center gap-1 font-mono text-[11.5px] transition-all bg-transparent border-none py-1 -ml-1 cursor-pointer select-none ${
                          w.hasRelated ? "text-rose-500 font-bold" : "text-white/40 hover:text-rose-400"
                        }`}
                      >
                        <span className={`inline-block transition-transform duration-250 ${w.hasRelated ? "scale-[1.25] text-rose-500" : ""}`}>
                          ♥
                        </span>
                        <span>{w.relates} relate</span>
                      </button>

                      <button
                        onClick={() => handleReport(w._id)}
                        disabled={reportingId === w._id}
                        className="text-[10px] font-mono text-white/30 hover:text-rose-500 hover:bg-white/5 px-2 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
                      >
                        {reportingId === w._id ? "Reporting..." : "⚑ Report"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && !loading && (
              <button
                onClick={async () => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  await loadConfessions(nextPage, filter);
                }}
                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all tracking-wider font-mono hover:scale-[1.005] cursor-pointer"
              >
                LOAD MORE WHISPERS
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
