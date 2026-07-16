"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MapPin, Clock, MessageSquare, Plus, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { getMyGPs, leaveGP } from "../lib/api";

interface GP {
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
  moderator?: any;
  expiresAt: string;
  timeLeft: number | null;
  status: string;
  isPermanent: boolean;
  isPermanentConversionEligible: boolean;
  createdAt: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [gps, setGps] = useState<GP[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    loadMyGPs();
  }, []);

  const loadMyGPs = async () => {
    try {
      setLoading(true);
      const res = await getMyGPs();
      if (res.success && res.gps) {
        setGps(res.gps);
      }
    } catch (error) {
      console.error("Error loading my GPs:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (gpId: string) => {
    if (leavingId) return;
    
    setLeavingId(gpId);
    try {
      const res = await leaveGP(gpId);
      if (res.success) {
        toast.success("Left group successfully");
        setGps((prev) => prev.filter((gp) => gp._id !== gpId));
      } else {
        toast.error(res.message || "Failed to leave group");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    } finally {
      setLeavingId(null);
    }
  };

  const handleJoinGP = () => {
    router.push("/app-home");
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "Permanent";
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-y-auto h-full">
      <section className="flex-1 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Groups</h1>
            <p className="text-white/60 text-sm">Groups you've joined</p>
          </div>
          <button
            onClick={handleJoinGP}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold">Join Groups</span>
          </button>
        </div>

        {/* GPs List */}
        {gps.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg mb-2">No groups yet</p>
            <p className="text-white/40 text-sm mb-6">Join groups from the home page to see them here</p>
            <button
              onClick={handleJoinGP}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
            >
              Browse Groups
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gps.map((gp) => {
              const isCustomOther = gp.category === "Other GP" && gp.subType === "Other";
              return (
                <div
                  key={gp._id}
                  className={`bg-gradient-to-br ${getCategoryColor(gp.category)} rounded-2xl p-5 border backdrop-blur-md hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between`}
                >
                  <div>
                    {/* Header info */}
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
                        {/* Prominent title */}
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
                      {gp.isPermanent ? (
                        <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl shrink-0">
                          Permanent
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-white/70 text-xs font-semibold shrink-0">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>{gp.memberCount}/{gp.maxMembers}</span>
                        </div>
                      )}
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

                    {/* Members Avatar Bubbles */}
                    <div className="flex items-center gap-3 mb-4 pt-1">
                      <div className="flex -space-x-2">
                        {gp.members.slice(0, 3).map((member: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#130623] flex items-center justify-center text-white text-xs font-semibold overflow-hidden"
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
                          <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#130623] flex items-center justify-center text-white text-xs font-semibold">
                            +{gp.memberCount - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-white/50 text-xs">
                        {gp.memberCount} active members
                      </span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-semibold">{formatTime(gp.timeLeft)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/chat-room?gpId=${gp._id}`)}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                      >
                        Open Chat
                      </button>
                      {!gp.isPermanent && (
                        <button
                          onClick={() => handleLeave(gp._id)}
                          disabled={leavingId === gp._id}
                          className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                          title="Leave group"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


