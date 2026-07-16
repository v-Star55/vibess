"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MapPin, Clock, Heart, Sparkles, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { joinGP } from "../lib/api";

interface GPCardProps {
  gp: {
    _id: string;
    category: string;
    subType: string;
    specificName?: string;
    genre?: string;
    talkTopics: string[];
    description?: string;
    lookingFor?: string[];
    whoIsItFor?: string[];
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
  };
  onJoinSuccess?: (gpId?: string) => void;
}

export default function GPCard({ gp, onJoinSuccess }: GPCardProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      const res = await joinGP(gp._id);
      if (res.success) {
        toast.success("Successfully joined GP!");
        if (onJoinSuccess) {
          onJoinSuccess(gp._id);
        } else {
          router.push("/groups");
        }
      } else {
        toast.error(res.message || "Failed to join GP");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to join GP");
    } finally {
      setIsJoining(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m left`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Vibe GP":
        return "from-pink-500/10 via-purple-600/10 to-indigo-500/10 border-pink-500/20 hover:border-pink-500/40 shadow-[0_8px_30px_rgba(219,39,119,0.08)]";
      case "Movie GP":
        return "from-blue-500/10 via-cyan-600/10 to-teal-500/10 border-blue-500/20 hover:border-blue-500/40 shadow-[0_8px_30px_rgba(59,130,246,0.08)]";
      case "Anime GP":
        return "from-orange-500/10 via-red-600/10 to-pink-500/10 border-orange-500/20 hover:border-orange-500/40 shadow-[0_8px_30px_rgba(249,115,22,0.08)]";
      case "Other GP":
        return "from-green-500/10 via-emerald-600/10 to-teal-500/10 border-green-500/20 hover:border-green-500/40 shadow-[0_8px_30px_rgba(34,197,94,0.08)]";
      default:
        return "from-purple-500/10 via-pink-600/10 to-indigo-500/10 border-purple-500/20 hover:border-purple-500/40 shadow-[0_8px_30px_rgba(168,85,247,0.08)]";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  const isCustomOther = gp.category === "Other GP" && gp.subType === "Other";

  return (
    <div className={`bg-gradient-to-br ${getCategoryColor(gp.category)} rounded-2xl p-5 border backdrop-blur-md hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full`}>
      <div>
        {/* Header section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm shrink-0">{getCategoryIcon(gp.category)}</span>
              <span className="text-white/80 font-bold text-xs tracking-wider uppercase">
                {isCustomOther ? "Other GP" : gp.category}
              </span>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-white/60 text-xs font-semibold">
                {isCustomOther ? "Custom Topic" : gp.subType}
              </span>
            </div>
            {/* Prominent specific topic name */}
            {gp.specificName ? (
              <h3 className="text-white font-extrabold text-base tracking-tight mb-1 line-clamp-1">
                {gp.specificName}
              </h3>
            ) : (
              <h3 className="text-white font-extrabold text-base tracking-tight mb-1 line-clamp-1">
                {gp.subType} Room
              </h3>
            )}
            {gp.genre && (
              <span className="inline-block px-2 py-0.5 bg-white/5 rounded-md text-white/50 text-[10px] uppercase font-bold tracking-wide">
                {gp.genre}
              </span>
            )}
          </div>
          {/* Members Badge */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-white/70 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{gp.memberCount}/{gp.maxMembers}</span>
          </div>
        </div>

        {/* Talk Topics (Tags) */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {gp.talkTopics.map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 text-[11px] font-medium"
            >
              #{topic}
            </span>
          ))}
        </div>

        {/* Description */}
        {gp.description ? (
          <p className="text-white/70 text-xs mb-4 line-clamp-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] italic">
            "{gp.description}"
          </p>
        ) : (
          <div className="h-2"></div>
        )}

        {/* Looking For */}
        {gp.lookingFor && gp.lookingFor.length > 0 && (
          <div className="mb-3">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Looking For</p>
            <div className="flex flex-wrap gap-1">
              {gp.lookingFor.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-white/80 text-[10px]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Who is this GP for? */}
        {gp.whoIsItFor && gp.whoIsItFor.length > 0 && (
          <div className="mb-4">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Target Audience</p>
            <div className="flex flex-wrap gap-1">
              {gp.whoIsItFor.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-md text-pink-300 text-[10px]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-white/50 text-xs">
          {gp.distance !== undefined && (
            <div className="flex items-center gap-1 hover:text-white transition-colors">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-medium">{gp.distance} km</span>
            </div>
          )}
          <div className="flex items-center gap-1 hover:text-white transition-colors">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">{formatTime(gp.timeLeft)}</span>
          </div>
        </div>
        <button
          onClick={handleJoin}
          disabled={isJoining || gp.memberCount >= gp.maxMembers}
          className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-200"
        >
          {isJoining ? "Joining..." : gp.memberCount >= gp.maxMembers ? "Full" : "Join GP"}
        </button>
      </div>
    </div>
  );
}


