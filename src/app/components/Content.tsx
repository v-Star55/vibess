"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGPsForHome } from "../lib/api";
import GPSection from "./GPSection";

type GPCategory = "Vibe GP" | "Movie GP" | "Anime GP" | "Other GP" | "All";

export default function Content() {
  const router = useRouter();
  const [gps, setGps] = useState<Record<string, any[]>>({});
  const [loadingGPs, setLoadingGPs] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<GPCategory>("All");

  useEffect(() => {
    const loadGPs = async () => {
      try {
        setLoadingGPs(true);
        const res = await getGPsForHome();
        if (res.success && res.gps) {
          setGps(res.gps);
        }
      } catch (error) {
        console.error("Error loading GPs", error);
      } finally {
        setLoadingGPs(false);
      }
    };
    loadGPs();
  }, []);

  const categories: GPCategory[] = ["All", "Vibe GP", "Movie GP", "Anime GP", "Other GP"];

  const getCategoryIcon = (cat: GPCategory) => {
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

  const getCategoryColor = (cat: GPCategory, isSelected: boolean) => {
    if (!isSelected) {
      return "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80 hover:border-white/10";
    }
    switch (cat) {
      case "Vibe GP":
        return "bg-pink-500/10 border-pink-500/30 text-pink-300 shadow-[0_0_15px_rgba(219,39,119,0.15)] scale-102 font-bold";
      case "Movie GP":
        return "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-102 font-bold";
      case "Anime GP":
        return "bg-orange-500/10 border-orange-500/30 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-102 font-bold";
      case "Other GP":
        return "bg-green-500/10 border-green-500/30 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-102 font-bold";
      default:
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-500/30 shadow-lg shadow-purple-500/10 scale-102 font-bold";
    }
  };

  const getDisplayGPs = () => {
    if (selectedCategory === "All") {
      // Show all categories in order
      const orderedCategories = ["Vibe GP", "Other GP", "Movie GP", "Anime GP"];
      return orderedCategories.filter(cat => gps[cat] && gps[cat].length > 0);
    }
    return selectedCategory && gps[selectedCategory] && gps[selectedCategory].length > 0
      ? [selectedCategory]
      : [];
  };


  return (
    <div className="w-full space-y-6">
      {/* Header with Breadcrumb and Create GP Button */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-wider">
          <span>Home</span>
          <ChevronRight className="w-4 h-4 text-white/20" />
          <span className="text-purple-300 font-extrabold">Groups Feed</span>
        </div>
        <button
          onClick={() => router.push("/gp/create")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-md shadow-purple-500/10 active:scale-95 transition-all font-extrabold text-xs uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Create GP</span>
        </button>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3.5 scrollbar-thin">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${getCategoryColor(category, selectedCategory === category)}`}
          >
            <span className="text-base">{getCategoryIcon(category)}</span>
            <span className="uppercase tracking-wider">{category}</span>
          </button>
        ))}
      </div>

      {/* GP Sections */}
      <div className="space-y-8">
        {loadingGPs ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin text-purple-400"></div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider">Loading local groups...</p>
          </div>
        ) : (
          <>
            {getDisplayGPs().length > 0 ? (
              getDisplayGPs().map((category) => (
                <GPSection key={category} category={category} gps={gps[category]} />
              ))
            ) : (
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-xl max-w-xl mx-auto flex flex-col items-center justify-center space-y-4">
                <p className="text-white/80 text-lg font-extrabold">
                  {selectedCategory === "All"
                    ? "No active groups nearby"
                    : `No active ${selectedCategory}s nearby`}
                </p>
                <p className="text-white/40 text-xs font-semibold max-w-xs leading-relaxed">
                  Be the first one in your area to create an active group and vibe together!
                </p>
                <button
                  onClick={() => router.push("/gp/create")}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-md active:scale-95 transition-all font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Create Group Profile
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}