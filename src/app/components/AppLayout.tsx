"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "../../store/store";
import Header from "./Header";
import LeftSide from "./leftSide";
import LocationPermission from "./LocationPermission";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUserStore();
  const [locationGranted, setLocationGranted] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  
  // Exclude auth routes and landing page from having the sidebar and header
  const isAuthRoute = pathname?.startsWith("/login") || 
                      pathname?.startsWith("/signup") || 
                      pathname?.startsWith("/verifyemail") ||
                      pathname === "/landing";
  
  useEffect(() => {
    if (isAuthRoute || !user) {
      setCheckingLocation(false);
      return;
    }

    // Check if location is already granted
    checkLocationStatus();
  }, [user, isAuthRoute]);

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

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-linear-to-br from-[#0a0118] via-[#1d0033] to-[#2a0044]">
      {/* Left Sidebar - Menu & Library */}
      <aside className="w-64 lg:w-72 h-screen shrink-0 border-r border-white/5 bg-[#1a0030]/50">
        <LeftSide />
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0118]">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
