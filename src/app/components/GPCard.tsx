"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MapPin, Clock, MessageSquare } from "lucide-react";
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
  onJoinSuccess?: () => void;
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
          // Redirect to groups page after joining
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
        return "from-pink-500/20 to-purple-500/20 border-pink-500/30";
      case "Movie GP":
        return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
      case "Anime GP":
        return "from-orange-500/20 to-red-500/20 border-orange-500/30";
      case "Other GP":
        return "from-green-500/20 to-teal-500/20 border-green-500/30";
      default:
        return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getCategoryColor(gp.category)} rounded-xl p-4 border backdrop-blur-sm hover:shadow-lg transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm">{gp.category}</span>
            <span className="text-white/60 text-xs">•</span>
            <span className="text-white/80 text-xs">{gp.subType}</span>
          </div>
          {gp.specificName && (
            <p className="text-white/90 text-sm font-medium mb-1">{gp.specificName}</p>
          )}
          {gp.genre && (
            <p className="text-white/70 text-xs">{gp.genre}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/60 text-xs">
          <Users className="w-3 h-3" />
          <span>{gp.memberCount}/{gp.maxMembers}</span>
        </div>
      </div>

      {/* Talk Topics */}
      <div className="flex flex-wrap gap-1 mb-2">
        {gp.talkTopics.slice(0, 2).map((topic, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-white/10 rounded-full text-white/80 text-xs"
          >
            {topic}
          </span>
        ))}
        {gp.talkTopics.length > 2 && (
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-white/60 text-xs">
            +{gp.talkTopics.length - 2}
          </span>
        )}
      </div>

      {/* Description */}
      {gp.description && (
        <p className="text-white/70 text-xs mb-2 line-clamp-2">{gp.description}</p>
      )}

      {/* Reason */}
      <div className="text-white/60 text-xs mb-3">
        <span className="font-medium">{gp.creationReason}</span>
        {gp.reasonNote && <span className="ml-1">• {gp.reasonNote}</span>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-white/60 text-xs">
          {gp.distance !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{gp.distance} km</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(gp.timeLeft)}</span>
          </div>
        </div>
        <button
          onClick={handleJoin}
          disabled={isJoining || gp.memberCount >= gp.maxMembers}
          className="px-4 py-1.5 bg-white text-purple-700 rounded-lg text-xs font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isJoining ? "Joining..." : gp.memberCount >= gp.maxMembers ? "Full" : "Join"}
        </button>
      </div>
    </div>
  );
}

