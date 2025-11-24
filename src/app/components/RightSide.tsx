"use client";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Loader2, Zap, Flame, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getMyVibeCard } from "../lib/vibeApi";
import { useUserStore } from "../../store/store";

export default function RightSide() {
    const router = useRouter();
    const { user } = useUserStore();
    const [myVibe, setMyVibe] = useState<any | null>(null);
    const [myVibeLoading, setMyVibeLoading] = useState(true);
    // FLAMES game state
    const [flamesName1, setFlamesName1] = useState("");
    const [flamesName2, setFlamesName2] = useState("");
    const [flamesResult, setFlamesResult] = useState<any | null>(null);

    useEffect(() => {
        // Only fetch if user is authenticated
        if (!user) {
            setMyVibeLoading(false);
            return;
        }

        const fetchVibe = async () => {
            try {
                const res = await getMyVibeCard();
                if (res?.vibeCard) {
                    console.log("Vibe card data:", res.vibeCard);
                    setMyVibe(res.vibeCard);
                }
            } catch (error: any) {
                // Silently handle 401 (unauthorized) - user might not be logged in or token expired
                if (error?.response?.status === 401) {
                    // User not authenticated, don't log error
                    return;
                }
                // Log other errors but don't crash
                console.error("Error fetching vibe card:", error);
            } finally {
                setMyVibeLoading(false);
            }
        };
        fetchVibe();
        
        // Refresh vibe card every 60 seconds to catch updates (reduced frequency)
        const interval = setInterval(() => {
            if (user) {
                fetchVibe();
            }
        }, 60000); // 60 seconds instead of 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    const renderVibeCard = () => {
        if (myVibeLoading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
                </div>
            );
        }

        if (!myVibe) {
            return (
                <div className="rounded-2xl border border-dashed border-white/20 p-5 bg-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-300" />
                        <p className="text-white font-semibold text-sm">Set your vibe</p>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                        Capture how you feel right now to unlock matching vibes and 24-hour chats.
                    </p>
                    <button
                        onClick={() => router.push("/vibe/create")}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                        Create Vibe Card
                    </button>
                </div>
            );
        }

        const theme = myVibe.theme || {
            gradientFrom: "#2b1055",
            gradientTo: "#7597de",
            borderGlow: "#a855f7",
            accentColor: "#fcd34d"
        };

        return (
            <div
                className="rounded-3xl p-5 border-2 relative overflow-hidden"
                style={{
                    borderColor: theme.borderGlow,
                    backgroundImage: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    boxShadow: `0 0 50px ${theme.borderGlow}50`
                }}
            >
                <div className="flex items-center justify-between text-white mb-4">
                    <div className="text-4xl">{myVibe.emoji}</div>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/80">Active Vibe</span>
                </div>
                <p className="text-white font-extrabold text-xl leading-snug mb-4">
                    {myVibe.description}
                </p>
                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-white/90">
                        <div className="p-2 rounded-xl bg-white/15">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Energy Level: {myVibe.energyLevel || 5}/10</p>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                                <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                        width: `${((myVibe.energyLevel || 5) / 10) * 100}%`,
                                        backgroundColor: theme.accentColor,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    {myVibe.currentIntent && myVibe.currentIntent.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {myVibe.currentIntent.map((intent: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 rounded-lg text-xs font-medium bg-white/15 text-white">
                                    {intent}
                                </span>
                            ))}
                        </div>
                    )}
                    {myVibe.contextTag && (
                        <p className="text-xs text-white/70">#{myVibe.contextTag}</p>
                    )}
                    <p className="text-xs text-white/60">{myVibe.interactionBoundary || "Fast replies"}</p>
                </div>

                {/* What I'm Feeling Like Today */}
                {myVibe.feelingOptions && Array.isArray(myVibe.feelingOptions) && myVibe.feelingOptions.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-white/10">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span style={{ color: theme.accentColor }}>✨</span>
                            Feeling Like
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {myVibe.feelingOptions.slice(0, 3).map((feeling: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 border border-white/20">
                                    {feeling}
                                </span>
                            ))}
                            {myVibe.feelingOptions.length > 3 && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                                    +{myVibe.feelingOptions.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Vibe Availability */}
                {myVibe.vibeAvailability && myVibe.vibeAvailability.trim() !== "" && (
                    <div className="mb-4 pt-3 border-t border-white/10">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <span style={{ color: theme.accentColor }}>⚡</span>
                            Availability
                        </p>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/15 text-white border border-white/20 inline-block">
                            {myVibe.vibeAvailability}
                        </span>
                    </div>
                )}

                {/* Mini Personality Prompt */}
                {myVibe.personalityPrompt && myVibe.personalityPrompt.trim() !== "" && (
                    <div className="mb-4 pt-3 border-t border-white/10">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <span style={{ color: theme.accentColor }}>💭</span>
                            Today I feel like...
                        </p>
                        <p className="px-2.5 py-1 rounded-lg text-xs font-medium italic bg-white/15 text-white border border-white/20">
                            {myVibe.personalityPrompt}
                        </p>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/80">
                    <div className="bg-black/20 rounded-2xl px-3 py-2">
                        <p className="text-[10px] uppercase tracking-widest opacity-70">Mood</p>
                        <p className="font-semibold capitalize">{myVibe.vibeScore?.mood}</p>
                    </div>
                    <div className="bg-black/20 rounded-2xl px-3 py-2">
                        <p className="text-[10px] uppercase tracking-widest opacity-70">Energy</p>
                        <p className="font-semibold">{Math.round(myVibe.vibeScore?.energy ?? 0)}/100</p>
                    </div>
                </div>
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={() => router.push("/vibe/discover")}
                        className="flex-1 py-2.5 rounded-xl bg-white/20 text-white font-semibold text-sm hover:bg-white/30 transition-all"
                    >
                        See Matches
                    </button>
                    <button
                        onClick={() => router.push("/vibe/create")}
                        className="px-4 py-2.5 rounded-xl bg-white text-purple-700 font-semibold text-sm hover:bg-white/90 transition-all"
                    >
                        Update
                    </button>
                </div>
            </div>
        );
    };

    // FLAMES game function
    const vibessFlames = (name1: string, name2: string) => {
        // 1. Clean names
        name1 = name1.toLowerCase().replace(/\s/g, '');
        name2 = name2.toLowerCase().replace(/\s/g, '');

        // 2. Convert to arrays
        let arr1 = name1.split('');
        let arr2 = name2.split('');

        // 3. Remove common letters
        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                if (arr1[i] === arr2[j]) {
                    arr1[i] = '';
                    arr2[j] = '';
                    break;
                }
            }
        }

        // 4. Count remaining letters
        const remainingCount =
            arr1.filter(ch => ch !== '').length +
            arr2.filter(ch => ch !== '').length;

        // 5. FLAMES array
        let flames = ['F', 'L', 'A', 'M', 'E', 'S'];

        // 6. Elimination logic
        let count = remainingCount;
        while (flames.length > 1) {
            let index = (count % flames.length) - 1;
            if (index >= 0) {
                flames = flames.slice(index + 1).concat(flames.slice(0, index));
            } else {
                flames = flames.slice(0, flames.length - 1);
            }
        }

        // 7. Result mapping
        const resultMap: Record<string, { title: string; description: string }> = {
            F: {
                title: "Fun Buddies",
                description: "Always laughing, always bakchodi. No tension, only comedy."
            },
            L: {
                title: "Legendary Bakchod",
                description: "Chaotic duo. Together you two can ruin any serious conversation in 5 minutes."
            },
            A: {
                title: "Aesthetic Match",
                description: "Same wallpaper vibe. Same playlist energy. Same Instagram mood."
            },
            M: {
                title: "Momo Lovers",
                description: "United by one true love: street food. If life fails, momos won't."
            },
            E: {
                title: "Ek Tarfa Trauma",
                description: "One sided feelings. Other side: \"Bro we're just friends 😭\". Painful but funny."
            },
            S: {
                title: "Shaadi Material",
                description: "Family approved vibes. Shaadi.com energy unlocked."
            }
        };

        return resultMap[flames[0]];
    };

    const handleFlamesCalculate = () => {
        if (!flamesName1.trim() || !flamesName2.trim()) {
            return;
        }
        const result = vibessFlames(flamesName1.trim(), flamesName2.trim());
        setFlamesResult(result);
    };

    const handleFlamesReset = () => {
        setFlamesName1("");
        setFlamesName2("");
        setFlamesResult(null);
    };

    return (
        <div className="w-full h-full space-y-6">
            {/* Active Vibe */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Your Vibe</h3>
                </div>
                {renderVibeCard()}
            </div>

            {/* FLAMES Game */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        FLAMES Game
                    </h3>
                </div>
                <div className="rounded-2xl border border-white/10 p-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm">
                    {!flamesResult ? (
                        <div className="space-y-4">
                            <p className="text-white/80 text-sm text-center">
                                A Vibess Desi Fun Edition
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-white/60 mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        value={flamesName1}
                                        onChange={(e) => setFlamesName1(e.target.value)}
                                        placeholder="Enter first name"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/60 mb-1.5">Second Name</label>
                                    <input
                                        type="text"
                                        value={flamesName2}
                                        onChange={(e) => setFlamesName2(e.target.value)}
                                        placeholder="Enter second name"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleFlamesCalculate}
                                disabled={!flamesName1.trim() || !flamesName2.trim()}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Flame className="w-4 h-4" />
                                Calculate FLAMES
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mb-2">
                                    <Flame className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-white">{flamesResult.title}</h4>
                                <p className="text-white/70 text-sm leading-relaxed px-2">
                                    {flamesResult.description}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                                <span>{flamesName1} ❤️ {flamesName2}</span>
                            </div>
                            <button
                                onClick={handleFlamesReset}
                                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Try Another
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}