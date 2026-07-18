"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "../../store/store";
import { useChatNotificationStore } from "../../store/chatStore";
import LeftSide from "./leftSide";
import LocationPermission from "./LocationPermission";
import { SocketProvider } from "../../hooks/useSocket";
import { Menu, X, MessageCircle } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { unreadCount } = useChatNotificationStore();
  const [locationGranted, setLocationGranted] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Exclude auth routes and landing page from having the sidebar and header
  const isAuthRoute = pathname === "/" ||
                      pathname === "/landing" ||
                      pathname?.startsWith("/login") || 
                      pathname?.startsWith("/signup") || 
                      pathname?.startsWith("/verifyemail");
  
  useEffect(() => {
    if (isAuthRoute || !user) {
      setCheckingLocation(false);
      return;
    }

    // Check if location is already granted
    checkLocationStatus();
  }, [user, isAuthRoute]);

  // Close sidebar drawer on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const checkLocationStatus = async () => {
    try {
      const { getUserLocation } = await import("../lib/api");
      const res = await getUserLocation();
      if (res?.success && res?.locationPermissionGranted) {
        setLocationGranted(true);
      }
    } catch (error) {
      // Location not set yet
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleLocationGranted = () => {
    setLocationGranted(true);
  };
  
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Show location permission screen if not granted
  if (!locationGranted && !checkingLocation) {
    return (
      <div className="flex h-screen w-full overflow-hidden font-sans bg-linear-to-br from-[#0a0118] via-[#1d0033] to-[#2a0044]">
        <LocationPermission onLocationGranted={handleLocationGranted} />
      </div>
    );
  }

  // Show loading while checking location
  if (checkingLocation) {
    return (
      <div className="flex h-screen w-full overflow-hidden font-sans bg-linear-to-br from-[#0a0118] via-[#1d0033] to-[#2a0044]">
        <LocationPermission onLocationGranted={handleLocationGranted} />
      </div>
    );
  }

  const profileInitial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <SocketProvider>
      <div className="flex h-screen w-full overflow-hidden font-sans bg-[#0a0118] text-[#F3EFFF]">
        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in-left {
            animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* Desktop Sidebar (hidden on mobile/tablet) */}
        <aside className="hidden md:block w-64 lg:w-72 h-screen shrink-0 border-r border-white/5 bg-[#1a0030]/50">
          <LeftSide />
        </aside>

        {/* Mobile/Tablet Sidebar Drawer (slides from left) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div 
              className="w-72 max-w-[80vw] h-full bg-[#150F26] shadow-2xl relative animate-slide-in-left flex flex-col"
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 overflow-hidden">
                <LeftSide onClose={() => setIsSidebarOpen(false)} />
              </div>
            </div>
            {/* Click outside backdrop to close */}
            <div className="flex-1 h-full" onClick={() => setIsSidebarOpen(false)} />
          </div>
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0118] min-w-0">
          {/* Mobile Top Header Bar */}
          <header className="flex md:hidden items-center justify-between px-4 h-16 border-b border-white/5 bg-[#150F26]/80 backdrop-blur-xl shrink-0 z-40 text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white/80 active:scale-95 transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="brand text-white flex items-center gap-[9px] font-bold">
                <span className="brand-dot bg-purple-500 w-2.5 h-2.5 rounded-full"></span>
                <span>vibess</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push("/chat")}
                className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white/80 transition-all relative"
                aria-label="Chats"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => user?.id && router.push(`/profile/${user.id}`)}
                className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-[#ff5d73] to-[#c65cff] flex items-center justify-center font-bold text-xs text-[#160E22] font-bricolage shrink-0"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileInitial
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}

