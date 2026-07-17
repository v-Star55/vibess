"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGPsForHome, getMyGPs } from "../lib/api";
import GPSection from "./GPSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type GPCategory = "Vibe GP" | "Movie GP" | "Anime GP" | "Other GP" | "All" | "My GP";

export default function Content() {
  const router = useRouter();
  const [gps, setGps] = useState<Record<string, any[]>>({});
  const [myGps, setMyGps] = useState<any[]>([]);
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
        const myRes = await getMyGPs();
        if (myRes.success && myRes.gps) {
          setMyGps(myRes.gps);
        }
      } catch (error) {
        console.error("Error loading GPs", error);
      } finally {
        setLoadingGPs(false);
      }
    };
    loadGPs();
  }, []);

  const dropdownCategories = ["Vibe GP", "Movie GP", "Anime GP", "Other GP"];

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
      case "My GP":
        return "👤";
      default:
        return "🔥";
    }
  };

  const getDisplayGPs = () => {
    if (selectedCategory === "All") {
      const orderedCategories = ["Vibe GP", "Other GP", "Movie GP", "Anime GP"];
      return orderedCategories.filter(cat => gps[cat] && gps[cat].length > 0);
    }
    return selectedCategory && gps[selectedCategory] && gps[selectedCategory].length > 0
      ? [selectedCategory]
      : [];
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Header with Breadcrumb and Create GP Button */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-4">
        <div className="crumbs flex items-center gap-2">
          <span>Home</span>
          <ChevronRight className="w-[13px] h-[13px] text-[#7c7196]" />
          <b>Groups</b>
        </div>
        <button
          onClick={() => router.push("/gp/create")}
          className="create-btn"
        >
          <Plus className="w-[16px] h-[16px] stroke-[2.4]" />
          <span>Create GP</span>
        </button>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-[9px] pb-2 overflow-visible flex-wrap">
        {/* All Button */}
        <button
          onClick={() => setSelectedCategory("All")}
          className={`filter-pill flex items-center gap-2 transition-all cursor-pointer ${
            selectedCategory === "All" ? "active" : ""
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold">All</span>
        </button>

        {/* My GP Button */}
        <button
          onClick={() => setSelectedCategory("My GP")}
          className={`filter-pill flex items-center gap-2 transition-all cursor-pointer ${
            selectedCategory === "My GP" ? "active" : ""
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold">My GP</span>
        </button>

        {/* Dropdown for Categories using shadcn Select */}
        <Select
          value={dropdownCategories.includes(selectedCategory) ? selectedCategory : ""}
          onValueChange={(val) => {
            if (val) {
              setSelectedCategory(val as GPCategory);
            }
          }}
        >
          <SelectTrigger
            className={`filter-pill flex items-center gap-2 border border-white/10 text-white/70 font-semibold cursor-pointer outline-none transition-all uppercase tracking-wider text-xs ${
              dropdownCategories.includes(selectedCategory) ? "active" : ""
            }`}
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#150F26] border border-white/10 rounded-2xl">
            {dropdownCategories.map((cat) => (
              <SelectItem 
                key={cat} 
                value={cat}
                className="text-[#b3a7ce] focus:bg-white/10 focus:text-white"
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* GP Sections */}
      <div className="space-y-8">
        {loadingGPs ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-[#c65cff] border-t-transparent rounded-full animate-spin text-[#c65cff]"></div>
            <p className="text-[#b3a7ce] text-xs font-semibold uppercase tracking-wider">Loading local groups...</p>
          </div>
        ) : (
          <>
            {selectedCategory === "My GP" ? (
              myGps.length > 0 ? (
                <GPSection key="My GP" category="My GP" gps={myGps} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-[70px_30px] border border-white/10 rounded-3xl bg-linear-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-2xl max-w-xl mx-auto gap-2">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-white/[0.09] to-white/[0.045] border border-white/15 flex items-center justify-center mb-2">
                    <Plus className="w-[26px] h-[26px] text-[#7c7196]" />
                  </div>
                  <h3 className="text-xl font-bold font-bricolage text-white">No joined groups</h3>
                  <p className="margin-0 text-[#b3a7ce] text-[13.5px] max-w-xs leading-normal">
                    You haven't joined any groups yet. Explore groups nearby and join one!
                  </p>
                </div>
              )
            ) : getDisplayGPs().length > 0 ? (
              getDisplayGPs().map((category) => (
                <GPSection key={category} category={category} gps={gps[category]} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-[70px_30px] border border-white/10 rounded-3xl bg-linear-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-2xl max-w-xl mx-auto gap-2">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-white/[0.09] to-white/[0.045] border border-white/15 flex items-center justify-center mb-2">
                  <Plus className="w-[26px] h-[26px] text-[#7c7196]" />
                </div>
                <h3 className="text-xl font-bold font-bricolage text-white">No groups available nearby</h3>
                <p className="margin-0 text-[#b3a7ce] text-[13.5px] max-w-xs leading-normal">
                  Try selecting a different category, or be the first to start one.
                </p>
                <button
                  onClick={() => router.push("/gp/create")}
                  className="create-btn mt-4"
                >
                  <Plus className="w-[16px] h-[16px] stroke-[2.4]" />
                  <span>Create the first {selectedCategory === "All" ? "GP" : selectedCategory}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}