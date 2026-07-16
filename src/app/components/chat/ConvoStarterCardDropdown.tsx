"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { getUserProfileDetails } from "../../lib/api";

interface ConvoStarterCardDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const STARTERS_MAPPING: Record<string, { label: string; icon: string }> = {
  favoriteMovie: { label: "Favorite Movie", icon: "🎬" },
  favoriteSeries: { label: "Favorite Series", icon: "📺" },
  lastMovieWatched: { label: "Last Movie Watched", icon: "🍿" },
  favoriteAnime: { label: "Favorite Anime", icon: "🍥" },
  favoriteSuperhero: { label: "Favorite Superhero", icon: "🦸‍♂️" },
  favoriteGame: { label: "Favorite Game", icon: "🎮" },
  songOnRepeat: { label: "Song on Repeat", icon: "🎧" },
  favoriteArtistBand: { label: "Favorite Artist/Band", icon: "🎸" },
  favoriteBook: { label: "Favorite Book", icon: "📚" },
  favoritePodcast: { label: "Favorite Podcast", icon: "🎙" },

  threeWordsDescribeMe: { label: "Three words that describe me", icon: "😄" },
  nightOwlEarlyBird: { label: "Night Owl or Early Bird?", icon: "🌙" },
  coffeeOrTea: { label: "Coffee or Tea?", icon: "☕" },
  mountainsOrBeach: { label: "Mountains or Beach?", icon: "🏖" },
  catOrDog: { label: "Cat or Dog?", icon: "🐶" },
  sweetOrSpicy: { label: "Sweet or Spicy?", icon: "🍕" },
  introvertExtrovertAmbivert: { label: "Introvert / Extrovert / Ambivert", icon: "🎨" },
  biggestGreenFlag: { label: "Biggest Green Flag", icon: "🟩" },
  biggestRedFlag: { label: "Biggest Red Flag", icon: "🚩" },
  myToxicTrait: { label: "My toxic trait is...", icon: "😂" },

  favoriteCuisine: { label: "Favorite Cuisine", icon: "🍜" },
  goToMidnightSnack: { label: "Go-to Midnight Snack", icon: "🍪" },
  favoriteFastFood: { label: "Favorite Fast Food", icon: "🍔" },

  dreamDestination: { label: "Dream Destination", icon: "✈" },
  mostBeautifulPlaceBeen: { label: "Most Beautiful Place I've Been", icon: "🏞" },
  nextTrip: { label: "Next Trip", icon: "🎒" },
  windowOrAisle: { label: "Window or Aisle seat?", icon: "💺" },

  ifOneCroreToday: { label: "If you had ₹1 Crore today...", icon: "💰" },
  zombieApocalypseRole: { label: "Zombie apocalypse role?", icon: "🧟‍♂️" },
  fictionalCharacter: { label: "Which fictional character are you?", icon: "🦸‍♀️" },
  neverGetTiredOf: { label: "One thing you'll never get tired of?", icon: "✨" },
  lifeTitle: { label: "If your life had a title?", icon: "📖" },
  mostEmbarrassingMoment: { label: "Most embarrassing moment?", icon: "😳" },
  lastThingLaugh: { label: "Last thing that made you laugh?", icon: "😆" },
  conspiracyTheoryBelieve: { label: "One conspiracy theory you kinda believe", icon: "👽" },
  dinnerWithAnyone: { label: "If you could have dinner with anyone?", icon: "🍽" },

  favoriteLanguage: { label: "Favorite Programming Language", icon: "💻" },
  dreamCompany: { label: "Dream Company", icon: "🏢" },
  currentSideProject: { label: "Current Side Project", icon: "🚀" },
  vsCodeTheme: { label: "VS Code Theme", icon: "🎨" },
  tabsVsSpaces: { label: "Tabs vs Spaces 😈", icon: "😈" },
  coffeeWhileCoding: { label: "Coffee while coding?", icon: "☕" }
};

export default function ConvoStarterCardDropdown({
  isOpen,
  onClose,
  userId,
}: ConvoStarterCardDropdownProps) {
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setLoading(true);
      const fetchDetails = async () => {
        try {
          const res = await getUserProfileDetails(userId);
          if (res?.success) {
            setProfileDetails(res.profileDetails || {});
          }
        } catch (err) {
          console.error("Error loading profile details for dropdown:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, userId]);

  if (!isOpen && !isAnimating) return null;

  // Determine if there are any valid text entries
  const hasTextDetails = profileDetails
    ? Object.keys(STARTERS_MAPPING).some((field) => {
        const val = profileDetails[field];
        return val && typeof val === "string" && val.trim() !== "";
      })
    : false;

  const hasHobbies = profileDetails?.hobbies && profileDetails.hobbies.length > 0;
  const hasPersonalities = profileDetails?.personalities && profileDetails.personalities.length > 0;
  const hasAnyDetails = hasTextDetails || hasHobbies || hasPersonalities;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full left-0 right-0 z-40 bg-[#100c1c]/45 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col max-h-[60vh] ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
      onTransitionEnd={() => {
        if (!isOpen) setIsAnimating(false);
      }}
      style={{
        animation: isOpen ? "slideDownDropdown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none"
      }}
    >
      <style>{`
        @keyframes slideDownDropdown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Glow effect lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C65CFF]/30 to-transparent" />

      {/* Dropdown Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-white/80 font-bold text-xs uppercase tracking-widest font-mono">
            Conversation Starters
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/50 hover:text-white transition-all duration-200 cursor-pointer"
          title="Close card"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            <p className="text-white/35 text-[11px] tracking-wider animate-pulse font-mono">
              Loading starters...
            </p>
          </div>
        ) : !hasAnyDetails ? (
          <div className="text-center py-10 px-4 space-y-3">
            <span className="text-2xl block">❄️</span>
            <div className="space-y-1">
              <p className="text-white/70 font-semibold text-xs">No starters configured</p>
              <p className="text-white/35 text-[11px] leading-relaxed max-w-xs mx-auto">
                This participant hasn't set any icebreakers yet. Send them a wave to start talking!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Answered Prompts Grid */}
            {hasTextDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(STARTERS_MAPPING).map((field) => {
                  const value = profileDetails[field];
                  if (value && typeof value === "string" && value.trim() !== "") {
                    const mapping = STARTERS_MAPPING[field];
                    return (
                      <div
                        key={field}
                        className="bg-white/[0.02] hover:bg-white/[0.04] p-3.5 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-all duration-200"
                      >
                        <span className="text-[#7C7196] block text-[9.5px] font-bold uppercase tracking-wider mb-1">
                          {mapping.icon} {mapping.label}
                        </span>
                        <span className="text-[#F3EFFF] text-xs font-semibold leading-relaxed">
                          {value}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Hobbies Section */}
            {hasHobbies && (
              <div className="space-y-2">
                <h4 className="text-[9.5px] uppercase font-bold tracking-widest text-[#7C7196]">
                  🎨 Hobbies & Interests
                </h4>
                <div className="flex flex-wrap gap-1.5 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.04]">
                  {profileDetails.hobbies.map((hobby: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#C65CFF]/10 text-[#C65CFF] border border-[#C65CFF]/20 text-[9.5px] px-3 py-0.5 rounded-full font-bold"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality Traits */}
            {hasPersonalities && (
              <div className="space-y-2">
                <h4 className="text-[9.5px] uppercase font-bold tracking-widest text-[#7C7196]">
                  🧠 Personality Traits
                </h4>
                <div className="flex flex-wrap gap-1.5 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.04]">
                  {profileDetails.personalities.map((trait: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#33D6C0]/10 text-[#33D6C0] border border-[#33D6C0]/20 text-[9.5px] px-3 py-0.5 rounded-full font-bold"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
