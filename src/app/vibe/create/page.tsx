"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { createVibeCard, getMyVibeCard, enhanceVibeDescriptionAI } from "../../lib/vibeApi";
import { setVibeLastUpdated } from "../../lib/vibeRefresh";
import toast from "react-hot-toast";
import { Sparkles, Loader2, Zap, Target, Tag, MessageSquare, Wand2, Flame } from "lucide-react";
import { generateTheme } from "../../lib/themeGenerator";
import { getEmotionCategory } from "../../lib/vibeMatching";

const EMOJI_OPTIONS = [
  "😊", "😄", "😃", "😁", "😆", "🥳", "😎", "🤩",
  "😢", "😭", "😔", "😞", "😟", "😕", "🙁", "☹️",
  "😌", "😴", "😑", "😐", "🙂", "🧘", "🌊",
  "🔥", "💯", "⚡", "🚀", "💪", "🎉", "✨", "🌟",
  "🎨", "🎭", "🎪", "🎬", "📝", "✍️", "💡", "🧠",
  "👥", "🤝", "💬", "🎤", "🎵", "🎶", "🎧", "📱",
  "💔", "🌙", "❤️", "💕", "💖", "💗", "💓",
  "😍", "🥰", "😘", "😠", "😡", "🤬", "💢", "😤",
];

export default function CreateVibePage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [emoji, setEmoji] = useState("😊");
  const [description, setDescription] = useState("");
  const [energyLevel, setEnergyLevel] = useState(5);
  const [currentIntent, setCurrentIntent] = useState<string[]>([]);
  const [contextTag, setContextTag] = useState("");
  const [conversationalPreferences, setConversationalPreferences] = useState("Fast replies");
  const [askMeAbout, setAskMeAbout] = useState<string[]>([]);
  const [feelingOptions, setFeelingOptions] = useState<string[]>([]);
  const [vibeAvailability, setVibeAvailability] = useState("");
  const [personalityPrompt, setPersonalityPrompt] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const INTENT_OPTIONS = [
    "Chill conversation",
    "Make a friend",
    "Share thoughts",
    "Rant / vent",
    "Get motivated",
    "Need advice",
    "Want to laugh",
    "No talking, just vibe",
    "Gaming buddy",
    "Travel buddy",
    "Study together",
    "Deep conversations",
  ];

  const CONTEXT_TAG_OPTIONS = [
    "Work", "Studies", "Family", "Love", "Health", "Money", "Creativity", "Social life"
  ];

  const CONVERSATIONAL_PREFERENCES_OPTIONS = [
    "Fast replies",
    "Slow replies",
    "Short messages only",
    "Voice notes okay",
    "Light and fun only",
  ];

  const ASK_ME_ABOUT_OPTIONS = [
    "Anime",
    "Travel",
    "Food",
    "Music",
    "movie",
    "Coding",
    "startups",
    "photography",
    "sports",
    "art",
  ];

  const FEELING_OPTIONS = [
    "Let's laugh",
    "Talk nonsense",
    "Brain dump",
    "Share thoughts",
    "Deep talk maybe",
    "Annoy me playfully",
    "Just existing",
    "Feeling goofy",
    "Meme-only mode",
    "Soft and quiet",
    "Cozy vibes only",
    "Low battery mood",
    "Here but not here",
    "Social but awkward",
    "Ready for chaos",
    "Slow and gentle",
    "Need a little comfort",
    "Curious about your life",
    "Friendly but introverted",
    "Creative spark mode",
  ];

  const VIBE_AVAILABILITY_OPTIONS = [
    "Down to vibe",
    "Chill mode",
    "Hyper mood",
    "Only light talk",
    "Busy but around",
  ];

  const PERSONALITY_PROMPT_OPTIONS = [
    "a sleepy panda",
    "a cozy cat",
    "a chaotic squirrel",
    "a confused potato",
    "a dramatic peacock",
    "a low-battery robot",
    "a phone stuck at 1%",
    "a browser with 50 tabs open",
    "a glitching NPC",
    "a warm cinnamon roll",
    "a tiny hedgehog hiding in a blanket",
    "a floating cloud",
    "a wandering jellyfish",
    "a lone firefly looking for light (lonely)",
    "a puzzle piece that doesn't fit today (emotionally off)",
  ];

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch existing vibe card
    const fetchVibe = async () => {
      try {
        const res = await getMyVibeCard();
        if (res.success && res.vibeCard) {
          const v = res.vibeCard;
          setEmoji(v.emoji);
          setDescription(v.description);
          setEnergyLevel(v.energyLevel || 5);
          setCurrentIntent(v.currentIntent || []);
          setContextTag(v.contextTag || "");
          setConversationalPreferences(v.conversationalPreferences || v.interactionBoundary || "Fast replies");
          setAskMeAbout(v.askMeAbout || []);
          setFeelingOptions(v.feelingOptions || []);
          setVibeAvailability(v.vibeAvailability || "");
          setPersonalityPrompt(v.personalityPrompt || "");
        }
      } catch (error) {
        // No existing vibe card, that's fine
      } finally {
        setFetching(false);
      }
    };

    fetchVibe();

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
          // Location denied or unavailable
        }
      );
    }
  }, [user, router]);

  const wordCount = description.trim().split(/\s+/).filter((w) => w).length;

  const handleGetAISuggestions = async () => {
    if (!description || description.trim().split(/\s+/).filter((w) => w).length < 2) {
      toast.error("Enter at least 2 words to get AI suggestions");
      return;
    }

    if (currentIntent.length === 0) {
      toast.error("Please select at least one intent first");
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await enhanceVibeDescriptionAI({
        emoji,
        description,
        energyLevel,
        currentIntent,
      });
      
      if (res.success && res.suggestions && res.suggestions.length > 0) {
        setAiSuggestions(res.suggestions);
        toast.success("AI suggestions generated! ✨");
      } else {
        toast.error("No suggestions available");
      }
    } catch (error: any) {
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wordCount < 2 || wordCount > 8) {
      toast.error("Description must be between 2 and 8 words");
      return;
    }

    if (currentIntent.length === 0) {
      toast.error("Please select at least one intent");
      return;
    }

    if (currentIntent.length > 2) {
      toast.error("Please select at most 2 intents");
      return;
    }

    setLoading(true);
    try {
      // Always send the new fields, even if empty
      const vibeData: any = {
        emoji,
        description: description.trim(),
        energyLevel,
        currentIntent,
        contextTag: contextTag.trim() || undefined,
        conversationalPreferences,
        askMeAbout,
        feelingOptions: Array.isArray(feelingOptions) ? feelingOptions : [],
        vibeAvailability: vibeAvailability || "",
        personalityPrompt: personalityPrompt || "",
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
      };
      
      const res = await createVibeCard(vibeData);

      if (res.success) {
        setVibeLastUpdated(); // Set refresh timestamp
        toast.success("Vibe card created successfully! 🎉");
        router.push("/vibe/discover");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create vibe card");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Calculate live preview theme based on state variables
  const previewTheme = generateTheme("general", energyLevel * 10, emoji);

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent text-[#F3EFFF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto pb-16">
        
        {/* Main Header (Outside of containers) */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold font-bricolage bg-gradient-to-r from-[#C65CFF] via-[#FF5D73] to-[#FFB25E] bg-clip-text text-transparent tracking-tight">
            Share Your Today's Vibe
          </h1>
          <p className="mt-2 text-xs md:text-sm text-[#B3A7CE] font-medium leading-relaxed max-w-xl mx-auto">
            Update your vibe card to match with people of similar energy and discover fresh connections.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          
          {/* Left Side: Form inputs */}
          <div className="flex-1 w-full bg-white/[0.03] backdrop-blur-xl rounded-[28px] p-6 md:p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Emoji Selection */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  1. How do you feel? (Select an Emoji)
                </label>
                <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-4 bg-white/[0.02] rounded-2xl border border-white/5 scrollbar-thin">
                  {EMOJI_OPTIONS.map((e) => {
                    const isSelected = emoji === e;
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-11 h-11 text-xl flex items-center justify-center rounded-xl transition-all duration-200 ${
                          isSelected
                            ? "bg-[#C65CFF]/20 border-[#C65CFF] text-white shadow-[0_0_15px_rgba(198,92,255,0.4)] scale-110"
                            : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:scale-105"
                        }`}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono">
                    2. Vibe Description (2-8 words)
                  </label>
                  <button
                    type="button"
                    onClick={handleGetAISuggestions}
                    disabled={loadingSuggestions || !description || description.trim().split(/\s+/).filter((w) => w).length < 2 || currentIntent.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C65CFF]/20 to-[#FF5D73]/20 hover:from-[#C65CFF]/30 hover:to-[#FF5D73]/30 border border-[#C65CFF]/30 rounded-lg text-purple-300 text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loadingSuggestions ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3 text-[#C65CFF]" />
                        Get AI Suggestions
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setAiSuggestions([]); // Clear suggestions when user types
                  }}
                  placeholder="e.g., Feeling great today"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#C65CFF] focus:border-[#C65CFF] resize-none text-sm transition-all"
                  rows={3}
                  maxLength={60}
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <p className="text-[#7C7196]">
                    {wordCount} / 8 words
                  </p>
                  {wordCount < 2 && (
                    <p className="text-[#FFB25E] font-medium">
                      Need at least 2 words
                    </p>
                  )}
                  {wordCount > 8 && (
                    <p className="text-[#FF5D73] font-medium">
                      Maximum 8 words
                    </p>
                  )}
                </div>
                
                {/* AI Suggestions */}
                {aiSuggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C65CFF]" />
                      <p className="text-white/70 text-xs font-semibold">AI Suggestions:</p>
                    </div>
                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion, idx) => {
                        const suggestionWordCount = suggestion.trim().split(/\s+/).filter((w) => w).length;
                        const isValid = suggestionWordCount >= 2 && suggestionWordCount <= 8;
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setDescription(suggestion);
                              setAiSuggestions([]);
                              toast.success("Description updated!");
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-white text-sm border transition-all ${
                              isValid
                                ? "bg-white/5 hover:bg-white/10 border-white/20 hover:border-[#C65CFF]/50"
                                : "bg-white/5 border-yellow-500/30 opacity-70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span>{suggestion}</span>
                              {!isValid && (
                                <span className="text-xs text-yellow-400 whitespace-nowrap">
                                  ({suggestionWordCount} words)
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  3. Energy Level: <span style={{ color: previewTheme.accentColor }} className="font-bold text-sm">{energyLevel}/10</span>
                </label>
                <div className="space-y-2 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C65CFF]"
                  />
                  <div className="flex justify-between text-[11px] text-[#7C7196] font-medium">
                    <span>Low (calm/drained)</span>
                    <span>High (excited/hyper)</span>
                  </div>
                  <div className="text-xs font-semibold text-[#B3A7CE] mt-2 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#FF5D73]" />
                    {energyLevel <= 3 && "Low-energy / calm / drained"}
                    {energyLevel > 3 && energyLevel <= 6 && "Moderate energy"}
                    {energyLevel > 6 && energyLevel <= 8 && "Active / excited"}
                    {energyLevel > 8 && "Super active / excited / hyper"}
                  </div>
                </div>
              </div>

              {/* Current Intent */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  4. Current Intent (choose 1-2)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {INTENT_OPTIONS.map((intent) => {
                    const isSelected = currentIntent.includes(intent);
                    return (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => {
                          if (currentIntent.includes(intent)) {
                            setCurrentIntent(currentIntent.filter((i) => i !== intent));
                          } else if (currentIntent.length < 2) {
                            setCurrentIntent([...currentIntent, intent]);
                          } else {
                            toast.error("You can only select up to 2 intents");
                          }
                        }}
                        className={`px-3 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 text-center ${
                          isSelected
                            ? "bg-[#C65CFF]/15 border-[#C65CFF] text-white shadow-[0_0_15px_rgba(198,92,255,0.25)] scale-102"
                            : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {intent}
                      </button>
                    );
                  })}
                </div>
                {currentIntent.length > 0 && (
                  <p className="mt-2.5 text-xs text-[#7C7196] font-medium">
                    Selected: {currentIntent.join(", ")}
                  </p>
                )}
              </div>

              {/* Ask me about... */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  5. Ask me about... (choose up to 3)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {ASK_ME_ABOUT_OPTIONS.map((item) => {
                    const isSelected = askMeAbout.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setAskMeAbout(askMeAbout.filter((a) => a !== item));
                          } else if (askMeAbout.length < 3) {
                            setAskMeAbout([...askMeAbout, item]);
                          } else {
                            toast.error("You can select up to 3 options");
                          }
                        }}
                        className={`px-3 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 text-center ${
                          isSelected
                            ? "bg-[#33D6C0]/15 border-[#33D6C0] text-white shadow-[0_0_15px_rgba(51,214,192,0.25)] scale-102"
                            : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                {askMeAbout.length > 0 && (
                  <p className="mt-2.5 text-xs text-[#7C7196] font-medium">
                    Selected: {askMeAbout.join(", ")}
                  </p>
                )}
              </div>

              {/* Context Tag */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  6. Context Tag (optional - 1 word)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {CONTEXT_TAG_OPTIONS.map((tag) => {
                    const isSelected = contextTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setContextTag(contextTag === tag ? "" : tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
                          isSelected
                            ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF]"
                            : "bg-white/[0.03] border-white/5 text-[#B3A7CE] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={contextTag}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value.split(/\s+/).length <= 1) {
                      setContextTag(value);
                    }
                  }}
                  placeholder="Or type your own (1 word)"
                  maxLength={20}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#C65CFF] focus:border-[#C65CFF] text-sm transition-all"
                />
              </div>

              {/* Conversational Preferences */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  7. Conversational Preferences
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {CONVERSATIONAL_PREFERENCES_OPTIONS.map((preference) => {
                    const isSelected = conversationalPreferences === preference;
                    return (
                      <button
                        key={preference}
                        type="button"
                        onClick={() => setConversationalPreferences(preference)}
                        className={`px-3 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 text-center ${
                          isSelected
                            ? "bg-[#C65CFF]/15 border-[#C65CFF] text-white shadow-[0_0_15px_rgba(198,92,255,0.25)] scale-102"
                            : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {preference}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What I'm Feeling Like Today */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  8. What I'm Feeling Like Today (select any)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-4 bg-white/[0.01] rounded-2xl border border-white/5 scrollbar-thin">
                  {FEELING_OPTIONS.map((feeling) => {
                    const isSelected = feelingOptions.includes(feeling);
                    return (
                      <button
                        key={feeling}
                        type="button"
                        onClick={() => {
                          if (feelingOptions.includes(feeling)) {
                            setFeelingOptions(feelingOptions.filter((f) => f !== feeling));
                          } else {
                            setFeelingOptions([...feelingOptions, feeling]);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 text-left ${
                          isSelected
                            ? "bg-[#C65CFF]/15 border-[#C65CFF] text-white shadow-[0_0_10px_rgba(198,92,255,0.2)]"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {feeling}
                      </button>
                    );
                  })}
                </div>
                {feelingOptions.length > 0 && (
                  <p className="mt-2 text-xs text-[#7C7196]">
                    Selected: {feelingOptions.join(", ")}
                  </p>
                )}
              </div>

              {/* Vibe Availability */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  9. Vibe Availability
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {VIBE_AVAILABILITY_OPTIONS.map((availability) => {
                    const isSelected = vibeAvailability === availability;
                    return (
                      <button
                        key={availability}
                        type="button"
                        onClick={() => setVibeAvailability(vibeAvailability === availability ? "" : availability)}
                        className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 text-center ${
                          isSelected
                            ? "bg-[#C65CFF]/15 border-[#C65CFF] text-white shadow-[0_0_15px_rgba(198,92,255,0.25)] scale-102"
                            : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {availability}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini Personality Prompt */}
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider font-mono mb-3">
                  10. Today I feel like... (optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-4 bg-white/[0.01] rounded-2xl border border-white/5 scrollbar-thin">
                  {PERSONALITY_PROMPT_OPTIONS.map((prompt) => {
                    const isSelected = personalityPrompt === prompt;
                    return (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setPersonalityPrompt(personalityPrompt === prompt ? "" : prompt)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all text-left italic ${
                          isSelected
                            ? "bg-[#C65CFF]/15 border-[#C65CFF] text-white shadow-[0_0_10px_rgba(198,92,255,0.2)]"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {prompt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || wordCount < 2 || wordCount > 8}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#33D6C0] to-[#C65CFF] hover:opacity-95 text-[#100C1C] font-extrabold text-base transition-all duration-300 shadow-[0_0_20px_rgba(198,92,255,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#100C1C]" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#100C1C]" />
                    Create Vibe Card
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Side: Sticky Live Preview Vibe Card (Small Vibe Card layout mirroring the sidebar) */}
          <div className="w-full lg:w-[280px] lg:sticky lg:top-8 shrink-0 flex flex-col items-center gap-4 select-none">
            <div className="flex items-center gap-2 self-start ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#33D6C0] animate-pulse" />
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider font-mono">Live Preview</p>
            </div>

            <div
              className="w-full rounded-3xl p-5 border-2 relative overflow-hidden text-white transition-all duration-300"
              style={{
                borderColor: previewTheme.borderGlow,
                backgroundImage: `linear-gradient(135deg, ${previewTheme.gradientFrom}, ${previewTheme.gradientTo})`,
                boxShadow: `0 0 30px ${previewTheme.borderGlow}40`
              }}
            >
              {/* Glow effect */}
              <div className="absolute -top-[30%] -right-[15%] w-48 h-48 bg-radial from-white/10 to-transparent pointer-events-none" />

              {/* Emoji & Label */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="text-4xl">{emoji}</div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 font-mono">ACTIVE VIBE</span>
              </div>

              {/* Description */}
              <p className="font-extrabold text-lg leading-snug mb-4 relative z-10 break-words">
                {description || "Feeling good"}
              </p>

              {/* Energy level */}
              <div className="flex flex-col gap-1.5 mb-4 relative z-10">
                <div className="flex justify-between text-[10px] font-semibold text-white/80">
                  <span>Energy Level</span>
                  <span>{energyLevel}/10</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${energyLevel * 10}%`,
                      backgroundColor: previewTheme.accentColor
                    }}
                  />
                </div>
              </div>

              {/* Intents */}
              {currentIntent.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                  {currentIntent.map((intent, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white/15 text-white"
                    >
                      {intent}
                    </span>
                  ))}
                </div>
              )}

              {/* Context tag */}
              {contextTag && (
                <div className="mb-4 relative z-10">
                  <span className="text-xs font-semibold text-white/80">#{contextTag}</span>
                </div>
              )}

              {/* Conversational Preferences */}
              <div className="text-[11px] text-white/60 mb-4 relative z-10">
                {conversationalPreferences}
              </div>

              {/* Divider */}
              {(askMeAbout.length > 0 || feelingOptions.length > 0 || vibeAvailability || personalityPrompt) && (
                <div className="h-px bg-white/10 my-3 relative z-10" />
              )}

              {/* Ask me about... */}
              {askMeAbout.length > 0 && (
                <div className="mb-3 relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Ask me about...</span>
                  <div className="flex flex-wrap gap-1">
                    {askMeAbout.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#33D6C0]/15 text-[#33D6C0] border border-[#33D6C0]/25"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feeling Options */}
              {feelingOptions.length > 0 && (
                <div className="mb-3 relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Feeling Like</span>
                  <div className="flex flex-wrap gap-1">
                    {feelingOptions.slice(0, 3).map((feeling, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-white/90 border border-white/20"
                      >
                        {feeling}
                      </span>
                    ))}
                    {feelingOptions.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/5 text-white/50">
                        +{feelingOptions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              {vibeAvailability && (
                <div className="mb-3 relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Availability</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-white/10 border border-white/15">
                    {vibeAvailability}
                  </span>
                </div>
              )}

              {/* Personality Prompt */}
              {personalityPrompt && (
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Today I feel like...</span>
                  <span className="text-[11px] italic text-white/80 block bg-white/5 rounded-lg p-2 border border-white/10">
                    {personalityPrompt}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
