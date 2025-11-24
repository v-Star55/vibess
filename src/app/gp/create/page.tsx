"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import toast from "react-hot-toast";
import { Loader2, ChevronRight, ChevronLeft, MapPin, Check } from "lucide-react";
import { checkGPLimits } from "../../lib/api";

// Constants from groupModel
const GP_CATEGORIES = ["Vibe GP", "Movie GP", "Anime GP", "Other GP"] as const;
const VIBE_GP_SUBTYPES = ["Fun", "Chill", "Overthinker", "Chaos", "Calm", "Random Talk"] as const;
const MOVIE_GP_SUBTYPES = ["Movie Name", "Genre"] as const;
const ANIME_GP_SUBTYPES = ["Anime Name", "Genre"] as const;
const OTHER_GP_SUBTYPES = ["Standup", "Travel", "Trip", "Tech Talk", "Music", "Sports"] as const;
const MOVIE_GENRES = ["Horror", "Action", "Sci-Fi", "Comedy", "Drama", "Romance", "Thriller", "Fantasy"] as const;
const ANIME_GENRES = ["Shounen", "Romance", "Isekai", "Slice of Life", "Action", "Comedy", "Drama", "Fantasy"] as const;
const TALK_TOPICS = [
  "Life stuff",
  "Overthinking & mental vibe",
  "Random fun & nonsense",
  "Movie / Anime discussion",
  "Fan theories",
  "Day experiences",
  "Trip planning",
  "Roast sessions",
  "Meme talk",
  "Relationship stuff",
  "Career / ambitions",
] as const;
const CREATION_REASONS = [
  "Feeling bored",
  "Feeling lonely today",
  "Want to meet new people",
  "Need people with same movie/anime interest",
  "Want people with same vibe",
  "Just for fun",
  "Planning something",
  "Want deep discussions",
  "Want a safe chill space",
] as const;

export default function CreateGPPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingLimits, setCheckingLimits] = useState(true);

  // Form state
  const [category, setCategory] = useState<string>("");
  const [subType, setSubType] = useState<string>("");
  const [specificName, setSpecificName] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [talkTopics, setTalkTopics] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [creationReason, setCreationReason] = useState<string>("");
  const [reasonNote, setReasonNote] = useState<string>("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number; city?: string; zone?: string } | null>(null);

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
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          toast.error("Location access denied. GP creation requires location.");
        }
      );
    }

    // Check limits
    checkLimits();
  }, [user, router]);

  const checkLimits = async () => {
    try {
      setCheckingLimits(true);
      const res = await checkGPLimits();
      if (res && !res.canCreate) {
        if (res.limits.daily && !res.limits.daily.canCreate) {
          toast.error(`You've reached your daily limit (${res.limits.daily.todayCreations}/2 GPs)`);
        } else if (res.limits.cooldown && res.limits.cooldown.active) {
          toast.error(`Please wait ${res.limits.cooldown.minutesRemaining} minutes before creating another GP`);
        } else if (res.limits.category && res.limits.category.hasActive) {
          toast.error(`You already have an active ${res.limits.category.category}`);
        } else if (res.limits.system && res.limits.system.limitReached) {
          toast.error("Too many groups active right now. Try joining one instead.");
        }
        router.push("/app-home");
      }
    } catch (error) {
      console.error("Error checking limits:", error);
    } finally {
      setCheckingLimits(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !category) {
      toast.error("Please select a category");
      return;
    }
    if (step === 2 && !subType) {
      toast.error("Please select a sub-type");
      return;
    }
    if (step === 3 && talkTopics.length === 0) {
      toast.error("Please select at least one talk topic");
      return;
    }
    if (step === 3 && talkTopics.length > 3) {
      toast.error("Please select maximum 3 talk topics");
      return;
    }
    if (step === 3 && description.length > 200) {
      toast.error("Description must be 200 characters or less");
      return;
    }
    if (step === 4 && !creationReason) {
      toast.error("Please select a reason for creating this GP");
      return;
    }
    if (step === 4 && reasonNote.length > 100) {
      toast.error("Reason note must be 100 characters or less");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error("Location is required to create a GP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/gp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          subType,
          specificName: specificName.trim() || "",
          genre: genre.trim() || "",
          talkTopics,
          description: description.trim() || "",
          creationReason,
          reasonNote: reasonNote.trim() || "",
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city || "",
            zone: location.zone || "",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("GP created successfully! 🎉");
        router.push("/app-home");
      } else {
        toast.error(data.message || "Failed to create GP");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create GP");
    } finally {
      setLoading(false);
    }
  };

  const toggleTalkTopic = (topic: string) => {
    if (talkTopics.includes(topic)) {
      setTalkTopics(talkTopics.filter((t) => t !== topic));
    } else {
      if (talkTopics.length >= 3) {
        toast.error("Maximum 3 talk topics allowed");
        return;
      }
      setTalkTopics([...talkTopics, topic]);
    }
  };

  const getSubTypes = () => {
    switch (category) {
      case "Vibe GP":
        return VIBE_GP_SUBTYPES;
      case "Movie GP":
        return MOVIE_GP_SUBTYPES;
      case "Anime GP":
        return ANIME_GP_SUBTYPES;
      case "Other GP":
        return OTHER_GP_SUBTYPES;
      default:
        return [];
    }
  };

  const getGenres = () => {
    switch (category) {
      case "Movie GP":
        return MOVIE_GENRES;
      case "Anime GP":
        return ANIME_GENRES;
      default:
        return [];
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Vibe GP":
        return "✨";
      case "Movie GP":
        return "🎬";
      case "Anime GP":
        return "🎌";
      case "Other GP":
        return "💬";
      default:
        return "🔥";
    }
  };

  if (checkingLimits) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-y-auto h-full">
      <section className="flex-1 max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    step >= s
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
                      : "bg-white/5 border-white/20 text-white/40"
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      step > s ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>Category</span>
            <span>Sub-Type</span>
            <span>Talk Topics</span>
            <span>Reason</span>
          </div>
        </div>

        {/* Step 1: Select Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Select GP Category</h2>
              <p className="text-white/60">Choose the type of group you want to create</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSubType("");
                    setSpecificName("");
                    setGenre("");
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    category === cat
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getCategoryIcon(cat)}</span>
                    <h3 className="text-xl font-semibold text-white">{cat}</h3>
                  </div>
                  <p className="text-white/60 text-sm">
                    {cat === "Vibe GP" && "Connect with people who share your vibe"}
                    {cat === "Movie GP" && "Discuss movies and share recommendations"}
                    {cat === "Anime GP" && "Talk about anime, characters, and theories"}
                    {cat === "Other GP" && "Create groups for various topics"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Sub-Type */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Select Sub-Type</h2>
              <p className="text-white/60">Choose a specific sub-type for your {category}</p>
            </div>
            <div className="space-y-4">
              {getSubTypes().map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSubType(st);
                    if (st !== "Movie Name" && st !== "Anime Name" && st !== "Genre") {
                      setSpecificName("");
                      setGenre("");
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    subType === st
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-white font-semibold">{st}</span>
                </button>
              ))}
            </div>

            {/* Show genre selector for Movie/Anime Genre sub-type */}
            {(subType === "Genre" && (category === "Movie GP" || category === "Anime GP")) && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Select Genre</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getGenres().map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`p-3 rounded-lg border transition-all ${
                        genre === g
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show name input for Movie/Anime Name sub-type */}
            {(subType === "Movie Name" || subType === "Anime Name") && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Enter {category === "Movie GP" ? "Movie" : "Anime"} Name
                </h3>
                <input
                  type="text"
                  value={specificName}
                  onChange={(e) => setSpecificName(e.target.value)}
                  placeholder={`e.g., ${category === "Movie GP" ? "Inception" : "Attack on Titan"}`}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Talk Topics */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What We'll Talk About</h2>
              <p className="text-white/60">Select 1-3 topics (max 3)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TALK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTalkTopic(topic)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    talkTopics.includes(topic)
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{topic}</span>
                    {talkTopics.includes(topic) && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                Short Description (Optional, max 200 chars)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Chill late-night talk about overthinking and life."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
              />
              <p className="text-xs text-white/40 text-right">{description.length}/200</p>
            </div>
          </div>
        )}

        {/* Step 4: Reason */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Reason for Creating This GP</h2>
              <p className="text-white/60">Why are you creating this group?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CREATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCreationReason(reason)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    creationReason === reason
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{reason}</span>
                    {creationReason === reason && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                Anything else? (Optional, max 100 chars)
              </label>
              <input
                type="text"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="e.g., Feeling low today, want to just talk."
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
              <p className="text-xs text-white/40 text-right">{reasonNote.length}/100</p>
            </div>
            {!location && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-200 text-sm">
                  Location is required. Please enable location access.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={step === 1 ? () => router.push("/app-home") : handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{step === 1 ? "Cancel" : "Back"}</span>
          </button>
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !location}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create GP</span>
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}


