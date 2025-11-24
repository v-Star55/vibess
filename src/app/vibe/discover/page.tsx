"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { getVibeMatches, createChat } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { Loader2, MessageCircle, Sparkles, TrendingUp, Zap, Heart } from "lucide-react";
import Image from "next/image";

interface VibeMatch {
  vibeCard: any;
  similarity: number;
  category: string | null;
  breakdown: any;
}

export default function DiscoverVibesPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "moodTwins" | "nearEnergy" | "similarVibes">("all");
  const [matches, setMatches] = useState<{
    all: VibeMatch[];
    moodTwins: VibeMatch[];
    nearEnergy: VibeMatch[];
    similarVibes: VibeMatch[];
  } | null>(null);
  const [myVibe, setMyVibe] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchMatches = async () => {
      try {
        const res = await getVibeMatches();
        if (res.success) {
          setMatches(res.matches);
          setMyVibe(res.myVibe);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error("Create a vibe card first to discover matches!");
          router.push("/vibe/create");
        } else {
          toast.error("Failed to load matches");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user, router]);

  const handleStartChat = async (otherUserId: string) => {
    try {
      const res = await createChat(otherUserId);
      if (res.success) {
        router.push(`/chat/${res.chat._id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start chat");
    }
  };

  const getDisplayMatches = () => {
    if (!matches) return [];
    switch (activeTab) {
      case "moodTwins":
        return matches.moodTwins;
      case "nearEnergy":
        return matches.nearEnergy;
      case "similarVibes":
        return matches.similarVibes;
      default:
        return matches.all;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!matches || matches.all.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No matches yet</h2>
            <p className="text-white/60 mb-6">
              Keep your vibe card active and check back soon!
            </p>
            <button
              onClick={() => router.push("/vibe/create")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Update Your Vibe
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayMatches = getDisplayMatches();

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Your Vibe Matches</h1>
          <p className="text-white/60">
            Connect with people who share your energy and mood
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "all"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All Matches ({matches.all.length})
          </button>
          <button
            onClick={() => setActiveTab("moodTwins")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "moodTwins"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Heart className="w-4 h-4" />
            Mood Twins ({matches.moodTwins.length})
          </button>
          <button
            onClick={() => setActiveTab("nearEnergy")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "nearEnergy"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Zap className="w-4 h-4" />
            Near Your Energy ({matches.nearEnergy.length})
          </button>
          <button
            onClick={() => setActiveTab("similarVibes")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "similarVibes"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Similar Vibes ({matches.similarVibes.length})
          </button>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayMatches.map((match, idx) => {
            const card = match.vibeCard;
            const theme = card.theme;
            const otherUser = card.user;

            return (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl rounded-3xl border-2 p-6 relative overflow-hidden"
                style={{
                  borderColor: theme.borderGlow,
                  backgroundImage: `linear-gradient(to bottom, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  boxShadow: `0 0 20px ${theme.borderGlow}40, 0 0 40px ${theme.borderGlow}20`,
                }}
              >
                {/* Similarity Badge */}
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-semibold">
                  {match.similarity}% match
                </div>

                {/* Category Badge */}
                {match.category && (
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
                    {match.category}
                  </div>
                )}

                {/* User Info */}
                <div className="flex items-center gap-4 mb-4 mt-8">
                  <div
                    className="w-14 h-14 rounded-full border-4 overflow-hidden"
                    style={{ borderColor: theme.borderGlow }}
                  >
                    {otherUser?.profileImage ? (
                      <Image
                        src={otherUser.profileImage}
                        alt={otherUser.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                        {otherUser?.name?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{otherUser?.name}</h3>
                    <p className="text-white/60 text-sm">@{otherUser?.username}</p>
                  </div>
                </div>

                {/* Emoji & Description */}
                <div className="mb-4">
                  <div className="text-6xl mb-2">{card.emoji}</div>
                  <p
                    className="text-2xl font-extrabold leading-tight mb-2"
                    style={{
                      color: theme.accentColor,
                      textShadow: `0 0 15px ${theme.accentColor}40`,
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Energy & Intent Info */}
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-2" style={{ color: theme.accentColor }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={theme.accentColor} strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="font-semibold">Energy: {card.energyLevel || 5}/10</span>
                  </div>
                  {card.currentIntent && card.currentIntent.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {card.currentIntent.map((intent: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded-lg text-xs font-medium bg-white/15 text-white">
                          {intent}
                        </span>
                      ))}
                    </div>
                  )}
                  {card.contextTag && (
                    <p className="text-white/60 text-sm">#{card.contextTag}</p>
                  )}
                  <p className="text-white/50 text-xs">{card.interactionBoundary || "Fast replies"}</p>

                  {/* What I'm Feeling Like Today */}
                  {card.feelingOptions && card.feelingOptions.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>✨</span>
                        Feeling Like
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.feelingOptions.slice(0, 3).map((feeling: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 border border-white/20">
                            {feeling}
                          </span>
                        ))}
                        {card.feelingOptions.length > 3 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                            +{card.feelingOptions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vibe Availability */}
                  {card.vibeAvailability && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>⚡</span>
                        Availability
                      </p>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/15 text-white border border-white/20 inline-block">
                        {card.vibeAvailability}
                      </span>
                    </div>
                  )}

                  {/* Mini Personality Prompt */}
                  {card.personalityPrompt && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>💭</span>
                        Today I feel like...
                      </p>
                      <p className="px-2.5 py-1 rounded-lg text-xs font-medium italic bg-white/15 text-white border border-white/20">
                        {card.personalityPrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleStartChat(otherUser._id)}
                  className="w-full py-3 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold transition-all flex items-center justify-center gap-2 border border-white/30"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Chat
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

