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
  HeartHandshake,
} from "lucide-react";

export default function LeftSide({ onClose }: { onClose?: () => void }) {
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
    { icon: HeartHandshake, label: "Listen", path: "/listen" },
    { icon: FileText, label: "Groups", path: "/groups" },
    { icon: MessageCircle, label: "Whisper Space", path: "/whisper-space" },
    { icon: Gamepad2, label: "Games", path: "/games" },
  ];

  const vibeItems = [
    { icon: Sparkles, label: "Vibe Match", path: "/vibe/discover" },
    { icon: Flame, label: "Create Vibe", path: "/vibe/create" },
    { icon: MapPin, label: "Vibe Heatmap", path: "/vibe/heatmap" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    if (onClose) onClose();
  };

  const handleProfileClick = () => {
    if (user?.id) {
      router.push(`/profile/${user.id}`);
      if (onClose) onClose();
    }
  };



  return (
    <div className="flex flex-col h-full w-full bg-[#150F26] border-r border-[#f3efff]/10 p-[22px_16px_18px] overflow-y-auto gap-[22px] font-sans">
      {/* Brand logo */}
      <div className="sidebar-logo flex items-center justify-between px-1">
        <div className="brand text-white flex items-center gap-[9px]">
          <span className="brand-dot"></span>
          <span>vibess</span>
        </div>
      </div>

      {/* Cosmetic Search Bar */}
      <div className="side-search glass">
        <Search className="w-[15px] h-[15px] text-[#7c7196] shrink-0" />
        <input 
          type="text" 
          placeholder="Search vibes, people, GPs..." 
          className="flex-1 bg-transparent border-none outline-none text-white text-[13px] placeholder-[#7c7196]"
        />
        <kbd className="font-mono text-[10px] text-[#7c7196] border border-white/10 px-1.5 py-0.5 rounded-[5px]">/</kbd>
      </div>

      {/* Menu Navigation */}
      <nav className="nav-group">
        <span className="eyebrow">Menu</span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item w-full text-left transition-all ${isActive ? "active" : ""}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="lbl flex-1 truncate">{item.label}</span>
              {item.label === "Chats" && unreadCount > 0 && (
                <span className="badge shrink-0">{unreadCount}</span>
              )}
              <ChevronRight className="chev-r shrink-0" />
            </button>
          );
        })}
      </nav>

      {/* Vibes Navigation */}
      <nav className="nav-group">
        <span className="eyebrow">Vibes</span>
        {vibeItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item w-full text-left transition-all ${isActive ? "active" : ""}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="lbl flex-1 truncate">{item.label}</span>
              <ChevronRight className="chev-r shrink-0" />
            </button>
          );
        })}
      </nav>

      {/* Advice for the day */}
      <div className="advice-card glass mt-auto">
        <div className="ic-row flex items-center gap-2">
          <Lightbulb className="w-[15px] h-[15px] text-[#ffb25e]" />
          <span className="eyebrow">Advice for the day</span>
        </div>
        {loadingAdvice ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ffb25e]" />
            <span className="text-[#b3a7ce] text-xs">Loading...</span>
          </div>
        ) : dailyAdvice ? (
          <p className="margin-0 text-[12.5px] text-[#b3a7ce] leading-[1.55]">{dailyAdvice}</p>
        ) : (
          <p className="margin-0 text-[12.5px] text-[#7c7196] leading-[1.55]">No advice available</p>
        )}
      </div>

      {/* Profile Card at the bottom */}
      <div onClick={handleProfileClick} className="profile-bottom mt-1">
        <div className="avatar-lg shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold font-bricolage text-[#160E22] bg-gradient-to-br from-[#ff5d73] to-[#c65cff]">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            profileInitial
          )}
        </div>
        <div className="profile-meta flex-1 text-left min-w-0">
          <div className="name font-bold text-[13.5px] text-white truncate">{user?.name || "User"}</div>
          <div className="handle text-[11.5px] text-[#7c7196] truncate">
            {user?.username ? `@${user.username}` : "Just vibing"}
          </div>
        </div>
        <div className="dots flex flex-col gap-[3px] shrink-0 p-[6px]">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}