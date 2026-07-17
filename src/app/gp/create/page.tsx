"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import toast from "react-hot-toast";
import { 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Check, 
  Sparkles, 
  Film, 
  Tv, 
  MessageSquare,
  Clock,
  Users,
  Compass,
  ArrowRight,
  HelpCircle,
  Coffee,
  Dumbbell,
  Plane, 
  Palette,
  Terminal,
  BookOpen,
  Heart
} from "lucide-react";
import { checkGPLimits } from "../../lib/api";

// Constants from groupModel
const GP_CATEGORIES = [
  "Vibe GP",
  "Movie GP",
  "Anime GP",
  "Food & Cafe GP",
  "Fitness & Sports GP",
  "Travel GP",
  "Hobbies & Creativity GP",
  "Developer GP",
  "Study GP",
  "Relationship GP",
  "Other GP"
] as const;
const VIBE_GP_SUBTYPES = ["Fun", "Chill", "Overthinker", "Chaos", "Calm", "Random Talk"] as const;
const MOVIE_GP_SUBTYPES = ["Movie Name", "Genre"] as const;
const ANIME_GP_SUBTYPES = ["Anime Name", "Genre"] as const;
const FOOD_CAFE_GP_SUBTYPES = ["Cafe Hopping", "Street Food", "Fine Dining", "Cooking/Baking", "Food Tasting"] as const;
const FITNESS_SPORTS_GP_SUBTYPES = ["Gym/Workouts", "Running/Cycling", "Football/Cricket", "Yoga/Meditation", "Badminton/Tennis"] as const;
const TRAVEL_GP_SUBTYPES = ["Road Trip", "Backpacking", "City Exploration", "Weekend Getaway", "Adventure Sports"] as const;
const HOBBIES_CREATIVITY_GP_SUBTYPES = ["Photography", "Painting/Art", "Writing/Poetry", "Music/Instruments", "Gaming/E-sports"] as const;
const DEVELOPER_GP_SUBTYPES = ["Coding Buddies", "Open Source", "Hackathons", "Tech Stack Talk", "Side Projects"] as const;
const STUDY_GP_SUBTYPES = ["Exam Prep", "Quiet Co-working", "Language Practice", "Group Discussions", "Homework Help"] as const;
const RELATIONSHIP_GP_SUBTYPES = ["Dating Advice", "Vent & Support", "Success Stories", "Crush Talk", "Green/Red Flags"] as const;
const OTHER_GP_SUBTYPES = ["Standup", "Travel", "Trip", "Tech Talk", "Music", "Sports", "Other"] as const;
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
  "Cafe reviews & food recommendations",
  "Gym motivation & diet tips",
  "Backpacking & adventure stories",
  "Coding, tech stack & open source",
  "Exam prep & sharing notes",
  "Dating, crush & romance advice",
  "Art & craft project collabs",
  "Music play & jamming sessions",
  "Side projects & start-up ideas",
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
  "Looking for a travel partner",
  "Need coding assistance or tech advice",
  "Want to jam or share music",
  "Need workout motivation or sport buddies",
  "Searching for foodie spot companions",
  "Studying for upcoming exams together",
  "Need relationship venting space",
] as const;

const LOOKING_FOR_OPTIONS = [
  "🤝 New Friends",
  "😂 Fun Conversations",
  "🎬 Movie Discussions",
  "🎌 Anime Discussions",
  "🎮 Gaming Squad",
  "📚 Study Group",
  "💻 Coding Friends",
  "🎵 Music Buddies",
  "☕ Coffee Chats",
  "❤️ Relationship Advice",
  "🧠 Deep Talks",
  "🎤 Voice Calls",
  "🌍 Travel Buddies",
  "🍽️ Foodie Partners",
  "💪 Workout Buddies",
  "🧗 Adventure Squad",
  "🎨 Art Collaborators",
  "🚀 Hackathon Team",
  "📝 Study Partners",
  "🍿 Movie Night Partners",
  "💬 Late Night Venting",
] as const;

const WHO_IS_IT_FOR_OPTIONS = [
  "🌍 Everyone",
  "🎓 Students",
  "💻 Developers",
  "🎮 Gamers",
  "🎬 Movie Lovers",
  "🎌 Anime Fans",
  "🎵 Music Lovers",
  "📚 Readers",
  "🏋️ Fitness Enthusiasts",
  "☕ Coffee Lovers",
  "✈️ Travelers",
  "🎨 Creators",
  "🚀 Entrepreneurs",
] as const;

export default function CreateGPPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingLimits, setCheckingLimits] = useState(true);

  // Form state
  const [gpName, setGpName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [subType, setSubType] = useState<string>("");
  const [specificName, setSpecificName] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [talkTopics, setTalkTopics] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [whoIsItFor, setWhoIsItFor] = useState<string[]>([]);
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
    if (step === 2 && (subType === "Movie Name" || subType === "Anime Name" || subType === "Other") && !specificName.trim()) {
      toast.error(subType === "Other" ? "Please enter a custom category/topic" : `Please enter a ${category === "Movie GP" ? "movie" : "anime"} name`);
      return;
    }
    if (step === 2 && subType === "Genre" && !genre) {
      toast.error("Please select a genre");
      return;
    }
    if (step === 3 && talkTopics.length === 0) {
      toast.error("Please select at least one talk topic");
      return;
    }
    if (step === 3 && !gpName.trim()) {
      toast.error("Please enter a unique GP handle/name");
      return;
    }
    if (step === 3 && gpName.trim().length < 3) {
      toast.error("GP Handle must be at least 3 characters");
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
    if (step === 4 && lookingFor.length === 0) {
      toast.error("Please select what you are looking for");
      return;
    }
    if (step === 4 && lookingFor.length > 3) {
      toast.error("Please select maximum 3 options for 'Looking For'");
      return;
    }
    if (step === 5 && whoIsItFor.length === 0) {
      toast.error("Please select who this GP is for");
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
    if (!creationReason) {
      toast.error("Please select a reason for creating this GP");
      return;
    }
    if (reasonNote.length > 100) {
      toast.error("Reason note must be 100 characters or less");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/gp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gpName: gpName.trim().toLowerCase(),
          category,
          subType,
          specificName: specificName.trim() || "",
          genre: genre.trim() || "",
          talkTopics,
          description: description.trim() || "",
          lookingFor,
          whoIsItFor,
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

  const toggleLookingFor = (option: string) => {
    if (lookingFor.includes(option)) {
      setLookingFor(lookingFor.filter((item) => item !== option));
    } else {
      if (lookingFor.length >= 3) {
        toast.error("Maximum 3 looking for options allowed");
        return;
      }
      setLookingFor([...lookingFor, option]);
    }
  };

  const toggleWhoIsItFor = (option: string) => {
    if (whoIsItFor.includes(option)) {
      setWhoIsItFor(whoIsItFor.filter((item) => item !== option));
    } else {
      setWhoIsItFor([...whoIsItFor, option]);
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
      case "Food & Cafe GP":
        return FOOD_CAFE_GP_SUBTYPES;
      case "Fitness & Sports GP":
        return FITNESS_SPORTS_GP_SUBTYPES;
      case "Travel GP":
        return TRAVEL_GP_SUBTYPES;
      case "Hobbies & Creativity GP":
        return HOBBIES_CREATIVITY_GP_SUBTYPES;
      case "Developer GP":
        return DEVELOPER_GP_SUBTYPES;
      case "Study GP":
        return STUDY_GP_SUBTYPES;
      case "Relationship GP":
        return RELATIONSHIP_GP_SUBTYPES;
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
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case "Movie GP":
        return <Film className="w-5 h-5 text-blue-400" />;
      case "Anime GP":
        return <Tv className="w-5 h-5 text-orange-400" />;
      case "Food & Cafe GP":
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case "Fitness & Sports GP":
        return <Dumbbell className="w-5 h-5 text-emerald-400" />;
      case "Travel GP":
        return <Plane className="w-5 h-5 text-sky-400" />;
      case "Hobbies & Creativity GP":
        return <Palette className="w-5 h-5 text-fuchsia-400" />;
      case "Developer GP":
        return <Terminal className="w-5 h-5 text-teal-400" />;
      case "Study GP":
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      case "Relationship GP":
        return <Heart className="w-5 h-5 text-rose-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-green-400" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Vibe GP":
        return "from-pink-500/10 via-purple-600/10 to-indigo-500/10 border-pink-500/20 hover:border-pink-500/40 shadow-[0_8px_30px_rgba(219,39,119,0.08)] text-pink-300";
      case "Movie GP":
        return "from-blue-500/10 via-cyan-600/10 to-teal-500/10 border-blue-500/20 hover:border-blue-500/40 shadow-[0_8px_30px_rgba(59,130,246,0.08)] text-blue-300";
      case "Anime GP":
        return "from-orange-500/10 via-red-600/10 to-pink-500/10 border-orange-500/20 hover:border-orange-500/40 shadow-[0_8px_30px_rgba(249,115,22,0.08)] text-orange-300";
      case "Food & Cafe GP":
        return "from-amber-500/10 via-orange-600/10 to-red-500/10 border-amber-500/20 hover:border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.08)] text-amber-300";
      case "Fitness & Sports GP":
        return "from-emerald-500/10 via-lime-600/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.08)] text-emerald-300";
      case "Travel GP":
        return "from-sky-500/10 via-blue-600/10 to-indigo-500/10 border-sky-500/20 hover:border-sky-500/40 shadow-[0_8px_30px_rgba(14,165,233,0.08)] text-sky-300";
      case "Hobbies & Creativity GP":
        return "from-fuchsia-500/10 via-purple-600/10 to-pink-500/10 border-fuchsia-500/20 hover:border-fuchsia-500/40 shadow-[0_8px_30px_rgba(217,70,239,0.08)] text-fuchsia-300";
      case "Developer GP":
        return "from-teal-500/10 via-cyan-600/10 to-blue-500/10 border-teal-500/20 hover:border-teal-500/40 shadow-[0_8px_30px_rgba(20,184,166,0.08)] text-teal-300";
      case "Study GP":
        return "from-indigo-500/10 via-violet-600/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_8px_30px_rgba(99,102,241,0.08)] text-indigo-300";
      case "Relationship GP":
        return "from-rose-500/10 via-red-600/10 to-pink-500/10 border-rose-500/20 hover:border-rose-500/40 shadow-[0_8px_30px_rgba(244,63,94,0.08)] text-rose-300";
      default:
        return "from-green-500/10 via-emerald-600/10 to-teal-500/10 border-green-500/20 hover:border-green-500/40 shadow-[0_8px_30px_rgba(34,197,94,0.08)] text-green-300";
    }
  };

  if (checkingLimits) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#07011d]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin text-purple-400" />
          <p className="text-white/60 text-sm font-semibold tracking-wide">Checking group availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#07011d] text-white">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-10 w-full space-y-8 min-h-full flex flex-col relative z-10">
        
        {/* Page Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Design Your Group Profile
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
            Create a temporary group, match with nearby vibes, and start chatting instantly.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
          
          {/* Left Column: Form Flow */}
          <section className="flex-1 max-w-3xl space-y-8 bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)]">

          {/* Progress Steps Header */}
          <div className="mb-6 relative">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 -translate-y-1/2 -z-10 transition-all duration-300 shadow-[0_0_8px_rgba(219,39,119,0.5)]"
              style={{ width: `${((step - 1) / 5) * 100}%` }}
            />
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 backdrop-blur-md transition-all duration-300 font-extrabold text-sm ${
                      step === s
                        ? "bg-purple-950 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110"
                        : step > s
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-md shadow-pink-500/10"
                          : "bg-[#11072a] border-white/10 text-white/30"
                    }`}
                  >
                    {step > s ? <Check className="w-5 h-5 stroke-[3px]" /> : s}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-[9px] md:text-xs text-white/30 mt-3 font-extrabold uppercase tracking-widest px-1">
              <span className={step >= 1 ? "text-purple-300 font-black" : ""}>Category</span>
              <span className={step >= 2 ? "text-purple-300 font-black" : ""}>Sub-Type</span>
              <span className={step >= 3 ? "text-purple-300 font-black" : ""}>Vibe</span>
              <span className={step >= 4 ? "text-purple-300 font-black" : ""}>Looking For</span>
              <span className={step >= 5 ? "text-purple-300 font-black" : ""}>Audience</span>
              <span className={step >= 6 ? "text-purple-300 font-black" : ""}>Reason</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            
            {/* Step 1: Select Category */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <Compass className="w-6 h-6 text-purple-400" />
                    <span>Select GP Category</span>
                  </h2>
                  <p className="text-white/60 text-sm">Choose the category that best matches your group profile's theme.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GP_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSubType("");
                        setSpecificName("");
                        setGenre("");
                      }}
                      className={`p-5 rounded-2xl border transition-all duration-300 text-left relative group cursor-pointer ${
                        cat === "Other GP" ? "md:col-span-2" : ""
                      } ${
                        category === cat
                          ? "bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent border-purple-500/50 shadow-[0_8px_30px_rgba(168,85,247,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`p-2.5 rounded-xl ${
                          category === cat ? "bg-purple-500/20 text-white shadow-inner" : "bg-white/5 text-white/50 group-hover:text-white"
                        } transition-colors`}>
                          {getCategoryIcon(cat)}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{cat}</h3>
                      </div>
                      <p className="text-white/50 text-xs leading-relaxed">
                        {cat === "Vibe GP" && "Perfect for sharing emotional energy, chill chatrooms, mental breaks, or chaos."}
                        {cat === "Movie GP" && "Discuss releases, review cinema history, or organize streaming parties."}
                        {cat === "Anime GP" && "Talk fan theories, manga releases, or connect with Otakus nearby."}
                        {cat === "Food & Cafe GP" && "Find cafe hoppers, street food lovers, foodies, and cooking/baking enthusiasts."}
                        {cat === "Fitness & Sports GP" && "Match with gym/workout buddies, runners, cyclists, or sports game players."}
                        {cat === "Travel GP" && "Plan weekend getaways, backpacking adventures, road trips, or city tours."}
                        {cat === "Hobbies & Creativity GP" && "Share art, photography, writing, music, poetry, or gaming interests."}
                        {cat === "Developer GP" && "Discuss coding, share side projects, pair program, or coordinate hackathon squads."}
                        {cat === "Study GP" && "Find exam prep study groups, co-work quietly, or practice foreign languages."}
                        {cat === "Relationship GP" && "Seek dating advice, vent about relationship issues, or share relationship stories."}
                        {cat === "Other GP" && "Create custom channels for any other general topics or hobbies."}
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
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <span>Select Sub-Type</span>
                  </h2>
                  <p className="text-white/60 text-sm">Choose a room subtype under <b>{category}</b> to specify your topic.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getSubTypes().map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setSubType(st);
                        if (st !== "Movie Name" && st !== "Anime Name" && st !== "Genre") {
                          setSpecificName("");
                          setGenre("");
                        }
                      }}
                      className={`p-4 rounded-2xl border font-bold text-sm transition-all duration-200 text-center cursor-pointer ${
                        subType === st
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/5"
                          : "bg-white/[0.02] border-white/5 text-white/70 hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Genre Selector */}
                {(subType === "Genre" && (category === "Movie GP" || category === "Anime GP")) && (
                  <div className="mt-6 space-y-3 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">Select Genre</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {getGenres().map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGenre(g)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            genre === g
                              ? "bg-purple-500/20 border-purple-500/50 text-white"
                              : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Name Input */}
                {(subType === "Movie Name" || subType === "Anime Name" || subType === "Other") && (
                  <div className="mt-6 space-y-3 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
                      {subType === "Other"
                        ? "Custom Topic / Category Name"
                        : `${category === "Movie GP" ? "Movie" : "Anime"} Name`}
                    </h3>
                    <input
                      type="text"
                      value={specificName}
                      onChange={(e) => setSpecificName(e.target.value)}
                      placeholder={
                        subType === "Other"
                          ? "e.g., Coding Friends, Book Club, Standup Comedy"
                          : `e.g., ${category === "Movie GP" ? "Interstellar" : "Naruto Shippuden"}`
                      }
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Talk Topics & Handle */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                    <span>What We'll Talk About & Handle</span>
                  </h2>
                  <p className="text-white/60 text-sm">Select 1-3 topics you want to talk about and choose your unique group handle name.</p>
                </div>

                {/* Handle Input */}
                <div className="space-y-2 pb-4 border-b border-white/5">
                  <label className="block text-xs font-extrabold uppercase tracking-widest text-purple-400">
                    GP Unique Handle/Name (Required)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-white/40 font-bold">@</span>
                    <input
                      type="text"
                      value={gpName}
                      onChange={(e) => setGpName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      placeholder="chill-vibes"
                      className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-semibold tracking-wide"
                    />
                  </div>
                  <p className="text-[10px] text-white/40">This unique handle (e.g., @chill-vibes) allows others to search for your group directly on the explore page.</p>
                </div>

                {/* Talk Topics Selectors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-widest text-purple-400">Select Topics (Select 1 to 3)</label>
                    <span className="text-[10px] text-purple-300 font-extrabold tracking-wide">{talkTopics.length}/3 selected</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TALK_TOPICS.map((topic) => {
                      const isSelected = talkTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTalkTopic(topic)}
                          className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between text-xs font-semibold cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white shadow-md shadow-purple-500/5"
                              : "bg-white/[0.02] border-white/5 text-white/70 hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span>{topic}</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0 stroke-[3px]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="block text-xs font-extrabold uppercase tracking-widest text-purple-400">
                    Short Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a short description of the group's vibes, rules, or theme..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm transition-all font-medium leading-relaxed"
                  />
                  <div className="text-[10px] text-white/30 text-right font-semibold">{description.length}/200 characters</div>
                </div>
              </div>
            )}

            {/* Step 4: Looking For */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-400" />
                    <span>Looking For</span>
                  </h2>
                  <p className="text-white/60 text-sm">Select 1-3 requirements for what you are looking for in group members.</p>
                </div>
                
                <div className="flex items-center justify-between text-xs font-extrabold text-white/30 mb-1 uppercase tracking-widest">
                  <span>Options Grid</span>
                  <span className="text-purple-300 font-extrabold">{lookingFor.length}/3 selected</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LOOKING_FOR_OPTIONS.map((option) => {
                    const isSelected = lookingFor.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleLookingFor(option)}
                        className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white shadow-md shadow-purple-500/5"
                            : "bg-white/[0.02] border-white/5 text-white/70 hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span>{option}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Who is this GP for? */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-purple-400" />
                    <span>Target Audience</span>
                  </h2>
                  <p className="text-white/60 text-sm">Choose who is welcome to join this group (Select all that apply).</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WHO_IS_IT_FOR_OPTIONS.map((option) => {
                    const isSelected = whoIsItFor.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleWhoIsItFor(option)}
                        className={`p-4 rounded-xl border transition-all text-center text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300"
                            : "bg-white/[0.02] border-white/5 text-white/60 hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Reason */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <Compass className="w-6 h-6 text-purple-400" />
                    <span>Reason for GP Creation</span>
                  </h2>
                  <p className="text-white/60 text-sm">Help others understand your intent by choosing why you created the group today.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CREATION_REASONS.map((reason) => {
                    const isSelected = creationReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setCreationReason(reason)}
                        className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white shadow-md shadow-purple-500/5"
                            : "bg-white/[0.02] border-white/5 text-white/70 hover:border-white/10"
                        }`}
                      >
                        <span>{reason}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Additional Note */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="block text-xs font-extrabold uppercase tracking-widest text-purple-400">
                    Anything else? (Optional)
                  </label>
                  <input
                    type="text"
                    value={reasonNote}
                    onChange={(e) => setReasonNote(e.target.value)}
                    placeholder="e.g., Need a chill break from coding..."
                    maxLength={100}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-semibold"
                  />
                  <div className="text-[10px] text-white/30 text-right font-semibold">{reasonNote.length}/100 characters</div>
                </div>

                {/* Location alert */}
                {!location && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-2xl flex items-center gap-3">
                    <MapPin className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-medium">
                      Location access is required to index and match groups around you. Please enable location permissions in your browser.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom Actions Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={step === 1 ? () => router.push("/app-home") : handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs md:text-sm font-extrabold cursor-pointer uppercase tracking-wider"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{step === 1 ? "Cancel" : "Back"}</span>
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-xs md:text-sm shadow-md shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase tracking-wider"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !location}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all cursor-pointer uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create GP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Live Mockup Card Preview */}
        <section className="hidden lg:block w-[380px] shrink-0 sticky top-10 self-start space-y-4">
          <div className="flex items-center gap-2 px-1 text-white/50">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">Live Preview Card</h3>
          </div>

          {/* Simulated Card Container */}
          <div className={`bg-gradient-to-br ${
            category ? getCategoryColor(category) : "from-white/[0.03] to-white/[0.03] border-white/10"
          } rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[350px] relative overflow-hidden`}>
            
            {/* Glow highlight inside card */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none -z-10" />

            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1 mr-2">
                  <h4 className="text-purple-300/80 font-bold text-xs tracking-wide truncate mb-1">
                    @{gpName || "handle-name"}
                  </h4>
                  <h3 className="text-white font-extrabold text-lg tracking-tight mb-1 line-clamp-1">
                    {specificName || (subType ? `${subType} Room` : "Room Title Preview")}
                  </h3>
                  {genre && (
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-300 text-[9px] uppercase font-extrabold tracking-widest">
                      {genre}
                    </span>
                  )}
                </div>

                {category ? (
                  <span className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    {getCategoryIcon(category)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-white/5 rounded-lg text-[9px] text-white/30 border border-white/5">
                    No Category
                  </span>
                )}
              </div>

              {/* Topics tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {talkTopics.length === 0 ? (
                  <>
                    <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white/30 text-[10px] font-semibold">#topic1</span>
                    <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white/30 text-[10px] font-semibold">#topic2</span>
                  </>
                ) : (
                  talkTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white/70 text-[10px] font-semibold"
                    >
                      #{topic}
                    </span>
                  ))
                )}
              </div>

              {/* Description */}
              <p className="text-white/60 text-xs mb-5 line-clamp-2 bg-black/10 p-3 rounded-2xl border border-white/5 italic leading-relaxed">
                "{description || "Add a description to tell others what your group is about..."}"
              </p>

              {/* Details Tags */}
              <div className="space-y-2.5 mb-5">
                {lookingFor.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Looking For</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lookingFor.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 text-[10px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {whoIsItFor.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Target Audience</p>
                    <div className="flex flex-wrap gap-1.5">
                      {whoIsItFor.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-300 text-[10px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Creator details mockup */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-[#0d0426] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">1 of 5 slots filled (Creator)</span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="mb-5 space-y-1">
              <div className="flex justify-between text-[9px] text-white/40 font-bold uppercase tracking-wider">
                <span>Capacity Progress</span>
                <span>20% Filled</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: "20%" }} />
              </div>
            </div>

            {/* Simulated Card Footer */}
            <div className="pt-4 border-t border-white/5 mt-auto space-y-3">
              <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>3h 00m remaining</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  <span>Near You</span>
                </div>
              </div>

              <button
                disabled
                className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-extrabold text-white/30 cursor-not-allowed uppercase tracking-widest"
              >
                Join Group Preview
              </button>
            </div>

          </div>
          
          {/* Informational bubble */}
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-[11px] text-white/40 leading-relaxed font-medium">
            💡 <b>Did you know?</b> This card will expire in 3 hours unless your members vote to make it permanent. Choose tags and a handle that will make it easy to spot!
          </div>

        </section>

      </div>
    </div>
  </div>
  );
}
