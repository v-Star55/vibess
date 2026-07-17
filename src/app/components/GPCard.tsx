"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Clock,
  Heart,
  Sparkles,
  MessageSquare,
  Film,
  Tv,
  Coffee,
  Dumbbell,
  Plane,
  Palette,
  Terminal,
  BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import { joinGP } from "../lib/api";

interface GPCardProps {
  gp: {
    _id: string;
    category: string;
    subType: string;
    specificName?: string;
    gpName?: string;
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
      case "Food & Cafe GP":
        return "from-amber-500/10 via-orange-600/10 to-red-500/10 border-amber-500/20 hover:border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.08)]";
      case "Fitness & Sports GP":
        return "from-emerald-500/10 via-lime-600/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.08)]";
      case "Travel GP":
        return "from-sky-500/10 via-blue-600/10 to-indigo-500/10 border-sky-500/20 hover:border-sky-500/40 shadow-[0_8px_30px_rgba(14,165,233,0.08)]";
      case "Hobbies & Creativity GP":
        return "from-fuchsia-500/10 via-purple-600/10 to-pink-500/10 border-fuchsia-500/20 hover:border-fuchsia-500/40 shadow-[0_8px_30px_rgba(217,70,239,0.08)]";
      case "Developer GP":
        return "from-teal-500/10 via-cyan-600/10 to-blue-500/10 border-teal-500/20 hover:border-teal-500/40 shadow-[0_8px_30px_rgba(20,184,166,0.08)]";
      case "Study GP":
        return "from-indigo-500/10 via-violet-600/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_8px_30px_rgba(99,102,241,0.08)]";
      case "Relationship GP":
        return "from-rose-500/10 via-red-600/10 to-pink-500/10 border-rose-500/20 hover:border-rose-500/40 shadow-[0_8px_30px_rgba(244,63,94,0.08)]";
      case "Other GP":
        return "from-green-500/10 via-emerald-600/10 to-teal-500/10 border-green-500/20 hover:border-green-500/40 shadow-[0_8px_30px_rgba(34,197,94,0.08)]";
      default:
        return "from-purple-500/10 via-pink-600/10 to-indigo-500/10 border-purple-500/20 hover:border-purple-500/40 shadow-[0_8px_30px_rgba(168,85,247,0.08)]";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Vibe GP":
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case "Movie GP":
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case "Anime GP":
        return <Tv className="w-3.5 h-3.5 text-orange-400" />;
      case "Food & Cafe GP":
        return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
      case "Fitness & Sports GP":
        return <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />;
      case "Travel GP":
        return <Plane className="w-3.5 h-3.5 text-sky-400" />;
      case "Hobbies & Creativity GP":
        return <Palette className="w-3.5 h-3.5 text-fuchsia-400" />;
      case "Developer GP":
        return <Terminal className="w-3.5 h-3.5 text-teal-400" />;
      case "Study GP":
        return <BookOpen className="w-3.5 h-3.5 text-indigo-400" />;
      case "Relationship GP":
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-green-400" />;
    }
  };

  const isCustomOther = gp.category === "Other GP" && gp.subType === "Other";

  return (
    <div className={`bg-gradient-to-br ${getCategoryColor(gp.category)} rounded-3xl p-6 border backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden`}>
      {/* Glow highlight inside card */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none -z-10 group-hover:bg-purple-500/10 transition-colors duration-300" />

      <div>
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                {getCategoryIcon(gp.category)}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-white/80 font-extrabold text-[10px] tracking-widest uppercase truncate">
                  {isCustomOther ? "Other GP" : gp.category}
                </span>
                <span className="text-white/40 text-[9px] font-bold tracking-wider uppercase truncate leading-tight mt-0.5">
                  {isCustomOther ? "Custom Topic" : gp.subType}
                </span>
              </div>
            </div>

            {/* Unique GP Handle */}
            {gp.gpName && (
              <h4 className="text-purple-300/80 font-bold text-xs tracking-wide truncate mb-1">
                @{gp.gpName}
              </h4>
            )}

            {/* Prominent specific topic name */}
            {gp.specificName ? (
              <h3 className="text-white font-extrabold text-lg tracking-tight mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors duration-200">
                {gp.specificName}
              </h3>
            ) : (
              <h3 className="text-white font-extrabold text-lg tracking-tight mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors duration-200">
                {gp.subType} Room
              </h3>
            )}

            {gp.genre && (
              <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-300 text-[9px] uppercase font-extrabold tracking-widest">
                {gp.genre}
              </span>
            )}
          </div>

          {/* Members Badge */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl text-white/80 text-xs font-bold shadow-sm">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{gp.memberCount}/{gp.maxMembers}</span>
          </div>
        </div>

        {/* Talk Topics (Tags) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {gp.talkTopics.map((topic, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-semibold transition-all"
            >
              #{topic}
            </span>
          ))}
        </div>

        {/* Description */}
        {gp.description ? (
          <p className="text-white/60 text-xs mb-5 line-clamp-2 bg-black/10 p-3 rounded-2xl border border-white/5 italic leading-relaxed">
            "{gp.description}"
          </p>
        ) : (
          <div className="h-2"></div>
        )}

        {/* Looking For */}
        {gp.lookingFor && gp.lookingFor.length > 0 && (
          <div className="mb-3.5">
            <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Looking For</p>
            <div className="flex flex-wrap gap-1.5">
              {gp.lookingFor.map((item, idx) => (
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

        {/* Who is this GP for? */}
        {gp.whoIsItFor && gp.whoIsItFor.length > 0 && (
          <div className="mb-5">
            <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Target Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {gp.whoIsItFor.map((item, idx) => (
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

      {/* Member Slot Progress Bar */}
      <div className="mb-5 space-y-1">
        <div className="flex justify-between text-[9px] text-white/40 font-bold uppercase tracking-wider">
          <span>Capacity Progress</span>
          <span>{Math.round((gp.memberCount / gp.maxMembers) * 100)}% Filled</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(gp.memberCount / gp.maxMembers) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-white/40 text-xs">
          {gp.distance !== undefined && (
            <div className="flex items-center gap-1 hover:text-white/70 transition-colors cursor-help">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span className="font-semibold text-[11px]">{gp.distance} km</span>
            </div>
          )}
          <div className="flex items-center gap-1 hover:text-white/70 transition-colors">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-[11px]">{formatTime(gp.timeLeft)}</span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={isJoining || gp.memberCount >= gp.maxMembers}
          className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-200 uppercase tracking-wider"
        >
          {isJoining ? "Joining..." : gp.memberCount >= gp.maxMembers ? "Full" : "Join GP"}
        </button>
      </div>
    </div>
  );
}


