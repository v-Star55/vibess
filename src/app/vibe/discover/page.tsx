"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { getVibeMatches, createChat } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { Loader2, MessageCircle, Sparkles, TrendingUp, Zap, Heart, Users, Sliders, Edit, ExternalLink } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"all" | "moodTwins" | "interestsTwins" | "nearEnergy" | "similarVibes">("all");
  const [matches, setMatches] = useState<{
    all: VibeMatch[];
    moodTwins: VibeMatch[];
    interestsTwins: VibeMatch[];
    nearEnergy: VibeMatch[];
    similarVibes: VibeMatch[];
  } | null>(null);
  const [myVibe, setMyVibe] = useState<any>(null);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

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

  const toggleExpand = (idx: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getDisplayMatches = () => {
    if (!matches) return [];
    switch (activeTab) {
      case "moodTwins":
        return matches.moodTwins;
      case "interestsTwins":
        return matches.interestsTwins || [];
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
      <div className="bg-ink w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65CFF]" />
      </div>
    );
  }

  if (!matches || matches.all.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto main-feed w-full min-h-screen relative">
        <div className="bg-grain" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center relative z-10">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12">
            <Sparkles className="w-16 h-16 text-[#C65CFF] mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bricolage font-bold text-white mb-3">No vibe matches found yet</h2>
            <p className="text-text-dim max-w-md mx-auto mb-8 leading-relaxed">
              Keep your vibe card active, expand your settings, or update your vibe to find connections broadcasting matching energy signals.
            </p>
            <button
              onClick={() => router.push("/vibe/create")}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-[#100C1C] font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#FF5D73]/20 cursor-pointer"
            >
              Update Your Vibe Card
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayMatches = getDisplayMatches();

  return (
    <div className="flex-1 overflow-y-auto main-feed w-full min-h-screen relative scrollbar-thin">
      <div className="bg-grain" />
      
      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bricolage font-extrabold text-white tracking-tight flex items-center gap-3">
              Vibe Matching
              <Sparkles className="w-8 h-8 text-[#C65CFF] animate-pulse" />
            </h1>
            <p className="text-text-dim text-base mt-2 max-w-lg">
              Connect with people who share your energy, emotional state, and conversational goals
            </p>
          </div>
        </div>

        {/* Your Active Vibe Card Banner */}
        {myVibe && (
          <div className="mb-10 p-6 rounded-[28px] border border-white/10 bg-[#17122A] relative overflow-hidden shadow-2xl">
            {/* Background design elements */}
            <div 
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(135deg, ${myVibe.theme?.gradientFrom || '#C65CFF'}, ${myVibe.theme?.gradientTo || '#FF5D73'})`
              }}
            />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C65CFF]/10 to-[#FF5D73]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center text-4xl shadow-xl select-none shrink-0 transition-transform duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${(myVibe.theme?.gradientFrom || '#C65CFF')}30, ${(myVibe.theme?.gradientTo || '#FF5D73')}30)`,
                    border: `1px solid ${myVibe.theme?.borderGlow || '#C65CFF'}40`,
                    boxShadow: `0 8px 24px ${(myVibe.theme?.borderGlow || '#C65CFF')}25`
                  }}
                >
                  <span className="leading-none select-none">{myVibe.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span 
                      className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                      style={{
                        borderColor: `${myVibe.theme?.accentColor || '#FF5D73'}30`,
                        color: myVibe.theme?.accentColor || '#FF5D73',
                        backgroundColor: `${myVibe.theme?.accentColor || '#FF5D73'}15`
                      }}
                    >
                      Broadcasting Live
                    </span>
                    {myVibe.vibeAvailability && (
                      <span 
                        className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                        style={{
                          borderColor: `${myVibe.theme?.accentColor || '#33D6C0'}30`,
                          color: myVibe.theme?.accentColor || '#33D6C0',
                          backgroundColor: `${myVibe.theme?.accentColor || '#33D6C0'}15`
                        }}
                      >
                        ⚡ {myVibe.vibeAvailability}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bricolage font-extrabold text-white leading-tight">
                    "{myVibe.description}"
                  </h2>
                  <p className="text-text-dim text-sm mt-2 flex flex-wrap items-center gap-1.5">
                    <span>Energy Level:</span> 
                    <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md">{myVibe.energyLevel}/10</span> 
                    <span className="text-text-faint">&bull;</span>
                    <span>Boundary:</span> 
                    <span 
                      className="font-bold px-2 py-0.5 rounded-md text-xs"
                      style={{
                        color: myVibe.theme?.accentColor || '#33D6C0',
                        backgroundColor: `${myVibe.theme?.accentColor || '#33D6C0'}10`
                      }}
                    >
                      {myVibe.conversationalPreferences || "Fast replies"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push("/vibe/create")}
                  className="px-5 py-3 rounded-full text-[#100C1C] font-extrabold text-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${myVibe.theme?.gradientFrom || '#FF5D73'}, ${myVibe.theme?.gradientTo || '#C65CFF'})`,
                    boxShadow: `0 6px 20px ${(myVibe.theme?.borderGlow || '#FF5D73')}35`
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Update Vibe
                </button>
                <button
                  onClick={() => router.push("/vibe/heatmap")}
                  className="px-5 py-3 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-white font-extrabold text-sm border border-white/10 hover:border-white/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-text-dim" />
                  View Heatmap
                </button>
              </div>
            </div>
            
            {/* Sub-tags displaying details */}
            {(myVibe.askMeAbout?.length > 0 || myVibe.feelingOptions?.length > 0 || myVibe.personalityPrompt) && (
              <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-xs text-text-dim relative z-10">
                <div className="flex flex-wrap gap-2.5">
                  {myVibe.askMeAbout?.map((item: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                      style={{
                        borderColor: `${myVibe.theme?.accentColor || '#33D6C0'}25`,
                        color: myVibe.theme?.accentColor || '#33D6C0',
                        backgroundColor: `${myVibe.theme?.accentColor || '#33D6C0'}10`
                      }}
                    >
                      💬 {item}
                    </span>
                  ))}
                  {myVibe.feelingOptions?.map((item: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                      style={{
                        borderColor: `${myVibe.theme?.accentColor || '#C65CFF'}25`,
                        color: myVibe.theme?.accentColor || '#C65CFF',
                        backgroundColor: `${myVibe.theme?.accentColor || '#C65CFF'}10`
                      }}
                    >
                      ✨ {item}
                    </span>
                  ))}
                </div>
                {myVibe.personalityPrompt && (
                  <p className="italic text-text-faint">
                    Feeling like <span className="text-text-dim font-medium">{myVibe.personalityPrompt}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs Filter Bar */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`filter-pill ${activeTab === "all" ? "active" : ""}`}
          >
            All Matches ({matches.all.length})
          </button>
          <button
            onClick={() => setActiveTab("moodTwins")}
            className={`filter-pill ${activeTab === "moodTwins" ? "active" : ""}`}
          >
            <Heart className="w-4 h-4" />
            Mood Twins ({matches.moodTwins.length})
          </button>
          <button
            onClick={() => setActiveTab("interestsTwins")}
            className={`filter-pill ${activeTab === "interestsTwins" ? "active" : ""}`}
          >
            <Users className="w-4 h-4" />
            Interest Twins ({matches.interestsTwins?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("nearEnergy")}
            className={`filter-pill ${activeTab === "nearEnergy" ? "active" : ""}`}
          >
            <Zap className="w-4 h-4" />
            Near Energy ({matches.nearEnergy.length})
          </button>
          <button
            onClick={() => setActiveTab("similarVibes")}
            className={`filter-pill ${activeTab === "similarVibes" ? "active" : ""}`}
          >
            <TrendingUp className="w-4 h-4" />
            Similar Vibes ({matches.similarVibes.length})
          </button>
        </div>

        {/* Matches Grid */}
        {displayMatches.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center">
            <Users className="w-12 h-12 text-text-faint mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No matches in this category</h3>
            <p className="text-text-dim max-w-sm mx-auto text-sm">
              Try exploring "All Matches" or adjusting your vibe card settings to see other matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMatches.map((match, idx) => {
              const card = match.vibeCard;
              const theme = card.theme;
              const otherUser = card.user;
              const isExpanded = expandedCards[idx];

              // Colors based on category
              let categoryStyle = "text-[#C65CFF] border-[#C65CFF]/30 bg-[#C65CFF]/10";
              if (match.category === "Mood Twins") {
                categoryStyle = "text-[#FF5D73] border-[#FF5D73]/30 bg-[#FF5D73]/10";
              } else if (match.category === "Interests Twin") {
                categoryStyle = "text-[#33D6C0] border-[#33D6C0]/30 bg-[#33D6C0]/10";
              } else if (match.category === "Near Your Energy") {
                categoryStyle = "text-[#FFB25E] border-[#FFB25E]/30 bg-[#FFB25E]/10";
              }

              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-[24px] border border-[#f3efff]/10 bg-white/[0.02] backdrop-blur-xl p-6 transition-all duration-300 group hover:border-white/20 flex flex-col justify-between"
                  style={{
                    boxShadow: `0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                  }}
                >
                  {/* Theme Gradient Overlay */}
                  <div 
                    className="absolute inset-0 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09] pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`
                    }}
                  />

                  {/* Glow Effect on Hover */}
                  <div 
                    className="absolute -inset-px rounded-[24px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                    style={{
                      border: `1px solid ${theme.borderGlow}`,
                      boxShadow: `0 0 20px ${theme.borderGlow}15, inset 0 0 10px ${theme.borderGlow}08`
                    }}
                  />

                  <div>
                    {/* Top Badges Row */}
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      {match.category ? (
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryStyle}`}>
                          {match.category}
                        </div>
                      ) : (
                        <div />
                      )}

                      <div 
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          match.similarity >= 90 
                            ? "bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-[#100C1C] border-transparent shadow-[0_0_12px_rgba(255,93,115,0.4)]"
                            : "bg-[#1d1633]/85 text-[#F3EFFF] border-white/10"
                        }`}
                      >
                        {match.similarity}% match
                      </div>
                    </div>

                    {/* User Info Header */}
                    <div className="flex items-center gap-4 mb-5 relative z-10">
                      <div
                        className="relative w-14 h-14 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-[#100C1C] overflow-hidden border-2 border-[#100C1C]">
                          {otherUser?.profileImage ? (
                            <Image
                              src={otherUser.profileImage}
                              alt={otherUser.name || "User"}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#FF5D73] to-[#C65CFF] flex items-center justify-center text-white text-xl font-bold font-bricolage">
                              {otherUser?.name?.[0] || "U"}
                            </div>
                          )}
                        </div>
                        {/* Custom status glow dot */}
                        <span 
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#100C1C]"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-white font-bricolage font-bold text-base leading-tight truncate">
                          {otherUser?.name}
                        </h3>
                        <p className="text-text-faint text-xs font-semibold truncate mt-0.5">
                          @{otherUser?.username}
                        </p>
                      </div>
                    </div>

                    {/* Emoji & Description Bubble */}
                    <div className="mb-5 relative z-10 flex gap-4 items-center">
                      <div className="text-5xl select-none shrink-0 transition-transform duration-500 group-hover:-translate-y-1">
                        {card.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-lg font-bricolage font-extrabold leading-snug tracking-tight text-white line-clamp-2"
                          style={{
                            textShadow: `0 0 20px ${theme.accentColor}10`
                          }}
                        >
                          "{card.description}"
                        </p>
                        {card.contextTag && (
                          <span className="inline-block text-[11px] font-bold text-[#33D6C0] mt-0.5">
                            #{card.contextTag}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Personality Signal */}
                    {card.personalityPrompt && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-4 relative z-10">
                        <p className="text-text-faint text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span style={{ color: theme.accentColor }}>💭</span>
                          Today I feel like...
                        </p>
                        <p className="text-text-dim text-xs italic leading-relaxed">
                          "{card.personalityPrompt}"
                        </p>
                      </div>
                    )}

                    {/* Status & Attributes */}
                    <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                      {card.vibeAvailability && (
                        <span 
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border"
                          style={{ 
                            borderColor: `${theme.accentColor}30`, 
                            color: theme.accentColor,
                            backgroundColor: `${theme.accentColor}10`
                          }}
                        >
                          ⚡ {card.vibeAvailability}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-white/10 bg-white/[0.01] text-text-dim">
                        💬 {card.conversationalPreferences || "Fast replies"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-white/10 bg-white/[0.01] text-text-dim">
                        🏃 Energy {card.energyLevel || 5}/10
                      </span>
                    </div>

                    {/* Tags */}
                    {(card.askMeAbout?.length > 0 || card.feelingOptions?.length > 0) && (
                      <div className="space-y-3 mb-5 relative z-10">
                        {card.askMeAbout?.length > 0 && (
                          <div>
                            <p className="text-text-faint text-[9px] font-bold uppercase tracking-wider mb-1.5">Ask me about</p>
                            <div className="flex flex-wrap gap-1.5">
                              {card.askMeAbout.map((item: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#33D6C0]/10 text-[#33D6C0] border border-[#33D6C0]/20">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {card.feelingOptions?.length > 0 && (
                          <div>
                            <p className="text-text-faint text-[9px] font-bold uppercase tracking-wider mb-1.5">Feeling like</p>
                            <div className="flex flex-wrap gap-1.5">
                              {card.feelingOptions.map((item: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C65CFF]/10 text-[#C65CFF] border border-[#C65CFF]/20">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chemistry Breakdown Accordion */}
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full py-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-text-dim text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative z-10 mb-4 cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide Chemistry Detail" : "View Chemistry Detail"}</span>
                      <Sliders className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && match.breakdown && (
                      <div className="border-t border-white/5 pt-4 pb-2 mb-4 relative z-10 space-y-3.5 animate-fadeIn">
                        {/* Visual Bar Chart of Similarity */}
                        <div className="space-y-2.5">
                          {/* Mood similarity */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-text-faint uppercase">Mood Similarity</span>
                              <span style={{ color: theme.accentColor }}>{match.breakdown.mood}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${match.breakdown.mood}%`,
                                  backgroundColor: theme.accentColor
                                }}
                              />
                            </div>
                          </div>

                          {/* Energy level compatibility */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-text-faint uppercase">Energy Compatibility</span>
                              <span className="text-[#FFB25E]">{match.breakdown.energyLevel || match.breakdown.energy}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-yellow-300"
                                style={{ width: `${match.breakdown.energyLevel || match.breakdown.energy}%` }}
                              />
                            </div>
                          </div>

                          {/* Positivity alignment */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-text-faint uppercase">Positivity Alignment</span>
                              <span className="text-[#FF5D73]">{match.breakdown.positivity}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-[#FF5D73]"
                                style={{ width: `${match.breakdown.positivity}%` }}
                              />
                            </div>
                          </div>

                          {/* Intent alignment */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-text-faint uppercase">Intent Compatibility</span>
                              <span className="text-[#33D6C0]">{match.breakdown.intent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-[#33D6C0]"
                                style={{ width: `${match.breakdown.intent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Chemistry Bonuses */}
                        {(match.breakdown.interestsBonus > 0 || 
                          match.breakdown.hobbiesBonus > 0 || 
                          match.breakdown.personalityBonus > 0 || 
                          match.breakdown.feelingsBonus > 0 || 
                          match.breakdown.proximityBonus > 0 || 
                          match.breakdown.contextBonus > 0) && (
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold text-text-faint uppercase tracking-wider mb-2">Vibe Bonuses</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {match.breakdown.proximityBonus > 0 && (
                                <span className="text-[10px] font-semibold text-[#33D6C0] bg-[#33D6C0]/5 px-2 py-1 rounded-md border border-[#33D6C0]/10 flex items-center justify-between">
                                  <span>📍 Nearby</span>
                                  <span>+{match.breakdown.proximityBonus}%</span>
                                </span>
                              )}
                              {match.breakdown.interestsBonus > 0 && (
                                <span className="text-[10px] font-semibold text-[#FF5D73] bg-[#FF5D73]/5 px-2 py-1 rounded-md border border-[#FF5D73]/10 flex items-center justify-between">
                                  <span>🎨 Hobbies</span>
                                  <span>+{match.breakdown.interestsBonus}%</span>
                                </span>
                              )}
                              {match.breakdown.personalityBonus > 0 && (
                                <span className="text-[10px] font-semibold text-[#C65CFF] bg-[#C65CFF]/5 px-2 py-1 rounded-md border border-[#C65CFF]/10 flex items-center justify-between">
                                  <span>🧠 Personality</span>
                                  <span>+{match.breakdown.personalityBonus}%</span>
                                </span>
                              )}
                              {match.breakdown.feelingsBonus > 0 && (
                                <span className="text-[10px] font-semibold text-[#FFB25E] bg-[#FFB25E]/5 px-2 py-1 rounded-md border border-[#FFB25E]/10 flex items-center justify-between">
                                  <span>✨ Mood Sync</span>
                                  <span>+{match.breakdown.feelingsBonus}%</span>
                                </span>
                              )}
                              {match.breakdown.contextBonus > 0 && (
                                <span className="text-[10px] font-semibold text-[#33D6C0] bg-[#33D6C0]/5 px-2 py-1 rounded-md border border-[#33D6C0]/10 flex items-center justify-between">
                                  <span>#️⃣ Tag Match</span>
                                  <span>+{match.breakdown.contextBonus}%</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Start Chat Button */}
                  <button
                    onClick={() => handleStartChat(otherUser._id)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-[#100C1C] hover:opacity-90 font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 relative z-10 cursor-pointer shadow-[0_4px_18px_rgba(255,93,115,0.22)] hover:shadow-[0_6px_22px_rgba(255,93,115,0.32)] active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    Start Chatting
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
