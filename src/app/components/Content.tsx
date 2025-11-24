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
      return "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border-white/10";
    }
    switch (cat) {
      case "Vibe GP":
        return "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-pink-500/30";
      case "Movie GP":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border-blue-500/30";
      case "Anime GP":
        return "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white border-orange-500/30";
      case "Other GP":
        return "bg-gradient-to-r from-green-500/20 to-teal-500/20 text-white border-green-500/30";
      default:
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-500/30";
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span>Home</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Groups</span>
        </div>
        <button
          onClick={() => router.push("/gp/create")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create GP</span>
        </button>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide mb-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm whitespace-nowrap transition-all ${getCategoryColor(category, selectedCategory === category)}`}
          >
            <span className="text-lg">{getCategoryIcon(category)}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>

      {/* GP Sections */}
      <div className="space-y-8">
        {loadingGPs ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {getDisplayGPs().length > 0 ? (
              getDisplayGPs().map((category) => (
                <GPSection key={category} category={category} gps={gps[category]} />
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60 text-lg mb-2">
                  {selectedCategory === "All" 
                    ? "No groups available nearby" 
                    : `No ${selectedCategory} available nearby`}
                </p>
                <p className="text-white/40 text-sm">Try selecting a different category or create a group!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}