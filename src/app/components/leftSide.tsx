"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "@/src/store/store";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { getUser, getDailyAdvice } from "../lib/api";
import {
  Compass,
  Search,
  Users,
  FileText,
  Gamepad2,
  MapPin,
  ChevronRight,
  Sparkles,
  Flame,
  MessageCircle,
  Lightbulb,
  Loader2,
} from "lucide-react";

export default function LeftSide() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUserStore();
  const { unreadCount } = useChatNotificationStore();
  const profileInitial = user?.name?.charAt(0)?.toUpperCase() ?? "U";
  const [dailyAdvice, setDailyAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Fetch user data on mount if not already loaded
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUser();
        const apiUser = res?.data?.user;
        if (apiUser) {
          setUser({
            id: apiUser._id,
            name: apiUser.name,
            email: apiUser.email,
            username: apiUser.username,
            profileImage: apiUser.profileImage,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    // Only fetch if user is not already loaded
    if (!user) {
      fetchUser();
    }
  }, [user, setUser]);

  // Fetch daily advice on mount
  useEffect(() => {
    const fetchAdvice = async () => {
      if (!user) return;
      setLoadingAdvice(true);
      try {
        const res = await getDailyAdvice();
        if (res.success && res.advice) {
          setDailyAdvice(res.advice);
        } else {
          // If API returns error but has message, log it
          console.warn("Failed to fetch daily advice:", res.message || "Unknown error");
        }
      } catch (error: any) {
        console.error("Failed to fetch daily advice:", error);
        // Don't show error to user, just log it
      } finally {
        setLoadingAdvice(false);
      }
    };

    fetchAdvice();
  }, [user]);

  const menuItems = [
    { icon: Compass, label: "Discover", path: "/app-home" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: MessageCircle, label: "Chats", path: "/chat" },
    { icon: Users, label: "Chat Rooms", path: "/chat-room" },
    { icon: FileText, label: "Groups", path: "/groups" },
    { icon: MessageCircle, label: "Whisper Space", path: "/whisper-space" },
    { icon: Gamepad2, label: "Games", path: "/games" },
  ];

  const vibeItems = [
    { icon: Sparkles, label: "Vibe Discover", path: "/vibe/discover" },
    { icon: Flame, label: "Create Vibe", path: "/vibe/create" },
    { icon: MapPin, label: "Vibe Heatmap", path: "/vibe/heatmap" },
  ];

  const handleProfileClick = () => {
    if (user?.id) {
      router.push(`/profile/${user.id}`);
    }
  };



  return (
    <div className="flex flex-col h-full w-full bg-[#1a0030]/80 backdrop-blur-sm overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50 bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {user?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImage}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profileInitial}</span>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name || "User"}</p>
            <p className="text-white/60 text-xs truncate">
              {user?.username ? `@${user.username}` : "Just vibing"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
        </button>
      </div>

      {/* Menu Section */}
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">MENU</h3>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-purple-500/20 text-white border border-purple-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-purple-400' : ''}`} />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </div>
          <div className="flex items-center gap-2 shrink-0">
            {item.label === "Chats" && unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-[10px] font-semibold">
                {Math.min(unreadCount, 9)}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-white/40'}`} />
          </div>
            </button>
          );
        })}
      </div>

      {/* Vibe Section */}
      <div className="p-4 space-y-2 border-t border-white/10">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">VIBES</h3>
        {vibeItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-pink-500/20 text-white border border-pink-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-pink-300' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isActive ? 'text-pink-300' : 'text-white/40'}`} />
            </button>
          );
        })}
      </div>

      {/* Advice for the Day Section */}
      <div className="p-4 space-y-2 border-t border-white/10">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">ADVICE FOR THE DAY</h3>
        <div className="rounded-xl border border-purple-500/30 p-4 bg-linear-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          {loadingAdvice ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-white/60 text-sm">Loading advice...</span>
            </div>
          ) : dailyAdvice ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Advice</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{dailyAdvice}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/60 text-sm">No advice available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}