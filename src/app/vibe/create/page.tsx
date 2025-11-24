"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { createVibeCard, getMyVibeCard, enhanceVibeDescriptionAI } from "../../lib/vibeApi";
import { setVibeLastUpdated } from "../../lib/vibeRefresh";
import toast from "react-hot-toast";
import { Sparkles, Loader2, Zap, Target, Tag, MessageSquare, Wand2 } from "lucide-react";

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
  const [interactionBoundary, setInteractionBoundary] = useState("Fast replies");
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
  ];

  const CONTEXT_TAG_OPTIONS = [
    "Work", "Studies", "Family", "Love", "Health", "Money", "Creativity", "Social life"
  ];

  const INTERACTION_BOUNDARY_OPTIONS = [
    "Fast replies",
    "Slow replies",
    "Short messages only",
    "Voice notes okay",
    "Deep conversations",
    "Light and fun only",
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
          setInteractionBoundary(v.interactionBoundary || "Fast replies");
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
        interactionBoundary,
        feelingOptions: Array.isArray(feelingOptions) ? feelingOptions : [],
        vibeAvailability: vibeAvailability || "",
        personalityPrompt: personalityPrompt || "",
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
      };
      
      console.log("Sending vibe card data:", {
        feelingOptions: vibeData.feelingOptions,
        vibeAvailability: vibeData.vibeAvailability,
        personalityPrompt: vibeData.personalityPrompt,
      });
      
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
      <div className="bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Create Your Vibe Card</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Emoji Selection */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Choose Your Mood Emoji
              </label>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-3xl p-2 rounded-xl transition-all ${
                      emoji === e
                        ? "bg-purple-500 scale-110 ring-2 ring-purple-400"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white/80 text-sm font-medium">
                  How are you feeling? (2-8 words)
                </label>
                <button
                  type="button"
                  onClick={handleGetAISuggestions}
                  disabled={loadingSuggestions || !description || description.trim().split(/\s+/).filter((w) => w).length < 2 || currentIntent.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                maxLength={60}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-white/60 text-sm">
                  {wordCount} / 8 words
                </p>
                {wordCount < 2 && (
                  <p className="text-yellow-400 text-sm">
                    Need at least 2 words
                  </p>
                )}
                {wordCount > 8 && (
                  <p className="text-red-400 text-sm">
                    Maximum 8 words
                  </p>
                )}
              </div>
              
              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <p className="text-white/70 text-sm font-medium">AI Suggestions:</p>
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
                              ? "bg-white/5 hover:bg-white/10 border-white/20 hover:border-purple-500/50"
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
              <label className="block text-white/80 text-sm font-medium mb-3">
                Energy Level: {energyLevel}/10
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>Low (calm/drained)</span>
                  <span>High (excited/hyper)</span>
                </div>
                <div className="text-sm text-white/80 mt-2">
                  {energyLevel <= 3 && "Low-energy / calm / drained"}
                  {energyLevel > 3 && energyLevel <= 6 && "Moderate energy"}
                  {energyLevel > 6 && energyLevel <= 8 && "Active / excited"}
                  {energyLevel > 8 && "Super active / excited / hyper"}
                </div>
              </div>
            </div>

            {/* Current Intent */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Current Intent (choose 1-2)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {INTENT_OPTIONS.map((intent) => (
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
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      currentIntent.includes(intent)
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
              {currentIntent.length > 0 && (
                <p className="mt-2 text-sm text-white/60">
                  Selected: {currentIntent.join(", ")}
                </p>
              )}
            </div>

            {/* Context Tag */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Context Tag (optional - 1 word)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {CONTEXT_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setContextTag(contextTag === tag ? "" : tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      contextTag === tag
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Interaction Boundary */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Interaction Boundary
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERACTION_BOUNDARY_OPTIONS.map((boundary) => (
                  <button
                    key={boundary}
                    type="button"
                    onClick={() => setInteractionBoundary(boundary)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      interactionBoundary === boundary
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {boundary}
                  </button>
                ))}
              </div>
            </div>

            {/* What I'm Feeling Like Today */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                What I'm Feeling Like Today (select any)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-4 bg-white/5 rounded-2xl border border-white/10">
                {FEELING_OPTIONS.map((feeling) => (
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
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      feelingOptions.includes(feeling)
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {feeling}
                  </button>
                ))}
              </div>
              {feelingOptions.length > 0 && (
                <p className="mt-2 text-sm text-white/60">
                  Selected: {feelingOptions.join(", ")}
                </p>
              )}
            </div>

            {/* Vibe Availability */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Vibe Availability
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VIBE_AVAILABILITY_OPTIONS.map((availability) => (
                  <button
                    key={availability}
                    type="button"
                    onClick={() => setVibeAvailability(vibeAvailability === availability ? "" : availability)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      vibeAvailability === availability
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {availability}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Personality Prompt */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Today I feel like... (optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-4 bg-white/5 rounded-2xl border border-white/10">
                {PERSONALITY_PROMPT_OPTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setPersonalityPrompt(personalityPrompt === prompt ? "" : prompt)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all text-left italic ${
                      personalityPrompt === prompt
                        ? "bg-purple-500 text-white ring-2 ring-purple-400"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || wordCount < 2 || wordCount > 8}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Vibe Card
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

