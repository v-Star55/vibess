"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import GPCard from "./GPCard";
import { getGPsForHome, getMyGPs } from "../lib/api";

interface GP {
  _id: string;
  category: string;
  subType: string;
  specificName?: string;
  genre?: string;
  talkTopics: string[];
  description?: string;
  creationReason: string;
  reasonNote?: string;
  members: any[];
  memberCount: number;
  maxMembers: number;
  createdBy: any;
  distance?: number;
  timeLeft: number;
  city?: string;
  zone?: string;
}

interface GPSectionProps {
  category: string;
  gps: GP[];
}

export default function GPSection({ category, gps }: GPSectionProps) {
  const router = useRouter();
  const [localGPs, setLocalGPs] = useState(gps);

  const handleJoinSuccess = async (joinedGPId?: string) => {
    // Remove joined GP from list
    if (joinedGPId) {
      setLocalGPs((prev) => prev.filter((gp) => gp._id !== joinedGPId));
    }
    // Reload all GPs to get updated list
    await loadGPs();
  };

  const loadGPs = async () => {
    try {
      if (category === "My GP") {
        const res = await getMyGPs();
        if (res.success && res.gps) {
          setLocalGPs(res.gps);
        }
      } else {
        const res = await getGPsForHome();
        if (res.success && res.gps[category]) {
          setLocalGPs(res.gps[category]);
        }
      }
    } catch (error) {
      console.error("Error reloading GPs:", error);
    }
  };

  if (!gps || gps.length === 0) return null;

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
        return "💬";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryIcon(category)}</span>
          <h2 className="text-white font-semibold text-lg">{category}</h2>
          <span className="text-white/40 text-sm">({localGPs.length})</span>
        </div>
        <button
          onClick={() => router.push(`/explore?category=${encodeURIComponent(category)}`)}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm transition-colors"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localGPs.map((gp) => (
          <GPCard key={gp._id} gp={gp} onJoinSuccess={handleJoinSuccess} />
        ))}
      </div>
    </div>
  );
}

