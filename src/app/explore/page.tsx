"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  SlidersHorizontal, 
  Compass, 
  Sparkles, 
  Film, 
  Tv, 
  MessageSquare, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Coffee,
  Dumbbell,
  Plane,
  Palette,
  Terminal,
  BookOpen,
  Heart,
  Grid,
  List,
  Check,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { exploreGPs, joinGP } from "../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface GP {
  _id: string;
  gpName: string;
  category: string;
  subType: string;
  specificName?: string;
  genre?: string;
  talkTopics: string[];
  description?: string;
  lookingFor?: string[];
  whoIsItFor?: string[];
  memberCount: number;
  maxMembers: number;
  expiresAt: string;
  timeLeft: number | null;
  distance: number | null;
  city?: string;
  zone?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  members: Array<{
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  }>;
  isPermanent: boolean;
  status: string;
}

const CATEGORY_LIST = [
  { name: "All", icon: Compass, label: "All GPs" },
  { name: "Vibe GP", icon: Sparkles, label: "Vibe GP" },
  { name: "Movie GP", icon: Film, label: "Movie GP" },
  { name: "Anime GP", icon: Tv, label: "Anime GP" },
  { name: "Food & Cafe GP", icon: Coffee, label: "Food & Cafe GP" },
  { name: "Fitness & Sports GP", icon: Dumbbell, label: "Fitness & Sports GP" },
  { name: "Travel GP", icon: Plane, label: "Travel GP" },
  { name: "Hobbies & Creativity GP", icon: Palette, label: "Hobbies & Creativity" },
  { name: "Developer GP", icon: Terminal, label: "Developer GP" },
  { name: "Study GP", icon: BookOpen, label: "Study GP" },
  { name: "Relationship GP", icon: Heart, label: "Relationship GP" },
  { name: "Other GP", icon: MessageSquare, label: "Other GP" },
];

const MOODS = ["Chill", "Fun", "Overthinking", "Chaos", "Calm", "Random Talk"];

export default function ExplorePage() {
  const router = useRouter();
  const [gps, setGps] = useState<GP[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [maxDistance, setMaxDistance] = useState<number | "Any">(150);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [groupType, setGroupType] = useState<"all" | "temporary" | "permanent">("all");
  const [hideFull, setHideFull] = useState(false);
  const [sortOrder, setSortOrder] = useState<"nearest" | "active" | "newest">("nearest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const fetchGPs = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }

      const params: any = {
        page: pageNum,
        limit: 12,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (activeCategory !== "All") {
        params.category = activeCategory;
      }

      if (maxDistance !== "Any") {
        params.maxDistance = String(maxDistance);
      }

      if (selectedMood) {
        params.subType = selectedMood;
      }

      if (groupType !== "all") {
        params.type = groupType;
      }

      const res = await exploreGPs(params);
      
      if (res.success && res.gps) {
        if (isLoadMore) {
          setGps((prev) => [...prev, ...res.gps]);
        } else {
          setGps(res.gps);
        }
        if (res.categoryCounts) {
          setCategoryCounts(res.categoryCounts);
        }
        setHasMore(res.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error exploring GPs:", error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [searchQuery, activeCategory, maxDistance, selectedMood, groupType]);

  // Fetch when filters change
  useEffect(() => {
    fetchGPs(1, false);
  }, [fetchGPs]);

  const handleJoin = async (gpId: string) => {
    if (joiningId) return;
    setJoiningId(gpId);
    try {
      const res = await joinGP(gpId);
      if (res.success) {
        toast.success("Joined group successfully! 🎉");
        router.push(`/chat-room?gpId=${gpId}`);
      } else {
        toast.error(res.message || "Failed to join group");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to join group");
    } finally {
      setJoiningId(null);
    }
  };

  const handleClearAll = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setMaxDistance(150);
    setSelectedMood(null);
    setGroupType("all");
    setHideFull(false);
    setSortOrder("nearest");
    toast.success("Filters cleared");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Vibe GP":
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case "Movie GP":
        return <Film className="w-4 h-4 text-blue-400" />;
      case "Anime GP":
        return <Tv className="w-4 h-4 text-orange-400" />;
      case "Food & Cafe GP":
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case "Fitness & Sports GP":
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case "Travel GP":
        return <Plane className="w-4 h-4 text-sky-400" />;
      case "Hobbies & Creativity GP":
        return <Palette className="w-4 h-4 text-fuchsia-400" />;
      case "Developer GP":
        return <Terminal className="w-4 h-4 text-teal-400" />;
      case "Study GP":
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case "Relationship GP":
        return <Heart className="w-4 h-4 text-rose-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-green-400" />;
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Vibe GP":
        return "bg-pink-500/10 border-pink-500/20 text-pink-300";
      case "Movie GP":
        return "bg-blue-500/10 border-blue-500/20 text-blue-300";
      case "Anime GP":
        return "bg-orange-500/10 border-orange-500/20 text-orange-300";
      case "Food & Cafe GP":
        return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      case "Fitness & Sports GP":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "Travel GP":
        return "bg-sky-500/10 border-sky-500/20 text-sky-300";
      case "Hobbies & Creativity GP":
        return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300";
      case "Developer GP":
        return "bg-teal-500/10 border-teal-500/20 text-teal-300";
      case "Study GP":
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-300";
      case "Relationship GP":
        return "bg-rose-500/10 border-rose-500/20 text-rose-300";
      default:
        return "bg-green-500/10 border-green-500/20 text-green-300";
    }
  };

  const getCategoryBorderColor = (category: string) => {
    switch (category) {
      case "Vibe GP": return "border-l-pink-500";
      case "Movie GP": return "border-l-blue-500";
      case "Anime GP": return "border-l-orange-500";
      case "Food & Cafe GP": return "border-l-amber-500";
      case "Fitness & Sports GP": return "border-l-emerald-500";
      case "Travel GP": return "border-l-sky-500";
      case "Hobbies & Creativity GP": return "border-l-fuchsia-500";
      case "Developer GP": return "border-l-teal-500";
      case "Study GP": return "border-l-indigo-500";
      case "Relationship GP": return "border-l-rose-500";
      default: return "border-l-green-500";
    }
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "Permanent";
    if (minutes < 60) return `${minutes}m left`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  };

  // Frontend post-filtering and sorting
  const displayedGPs = gps
    .filter((gp) => {
      if (hideFull && gp.memberCount >= gp.maxMembers) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "nearest") {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      if (sortOrder === "active") {
        return b.memberCount - a.memberCount;
      }
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const sidebarContent = (
    <div className="space-y-8 flex flex-col h-full overflow-y-auto pr-2 pb-6 scrollbar-thin">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-purple-400" />
          <span>Filters</span>
        </h2>
        <button
          onClick={handleClearAll}
          className="text-xs font-bold text-white/50 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
        >
          Clear all
        </button>
      </div>

      {/* Category Dropdown Filter */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-1">
          Category
        </h3>
        <Select value={activeCategory} onValueChange={(val) => setActiveCategory(val)}>
          <SelectTrigger className="w-full flex items-center justify-between px-4 py-3 bg-[#130b24]/40 border border-white/[0.06] text-white rounded-2xl text-sm font-semibold focus:ring-purple-500/20 data-[placeholder]:text-white/30 h-11 shrink-0 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-3 shadow-inner">
            <SelectValue placeholder="Select Category">
              {(() => {
                const activeCat = CATEGORY_LIST.find((c) => c.name === activeCategory) || CATEGORY_LIST[0];
                const ActiveIcon = activeCat.icon;
                return (
                  <div className="flex items-center gap-3">
                    <ActiveIcon className="w-4 h-4 text-purple-400" />
                    <span>{activeCat.label}</span>
                  </div>
                );
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border border-white/10 bg-[#0f0724]/95 backdrop-blur-xl text-white rounded-2xl max-h-[300px] w-[var(--radix-select-trigger-width)]">
            {CATEGORY_LIST.map((cat) => {
              const CatIcon = cat.icon;
              const count = categoryCounts[cat.name] || (cat.name === "All" ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : 0);
              return (
                <SelectItem key={cat.name} value={cat.name} className="py-2.5">
                  <div className="flex items-center justify-between w-full pr-4 text-xs">
                    <div className="flex items-center gap-3">
                      <CatIcon className="w-4 h-4 text-white/40" />
                      <span>{cat.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[9px] font-extrabold text-white/40 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                        {count}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Group Type selector */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
          Group Type
        </h3>
        <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 border border-white/5 rounded-2xl">
          {(["all", "temporary", "permanent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setGroupType(t)}
              className={`py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
                groupType === t
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/10"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "all" ? "All" : t === "temporary" ? "Timed" : "Perm"}
            </button>
          ))}
        </div>
      </div>

      {/* Mood List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
          Mood & Vibe
        </h3>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood;
            return (
              <button
                key={mood}
                onClick={() => setSelectedMood(isSelected ? null : mood)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg shadow-purple-500/25 scale-[1.03]"
                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Radius Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-white/40">
          <span>Radius</span>
          <span className="text-pink-400 normal-case font-black text-xs tracking-normal">
            {maxDistance === "Any" ? "Any Distance" : `Within ${maxDistance}km`}
          </span>
        </div>
        <div className="space-y-1.5 p-4 bg-black/20 border border-white/5 rounded-2xl">
          <input
            type="range"
            min="10"
            max="500"
            value={maxDistance === "Any" ? 500 : maxDistance}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 500) {
                setMaxDistance("Any");
              } else {
                setMaxDistance(val);
              }
            }}
            className="w-full accent-pink-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-white/30 font-bold">
            <span>10km</span>
            <span>Any</span>
          </div>
        </div>
      </div>

      {/* Availability Selector */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer">
          <span className="text-xs font-semibold text-white/70">Hide Full Groups</span>
          <input
            type="checkbox"
            checked={hideFull}
            onChange={(e) => setHideFull(e.target.checked)}
            className="w-4.5 h-4.5 accent-purple-500 rounded border-white/10 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden text-white bg-[#07011d] relative">
      <style>{`
        /* Custom range slider thumb styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #db2777;
          border: 3px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(219, 39, 119, 0.5);
          margin-top: -6px;
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(219, 39, 119, 0.8);
        }
        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #db2777;
          border: 3px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(219, 39, 119, 0.5);
          transition: all 0.2s ease;
        }
        input[type="range"]::-moz-range-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/3 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Left Filters Sidebar - Desktop */}
      <div className="hidden md:block w-80 shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-xl p-6 h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-80 max-w-[85vw] bg-[#07011d] border-r border-white/5 p-6 h-full shadow-2xl relative flex flex-col">
            <button
              onClick={() => setShowMobileFilters(false)}
              className="absolute top-5 right-5 p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 mt-6 overflow-hidden">
              {sidebarContent}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileFilters(false)} />
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Search Bar Area */}
        <div className="p-6 md:px-8 md:py-6 border-b border-white/5 bg-black/10 backdrop-blur-md flex flex-col gap-4">
          <div className="flex gap-3 items-center">
            
            {/* Search Input Box */}
            <div className="flex-1 flex items-center gap-3 bg-[#130b24]/40 border border-white/[0.06] rounded-2xl px-5 py-4 focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-purple-500/10 transition-all shadow-inner">
              <Search className="w-5 h-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search GPs by name, topic, or vibe..."
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-sm font-semibold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-white/40 hover:text-white font-extrabold cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex md:hidden items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-white transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchGPs(1, false)}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-white/70 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results & List area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-white flex items-baseline gap-2">
                <span>{displayedGPs.length}</span>
                <span className="text-white/40 font-semibold text-sm">GPs found near you</span>
              </h2>
            </div>

            {/* Sorting & Layout Toggles */}
            <div className="flex items-center gap-4 justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-black/20 p-1 border border-white/5 rounded-full shrink-0">
                {(["nearest", "active", "newest"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortOrder(s)}
                    className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      sortOrder === s
                        ? "bg-pink-500/20 border border-pink-500/20 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {s === "nearest" ? "Nearest" : s === "active" ? "Most Active" : "Newest"}
                  </button>
                ))}
              </div>

              {/* Grid / List Toggles */}
              <div className="flex items-center gap-1 bg-black/20 p-1 border border-white/5 rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loader */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">Searching for nearby groups...</p>
            </div>
          ) : displayedGPs.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-[32px] backdrop-blur-xl flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto shadow-2xl">
              <div className="p-5 bg-white/5 border border-white/10 rounded-full text-white/30">
                <Compass className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white/80 font-extrabold text-xl">No groups match your filters</h3>
                <p className="text-white/40 text-sm max-w-sm leading-relaxed font-semibold">
                  Try adjusting filters, modifying search keywords, dragging the radius slider, or create a brand new group!
                </p>
              </div>
              <button
                onClick={() => router.push("/gp/create")}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 active:scale-95 transition-all font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                Create GP
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Card List / Grid */}
              {viewMode === "grid" ? (
                
                // Grid View Layout
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedGPs.map((gp) => {
                    const isCustomOther = gp.category === "Other GP" && gp.subType === "Other";
                    const isFull = gp.memberCount >= gp.maxMembers;
                    
                    return (
                      <div
                        key={gp._id}
                        className={`bg-gradient-to-b from-[#160d35]/60 to-[#0e0728]/70 rounded-[28px] p-6 border border-white/[0.06] backdrop-blur-md hover:border-purple-500/30 hover:shadow-[0_15px_40px_rgba(168,85,247,0.1)] transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden border-l-4 ${getCategoryBorderColor(gp.category)}`}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none -z-10 group-hover:bg-purple-500/10 transition-colors duration-300" />
                        
                        <div>
                          {/* Card Header Category & Expiry */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                              {gp.category.replace(" GP", "")} GP
                            </span>
                            
                            {/* Permanent / Timer Status */}
                            {gp.isPermanent ? (
                              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-[9px] uppercase font-black tracking-widest">
                                Permanent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/25 rounded-full text-rose-300 text-[9px] font-bold">
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span>{formatTime(gp.timeLeft)}</span>
                              </span>
                            )}
                          </div>

                          {/* Card Title */}
                          <h3 className="text-white font-extrabold text-lg tracking-tight mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors duration-200">
                            {gp.specificName || `${gp.subType} Room`}
                          </h3>

                          {/* Category Subtype tag */}
                          <span className={`inline-block mb-3 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border shadow-sm ${getCategoryStyles(gp.category)}`}>
                            {getCategoryIcon(gp.category)}
                            <span className="ml-1">{isCustomOther ? "Custom" : gp.subType}</span>
                          </span>

                          {/* Description */}
                          {gp.description && (
                            <p className="text-white/60 text-xs mb-4 line-clamp-2 bg-black/15 p-3 rounded-2xl border border-white/5 italic leading-relaxed">
                              "{gp.description}"
                            </p>
                          )}

                          {/* Talk Topics (Hashtags) */}
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {gp.talkTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white/50 text-[10px] font-semibold"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Card Footer actions */}
                        <div className="pt-4 border-t border-white/5 mt-auto space-y-4">
                          <div className="flex items-center justify-between text-xs text-white/40 font-bold">
                            
                            {/* Member overlapping avatars */}
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {gp.members.slice(0, 3).map((member, idx) => (
                                  <div
                                    key={idx}
                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-[#0d0426] flex items-center justify-center text-white text-[9px] font-semibold overflow-hidden shadow-md"
                                    title={member.username}
                                  >
                                    {member?.profileImage ? (
                                      <img
                                        src={member.profileImage}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{member?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                                    )}
                                  </div>
                                ))}
                                {gp.memberCount > 3 && (
                                  <div className="w-7 h-7 rounded-full bg-white/10 border border-[#0d0426] flex items-center justify-center text-white text-[9px] font-semibold">
                                    +{gp.memberCount - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-white/50 font-bold text-[10px] lowercase tracking-wide">
                                {gp.memberCount}/{gp.maxMembers} joined
                              </span>
                            </div>

                            {/* Distance display */}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-pink-500" />
                              <span className="text-[10px]">
                                {gp.distance !== null 
                                  ? `${gp.distance} km` 
                                  : gp.city 
                                    ? gp.city 
                                    : "Nearby"
                                }
                              </span>
                            </div>
                          </div>

                          {/* Join Button */}
                          <button
                            onClick={() => handleJoin(gp._id)}
                            disabled={joiningId === gp._id || isFull}
                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all uppercase tracking-wider cursor-pointer"
                          >
                            {joiningId === gp._id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Joining...</span>
                              </>
                            ) : isFull ? (
                              <span>Full</span>
                            ) : (
                              <>
                                <span>Join GP</span>
                                <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                
                // List View Layout
                <div className="flex flex-col gap-4">
                  {displayedGPs.map((gp) => {
                    const isCustomOther = gp.category === "Other GP" && gp.subType === "Other";
                    const isFull = gp.memberCount >= gp.maxMembers;
                    
                    return (
                      <div
                        key={gp._id}
                        className={`bg-gradient-to-r from-[#160d35]/60 to-[#0e0728]/70 rounded-2xl p-4 border border-white/[0.06] flex flex-col md:flex-row items-stretch justify-between gap-6 hover:border-purple-500/30 transition-all duration-200 border-l-4 ${getCategoryBorderColor(gp.category)}`}
                      >
                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                              {gp.category.replace(" GP", "")} GP
                            </span>
                            
                            {gp.isPermanent ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-[8px] uppercase font-black tracking-widest">
                                Permanent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/25 rounded-full text-rose-300 text-[8px] font-bold">
                                <Clock className="w-2.5 h-2.5 text-rose-400" />
                                <span>{formatTime(gp.timeLeft)}</span>
                              </span>
                            )}

                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider border shadow-sm ${getCategoryStyles(gp.category)}`}>
                              {getCategoryIcon(gp.category)}
                              <span className="ml-1">{isCustomOther ? "Custom" : gp.subType}</span>
                            </span>
                          </div>

                          <div>
                            <h3 className="text-white font-extrabold text-base tracking-tight mb-1">
                              {gp.specificName || `${gp.subType} Room`}
                            </h3>
                            {gp.description && (
                              <p className="text-white/60 text-xs line-clamp-1 italic">
                                "{gp.description}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {gp.talkTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-white/50 text-[9px] font-semibold"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* List Layout Right Action Panel */}
                        <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 md:pl-6 md:border-l shrink-0 min-w-[150px]">
                          
                          {/* Distance & Member display */}
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-1 md:justify-end text-xs text-white/40 font-semibold">
                              <MapPin className="w-3 h-3 text-pink-500" />
                              <span>
                                {gp.distance !== null 
                                  ? `${gp.distance} km` 
                                  : gp.city 
                                    ? gp.city 
                                    : "Nearby"
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 md:justify-end text-[10px] text-white/50 font-bold">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span>{gp.memberCount}/{gp.maxMembers} joined</span>
                            </div>
                          </div>

                          {/* Join Button */}
                          <button
                            onClick={() => handleJoin(gp._id)}
                            disabled={joiningId === gp._id || isFull}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all uppercase tracking-wider cursor-pointer"
                          >
                            {joiningId === gp._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isFull ? (
                              <span>Full</span>
                            ) : (
                              <>
                                <span>Join</span>
                                <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchGPs(page + 1, true)}
                    disabled={fetchingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                  >
                    {fetchingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More Groups</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
