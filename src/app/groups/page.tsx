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
            {gps.map((gp) => (
              <div
                key={gp._id}
                className={`bg-gradient-to-br ${getCategoryColor(gp.category)} rounded-xl p-5 border backdrop-blur-sm hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
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
                  {gp.isPermanent && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                      Permanent
                    </span>
                  )}
                </div>

                {/* Talk Topics */}
                <div className="flex flex-wrap gap-1 mb-3">
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
                  <p className="text-white/70 text-xs mb-3 line-clamp-2">{gp.description}</p>
                )}

                {/* Members */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    {gp.members.slice(0, 3).map((member: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#1a0030] flex items-center justify-center text-white text-xs font-semibold"
                      >
                        {member?.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{member?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                    ))}
                    {gp.memberCount > 3 && (
                      <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#1a0030] flex items-center justify-center text-white text-xs font-semibold">
                        +{gp.memberCount - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Users className="w-3 h-3" />
                    <span>{gp.memberCount}/{gp.maxMembers}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(gp.timeLeft)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/chat-room?gpId=${gp._id}`)}
                      className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition-all"
                    >
                      Open
                    </button>
                    {!gp.isPermanent && (
                      <button
                        onClick={() => handleLeave(gp._id)}
                        disabled={leavingId === gp._id}
                        className="p-1.5 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white transition-all disabled:opacity-50"
                        title="Leave group"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


