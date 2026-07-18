"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { getVibeHeatmap } from "../../lib/vibeApi";
import { getUserProfile, updateUserProfile } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Loader2,
  MapPin,
  TrendingUp,
  Sliders,
  Eye,
  EyeOff,
  Shield,
  X,
  Compass,
  Sparkles,
  Flame,
  Info
} from "lucide-react";

export default function VibeHeatmapPage() {
  const router = useRouter();
  const { user } = useUserStore();
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"radar" | "filters">("radar");
  
  // Settings & Filters
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  const [scanRadius, setScanRadius] = useState<number>(50); // Default to 50km
  const [minEnergy, setMinEnergy] = useState<number>(1);
  const [selectedIntent, setSelectedIntent] = useState<string>("");
  
  // Privacy states synced with User profile
  const [appearInHeatmap, setAppearInHeatmap] = useState(true);
  const [showExactDistance, setShowExactDistance] = useState(true);

  // Selection
  const [selectedVibe, setSelectedVibe] = useState<any>(null);
  const [hoveredVibe, setHoveredVibe] = useState<any>(null);
  
  // Stable random simulated offset for user coordinates demo
  const simulatedOffsetRef = useRef<{ latOffset: number; lngOffset: number } | null>(null);
  if (!simulatedOffsetRef.current) {
    // 0.005 to 0.012 lat/lng degrees (approx 500m to 1.3km)
    const r = 0.005 + Math.random() * 0.007;
    const theta = Math.random() * 2 * Math.PI;
    simulatedOffsetRef.current = {
      latOffset: r * Math.sin(theta),
      lngOffset: r * Math.cos(theta),
    };
  }

  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getMyVibeCoordinates = () => {
    if (!location) return null;
    const serverCard = heatmap?.vibes?.find((v: any) => v.user?.username === user?.username);
    if (showExactDistance) {
      return {
        lat: location.lat,
        lng: location.lng,
        isSimulated: false,
        distanceOffset: 0
      };
    } else {
      if (serverCard && serverCard.location?.coordinates) {
        return {
          lat: serverCard.location.coordinates[1],
          lng: serverCard.location.coordinates[0],
          isSimulated: false,
          distanceOffset: getDistanceInKm(
            location.lat,
            location.lng,
            serverCard.location.coordinates[1],
            serverCard.location.coordinates[0]
          )
        };
      } else {
        const offset = simulatedOffsetRef.current || { latOffset: 0.008, lngOffset: -0.008 };
        const simLat = location.lat + offset.latOffset;
        const simLng = location.lng + offset.lngOffset;
        return {
          lat: simLat,
          lng: simLng,
          isSimulated: true,
          distanceOffset: getDistanceInKm(location.lat, location.lng, simLat, simLng)
        };
      }
    }
  };

  const myVibeCard = heatmap?.vibes?.find((v: any) => v.user?.username === user?.username);
  const shouldRenderCenterDot = useLocation && location && (!myVibeCard || !showExactDistance);
  const myCoordsInfo = getMyVibeCoordinates();

  const handleMyNodeClick = () => {
    if (!location) return;
    const coordsInfo = getMyVibeCoordinates();
    
    setSelectedVibe({
      _id: "me",
      emoji: "📍",
      description: showExactDistance 
        ? "This is your true scanning center node." 
        : "This is your randomized coordinate signal.",
      currentIntent: showExactDistance ? ["Exact Position"] : ["Decoy Signal", "Anonymized"],
      vibeScore: { energy: 90, positivity: 95 },
      location: { 
        type: "Point", 
        coordinates: coordsInfo ? [coordsInfo.lng, coordsInfo.lat] : [location.lng, location.lat] 
      },
      user: {
        name: `${user?.name || "You"} (Me)`,
        username: user?.username || "me",
        profileImage: user?.profileImage || ""
      },
      isMeNode: true
    });
  };

  // Intent Options list
  const INTENTS = [
    "Chill conversation",
    "Make a friend",
    "Share thoughts",
    "Rant / vent",
    "Get motivated",
    "Need advice",
    "Want to laugh",
    "No talking, just vibe",
    "Gaming buddy",
    "Travel buddy",
    "Study together",
    "Deep conversations",
  ];

  // Load User Geolocation and Profile settings on mount
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadProfileAndLocation = async () => {
      setLoading(true);
      try {
        // Fetch profile settings (appearInHeatmap, showExactDistance)
        const profileRes = await getUserProfile();
        if (profileRes?.data?.profile?.user) {
          const u = profileRes.data.profile.user;
          setAppearInHeatmap(u.appearInHeatmap !== false);
          setShowExactDistance(u.showExactDistance !== false);
        }

        // Fetch browser location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
              setUseLocation(true);
            },
            () => {
              // Denied geolocation
              setUseLocation(false);
            }
          );
        } else {
          setUseLocation(false);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndLocation();
  }, [user, router]);

  // Fetch heatmap data when parameters change
  useEffect(() => {
    if (loading) return;
    fetchHeatmapData();
  }, [useLocation, location, scanRadius, loading]);

  const fetchHeatmapData = async () => {
    setScanning(true);
    try {
      const activeLat = useLocation && location ? location.lat : undefined;
      const activeLng = useLocation && location ? location.lng : undefined;
      
      // Request detailed visual vibe cards from heatmap API
      const res = await getVibeHeatmap(activeLat, activeLng, scanRadius, true);
      if (res.success) {
        setHeatmap(res.heatmap);
      }
    } catch (error: any) {
      toast.error("Failed to scan vibe heatmap");
    } finally {
      // Keep radar scanning visual going for at least 800ms for premium radar feedback feel
      setTimeout(() => setScanning(false), 800);
    }
  };

  // Toggle privacy switch helpers (calls updates immediately)
  const handleToggleIncognito = async () => {
    const newValue = !appearInHeatmap;
    setAppearInHeatmap(newValue);
    try {
      const formData = new FormData();
      formData.append("appearInHeatmap", String(newValue));
      await updateUserProfile(formData);
      toast.success(newValue ? "Visible on Radar Scan" : "Incognito mode active");
      // Refetch data
      fetchHeatmapData();
    } catch (error) {
      setAppearInHeatmap(!newValue);
      toast.error("Failed to save setting");
    }
  };

  const handleToggleExact = async () => {
    const newValue = !showExactDistance;
    setShowExactDistance(newValue);
    try {
      const formData = new FormData();
      formData.append("showExactDistance", String(newValue));
      await updateUserProfile(formData);
      toast.success(newValue ? "Showing exact distance" : "Fuzzy location offset enabled");
      // Refetch data
      fetchHeatmapData();
    } catch (error) {
      setShowExactDistance(!newValue);
      toast.error("Failed to save setting");
    }
  };



  // Compute coordinate relative scaling on visual radar grid
  const centerLat = useLocation && location ? location.lat : 0;
  const centerLng = useLocation && location ? location.lng : 0;

  const getRadarPosition = (vibeLat: number, vibeLng: number, isMeDecoy: boolean = false) => {
    // If no coordinates are present, display points in relative orbits
    if (centerLat === 0 && centerLng === 0) {
      return { x: 50, y: 50, distance: 0 };
    }

    const dy = vibeLat - centerLat;
    const dx = vibeLng - centerLng;

    // Approximate km conversions
    const dyKm = dy * 111.32;
    const dxKm = dx * 111.32 * Math.cos((centerLat * Math.PI) / 180);

    const distance = Math.sqrt(dxKm * dxKm + dyKm * dyKm);
    
    // Scale positioning relative to selected scanRadius
    if (distance > scanRadius * 1.15 && !isMeDecoy) {
      return null; // hide if way beyond grid boundary
    }

    const angle = Math.atan2(dyKm, dxKm);
    // Bind position strictly within circular radar container (max 94% width)
    const ratio = Math.min(distance / scanRadius, 0.94);
    
    // Force a minimum visual offset of 28% for the decoy pin so it stands out outside the center user node
    const visualRatio = isMeDecoy ? Math.max(ratio, 0.28) : ratio;

    const x = 50 + Math.cos(angle) * visualRatio * 50;
    const y = 50 - Math.sin(angle) * visualRatio * 50;

    return { x, y, distance };
  };

  // Filter vibes lists based on filters client-side
  const getFilteredVibes = () => {
    if (!heatmap?.vibes) return [];
    return heatmap.vibes.filter((v: any) => {
      // Filter by min energy level
      if (v.vibeScore?.energy && v.vibeScore.energy < minEnergy * 10) return false;
      // Filter by intent
      if (selectedIntent && !v.currentIntent?.includes(selectedIntent)) return false;
      return true;
    });
  };

  const filteredVibes = getFilteredVibes();

  // Compute final screen positions and resolve coordinate overlaps using golden spiral offsets
  const getResolvedPins = () => {
    // 1. Calculate base radar position for each visible node
    const pins = filteredVibes
      .map((vibe: any) => {
        const isMyCard = vibe.user?.username === user?.username;
        const isMeDecoy = isMyCard && !showExactDistance;
        const pos = getRadarPosition(vibe.location.coordinates[1], vibe.location.coordinates[0], isMeDecoy);
        if (!pos) return null;
        return { vibe, pos, isMyCard, isMeDecoy };
      })
      .filter((p: any) => p !== null) as Array<{
        vibe: any;
        pos: { x: number; y: number; distance: number };
        isMyCard: boolean;
        isMeDecoy: boolean;
      }>;

    // 2. Group pins by their coordinates
    const coordinateGroups: { [key: string]: typeof pins } = {};
    pins.forEach((item) => {
      let lat = item.vibe.location.coordinates[1];
      let lng = item.vibe.location.coordinates[0];
      // Use decoy/fuzzed location if it is a decoy node
      if (item.isMeDecoy && myCoordsInfo) {
        lat = myCoordsInfo.lat;
        lng = myCoordsInfo.lng;
      }
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!coordinateGroups[key]) {
        coordinateGroups[key] = [];
      }
      coordinateGroups[key].push(item);
    });

    // 3. Resolve overlaps by applying spiral displacement offsets
    return Object.values(coordinateGroups).flatMap((group) => {
      if (group.length === 1) {
        return [{
          ...group[0],
          displayPos: group[0].pos
        }];
      }

      return group.map((item, index) => {
        const angle = index * 2.39996; // Golden angle in radians
        // Offset starting at 4.5% of canvas radius and expanding slightly
        const radius = 4.5 + Math.sqrt(index) * 1.5;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        return {
          ...item,
          displayPos: {
            x: item.pos.x + offsetX,
            y: item.pos.y + offsetY,
            distance: item.pos.distance
          }
        };
      });
    });
  };

  const resolvedPins = getResolvedPins();

  if (loading) {
    return (
      <div className="bg-[#0a0118] w-full h-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-3" />
        <p className="text-white/60 text-sm font-medium animate-pulse">Initializing Vibe Radar...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[#0a0118] text-white">
      
      {/* Dynamic inline styles for premium scan keyframes */}
      <style>{`
        @keyframes radar-scan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ring-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .animate-radar-scan {
          animation: radar-scan 6s linear infinite;
        }
        .animate-ring-pulse {
          animation: ring-glow-pulse 2.5s ease-in-out infinite;
        }
        .radar-grid-bg {
          background-image: 
            radial-gradient(circle, rgba(168, 85, 247, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
          background-size: 20px 20px, 40px 40px, 40px 40px;
        }
      `}</style>

      {/* LEFT SIDEBAR: Stats, Privacy, & Visualizations */}
      <aside className={`w-full lg:w-[380px] shrink-0 h-full border-r border-white/5 bg-[#0f0224]/70 backdrop-blur-xl flex flex-col overflow-y-auto p-6 scrollbar-thin ${
        activeMobileTab === "filters" ? "flex" : "hidden lg:flex"
      }`}>
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Compass className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-white via-[#f3efff] to-purple-300 bg-clip-text text-transparent uppercase tracking-wider">
              Vibe Radar
            </h1>
            <p className="text-xs text-[#7C7196] font-semibold">Real-time local vibe mapping</p>
          </div>
        </div>

        {/* Global vs Local Switcher */}
        <div className="mb-6 bg-white/5 p-1 rounded-2xl border border-white/10 flex">
          <button
            onClick={() => {
              if (location) {
                setUseLocation(true);
              } else {
                toast.error("Location access not granted");
              }
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              useLocation && location
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Local Radar
          </button>
          <button
            onClick={() => setUseLocation(false)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              !useLocation || !location
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Global Scan
          </button>
        </div>

        {/* Quick Privacy Widget */}
        <div className="mb-6 bg-white/5 border border-white/5 rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Shield className="w-4 h-4" />
            <span>Radar Privacy Controls</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="min-w-0 pr-2">
              <span className="font-semibold text-white/90 block">Radar Visibility</span>
              <span className="text-[10px] text-[#7C7196] block truncate">Appear to nearby scans</span>
            </div>
            <button
              onClick={handleToggleIncognito}
              className={`w-9 h-[20px] rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                appearInHeatmap ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]" : "bg-white/10"
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                  appearInHeatmap ? "translate-x-[16px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="min-w-0 pr-2">
              <span className="font-semibold text-white/90 block">Anonymize Location</span>
              <span className="text-[10px] text-[#7C7196] block truncate">Use random coordinate offset</span>
            </div>
            <button
              onClick={handleToggleExact}
              className={`w-9 h-[20px] rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                !showExactDistance ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]" : "bg-white/10"
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                  !showExactDistance ? "translate-x-[16px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Aggregated Sidebar Data (Trending Moods) */}
        {heatmap && (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Trending Moods */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">Trending Moods</span>
              </div>
              
              {heatmap.trendingMoods && heatmap.trendingMoods.length > 0 ? (
                <div className="space-y-2">
                  {heatmap.trendingMoods.slice(0, 4).map((item: any, idx: number) => {
                    const topCount = heatmap.trendingMoods[0].count;
                    const percent = topCount > 0 ? (item.count / topCount) * 100 : 0;
                    return (
                      <div key={idx} className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white/90 capitalize">{item.mood}</span>
                          <span className="text-white/40 text-[10px]">{item.count} active</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/40 text-xs text-center py-4 bg-white/5 rounded-2xl border border-white/5">No active local moods</p>
              )}
            </div>

            {/* Trending Emojis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">Active Emojis</span>
              </div>

              {heatmap.trendingEmojis && heatmap.trendingEmojis.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {heatmap.trendingEmojis.slice(0, 10).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 rounded-2xl py-2 flex flex-col items-center justify-center relative hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                      title={`${item.count} people feeling this`}
                    >
                      <span className="text-2xl mb-0.5">{item.emoji}</span>
                      <span className="text-[9px] font-bold text-white/50">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-xs text-center py-4 bg-white/5 rounded-2xl border border-white/5">No emojis active</p>
              )}
            </div>

          </div>
        )}

      </aside>

      {/* CENTER & RIGHT: Radar Screen & Filters */}
      <section className={`flex-1 h-full flex flex-col relative overflow-hidden ${
        activeMobileTab === "radar" ? "flex" : "hidden lg:flex"
      }`}>
        
        {/* Top Control Bar: Active scan parameters summary */}
        <header className="p-4 border-b border-white/5 bg-[#0a0118]/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${scanning ? "bg-cyan-400 animate-ping" : "bg-emerald-400"} shrink-0`} />
            <div className="text-xs font-bold text-[#B3A7CE] flex items-center gap-1.5">
              <span>Status:</span>
              <span className={scanning ? "text-cyan-400" : "text-white"}>
                {scanning ? "Sweeping radar grid..." : `Grid Lock (${filteredVibes.length} matches)`}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-[#7C7196] font-semibold hidden md:flex items-center gap-2">
            <span>Scan Coordinates:</span>
            <span className="text-white font-mono bg-white/5 py-1 px-2 rounded-lg">
              {centerLat ? `${centerLat.toFixed(4)}°N, ${centerLng.toFixed(4)}°E` : "Global View"}
            </span>
          </div>
        </header>

        {/* RADAR CANVAS SPACE */}
        <div className="flex-1 w-full relative flex items-center justify-center p-6 radar-grid-bg overflow-hidden select-none">
          
          {/* Main Glowing Radar Circle */}
          <div className="relative w-full max-w-[500px] aspect-square rounded-full border border-purple-500/20 bg-[#0e0024]/40 shadow-[0_0_80px_rgba(168,85,247,0.05)] flex items-center justify-center overflow-hidden">
            
            {/* Sonar Sweep Line */}
            <div className="absolute inset-0 origin-center animate-radar-scan z-0 pointer-events-none">
              <div 
                className="w-1/2 h-full bg-gradient-to-r from-transparent to-purple-500/25 border-r-2 border-purple-500/60"
                style={{
                  clipPath: "polygon(100% 0, 100% 100%, 0 50%)"
                }}
              />
            </div>

            {/* Concentric rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-purple-500/10 pointer-events-none" />
            <div className="absolute w-[60%] h-[60%] rounded-full border border-purple-500/10 pointer-events-none" />
            <div className="absolute w-[40%] h-[40%] rounded-full border border-purple-500/10 pointer-events-none" />
            <div className="absolute w-[20%] h-[20%] rounded-full border border-purple-500/10 pointer-events-none" />

            {/* Grid Crosshairs */}
            <div className="absolute w-full h-[1px] bg-purple-500/10 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-purple-500/10 pointer-events-none" />

            {/* Ring labels */}
            <span className="absolute bottom-[11%] left-[51%] text-[9px] font-bold text-white/35 pointer-events-none">{(scanRadius * 0.8).toFixed(0)} km</span>
            <span className="absolute bottom-[21%] left-[51%] text-[9px] font-bold text-white/35 pointer-events-none">{(scanRadius * 0.6).toFixed(0)} km</span>
            <span className="absolute bottom-[31%] left-[51%] text-[9px] font-bold text-white/35 pointer-events-none">{(scanRadius * 0.4).toFixed(0)} km</span>
            <span className="absolute bottom-[41%] left-[51%] text-[9px] font-bold text-white/35 pointer-events-none">{(scanRadius * 0.2).toFixed(0)} km</span>

            {/* SVG Link line for location anonymization */}
            {useLocation && location && !showExactDistance && myCoordsInfo && (
              (() => {
                const pos = getRadarPosition(myCoordsInfo.lat, myCoordsInfo.lng);
                if (!pos) return null;
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${pos.x}%`}
                      y2={`${pos.y}%`}
                      stroke="#33D6C0"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  </svg>
                );
              })()
            )}

            {/* Center Node (User Node) */}
            {shouldRenderCenterDot && (
              <div 
                onClick={handleMyNodeClick}
                className="absolute w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center shadow-lg shadow-purple-500/50 z-5 cursor-pointer hover:scale-125 transition-transform"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)"
                }}
                title={showExactDistance ? "You (Exact Coordinates)" : "You (Real Coordinates - Protected)"}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            )}

            {/* Simulated decoy pin if no active card exists but anonymization is checked */}
            {useLocation && location && !showExactDistance && myCoordsInfo && myCoordsInfo.isSimulated && (
              (() => {
                const pos = getRadarPosition(myCoordsInfo.lat, myCoordsInfo.lng, true);
                if (!pos) return null;
                return (
                  <div
                    onClick={handleMyNodeClick}
                    className="absolute cursor-pointer transition-all duration-300 z-15 hover:scale-125"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#33D6C0] to-[#C65CFF] opacity-40 animate-ring-pulse blur-sm -z-10" />
                    <div className="w-8 h-8 rounded-full bg-[#160433]/90 border border-[#33D6C0] flex items-center justify-center text-lg shadow-lg">
                      🛡️
                    </div>
                  </div>
                );
              })()
            )}

            {/* Vibe Pins */}
            {resolvedPins.map(({ vibe, displayPos }) => {
              const isSelected = selectedVibe?._id === vibe._id;
              
              // Set customized glow colors based on dominant mood
              let moodGlowClass = "from-purple-500 to-pink-500";
              const mood = vibe.vibeScore?.mood?.toLowerCase() || "";
              
              if (mood.includes("comfort") || mood.includes("cozy") || mood.includes("soft")) {
                moodGlowClass = "from-pink-500 to-violet-500";
              } else if (mood.includes("laugh") || mood.includes("chaos") || mood.includes("goofy")) {
                moodGlowClass = "from-cyan-400 to-teal-400";
              } else if (mood.includes("low battery") || mood.includes("awkward")) {
                moodGlowClass = "from-indigo-600 to-slate-500";
              }

              return (
                <div
                  key={vibe._id}
                  className="absolute cursor-pointer transition-all duration-300 z-10 animate-fadeIn"
                  style={{
                    left: `${displayPos.x}%`,
                    top: `${displayPos.y}%`,
                    transform: "translate(-50%, -50%) scale(1)",
                  }}
                  onClick={() => setSelectedVibe(vibe)}
                  onMouseEnter={() => setHoveredVibe(vibe)}
                  onMouseLeave={() => setHoveredVibe(null)}
                >
                  {/* Glowing Pulse Aura Ring */}
                  <div className={`absolute -inset-3 rounded-full bg-gradient-to-br ${moodGlowClass} opacity-40 animate-ring-pulse blur-sm -z-10`} />

                  {/* Pulsing Core Vibe Marker */}
                  <div className={`w-8 h-8 rounded-full bg-[#160433]/90 border flex items-center justify-center text-lg shadow-lg hover:scale-125 transition-transform select-none ${
                    isSelected ? "border-pink-500 border-2" : "border-white/20"
                  }`}>
                    {vibe.emoji}
                  </div>

                  {/* Micro Tooltip on Hover */}
                  {hoveredVibe?._id === vibe._id && !isSelected && (
                    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 py-1 px-2.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-20">
                      @{vibe.user?.username || "anonymous"}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          {/* VISUAL FLOATING CARD: Selected Vibe Bubble Overlay */}
          {selectedVibe && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[360px] bg-gradient-to-b from-[#180835]/95 to-[#0b031b]/98 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl z-30 transition-all duration-300">
              
              {/* Header inside popover */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                    {selectedVibe.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white capitalize">{selectedVibe.user?.name}</h3>
                    <p className="text-xs text-purple-300 font-bold">@{selectedVibe.user?.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVibe(null)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status / Description */}
              <div className="mb-4 bg-white/5 border border-white/5 rounded-2xl p-3">
                <span className="text-[9px] text-[#7C7196] font-extrabold uppercase tracking-wider block mb-1">Status Description</span>
                <p className="text-xs font-semibold text-white/90 leading-relaxed italic">
                  "{selectedVibe.description || "Just existing."}"
                </p>
              </div>

              {/* Badges / Intents */}
              {selectedVibe.currentIntent && selectedVibe.currentIntent.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] text-[#7C7196] font-extrabold uppercase tracking-wider block mb-1.5">Looking For</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVibe.currentIntent.map((intent: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold py-1 px-2.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-200"
                      >
                        {intent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vibe vector levels */}
              <div className="grid grid-cols-2 gap-3 mb-5 border-t border-white/5 pt-3.5">
                <div>
                  <span className="text-[9px] text-[#7C7196] font-extrabold uppercase tracking-wider block mb-1">Energy Level</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-cyan-400">{selectedVibe.vibeScore?.energy || 50}%</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${selectedVibe.vibeScore?.energy || 50}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-[#7C7196] font-extrabold uppercase tracking-wider block mb-1">Positivity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-pink-400">{selectedVibe.vibeScore?.positivity || 50}%</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-400 rounded-full"
                        style={{ width: `${selectedVibe.vibeScore?.positivity || 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(selectedVibe.isMeNode || selectedVibe.user?.username === user?.username) ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3 text-xs text-purple-300">
                    <div className="font-extrabold uppercase text-[9.5px] mb-2 tracking-wider text-purple-200">Radar Position Metrics</div>
                    <div className="space-y-1.5 font-mono text-[10px] text-white/80">
                      <div className="flex justify-between">
                        <span className="text-[#7C7196]">True Coordinates:</span>
                        <span>{location?.lat.toFixed(5)}°N, {location?.lng.toFixed(5)}°E</span>
                      </div>
                      {!showExactDistance && myCoordsInfo && (
                        <>
                          <div className="flex justify-between text-cyan-300">
                            <span className="text-[#7C7196]">Fuzzied Coordinates:</span>
                            <span>{myCoordsInfo.lat.toFixed(5)}°N, {myCoordsInfo.lng.toFixed(5)}°E</span>
                          </div>
                          <div className="flex justify-between text-pink-300">
                            <span className="text-[#7C7196]">Decoy Shift:</span>
                            <span>~{myCoordsInfo.distanceOffset.toFixed(2)} km</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/vibe/create")}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Update My Vibe Card
                  </button>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[11px] text-[#7C7196] font-semibold leading-relaxed">
                    Vibe heatmap is for local analysis. Match with <span className="text-purple-300">@{selectedVibe.user?.username}</span> on the Discover page to start a conversation!
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* BOTTOM SCAN CONTROL BAR: Filters */}
        <footer className="p-4 border-t border-white/5 bg-[#0f0224]/70 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 z-10">
          
          {/* Radius slider */}
          <div className="w-full md:w-auto flex items-center gap-4 flex-1">
            <span className="text-xs font-bold text-[#7C7196] whitespace-nowrap">Scan Radius:</span>
            <input
              type="range"
              min="10"
              max="100"
              value={scanRadius}
              onChange={(e) => setScanRadius(Number(e.target.value))}
              className="w-full md:max-w-[200px] accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-extrabold text-purple-300 whitespace-nowrap">{scanRadius} km</span>
          </div>

          {/* Energy filter */}
          <div className="w-full md:w-auto flex items-center gap-4 flex-1">
            <span className="text-xs font-bold text-[#7C7196] whitespace-nowrap">Min Energy:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minEnergy}
              onChange={(e) => setMinEnergy(Number(e.target.value))}
              className="w-full md:max-w-[200px] accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-extrabold text-pink-300 whitespace-nowrap">{minEnergy * 10}%</span>
          </div>

          {/* Intent selector filter */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-bold text-[#7C7196] whitespace-nowrap">Intent:</span>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none cursor-pointer focus:border-purple-500"
            >
              <option value="" className="bg-[#120329]">All Intents</option>
              {INTENTS.map((intent, idx) => (
                <option key={idx} value={intent} className="bg-[#120329]">
                  {intent}
                </option>
              ))}
            </select>
          </div>

        </footer>

      </section>

      {/* Mobile Floating Tab Switcher */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#120d24]/90 border border-white/10 p-1.5 rounded-full z-45 flex shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setActiveMobileTab("radar")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
            activeMobileTab === "radar"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Compass className="w-4 h-4" />
          Radar Map
        </button>
        <button
          onClick={() => setActiveMobileTab("filters")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
            activeMobileTab === "filters"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Controls & Stats
        </button>
      </div>

    </div>
  );
}
