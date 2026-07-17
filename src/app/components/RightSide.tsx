"use client";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Loader2, Zap, Flame, X, MessageCircle } from "lucide-react";
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
                    <Loader2 className="w-6 h-6 animate-spin text-[#c65cff]" />
                </div>
            );
        }

        if (!myVibe) {
            return (
                <div className="rounded-2xl border border-dashed border-white/20 p-5 bg-white/5 font-sans">
                    <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-5 h-5 text-[#ffb25e]" />
                        <p className="text-white font-semibold text-sm">Set your vibe</p>
                    </div>
                    <p className="text-[#b3a7ce] text-sm mb-4">
                        Capture how you feel right now to unlock matching vibes and 24-hour chats.
                    </p>
                    <button
                        onClick={() => router.push("/vibe/create")}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff5d73] to-[#c65cff] text-[#160E22] text-sm font-bold hover:from-[#ff5d73]/90 hover:to-[#c65cff]/90 transition-all cursor-pointer"
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
                className="rounded-3xl p-5 border-2 relative overflow-hidden font-sans text-white"
                style={{
                    borderColor: theme.borderGlow,
                    backgroundImage: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    boxShadow: `0 0 35px ${theme.borderGlow}50`
                }}
            >
                {/* Vibe Top Emoji & Active Badge */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div 
                        className="w-14 h-14 rounded-full border-2 p-[2px] flex items-center justify-center bg-[#150F26]/30 text-3xl"
                        style={{ borderColor: theme.borderGlow }}
                    >
                        {myVibe.emoji}
                    </div>
                    <span className="active-badge bg-[#150F26]/40 border border-white/15 text-white/90">
                        <span className="d" style={{ backgroundColor: theme.accentColor }}></span>
                        Active Vibe
                    </span>
                </div>

                {/* Vibe Title / Description */}
                <h2 className="text-xl font-extrabold tracking-tight mb-2 relative z-10 leading-snug" style={{ color: theme.accentColor }}>
                    {myVibe.description}
                </h2>

                {/* Context Tag and Conversational Preference */}
                {(myVibe.contextTag || myVibe.conversationalPreferences) && (
                    <div className="text-xs text-white/70 mb-3 space-y-1 relative z-10 font-mono">
                        {myVibe.contextTag && <div>#{myVibe.contextTag}</div>}
                        {myVibe.conversationalPreferences && <div>💬 {myVibe.conversationalPreferences}</div>}
                    </div>
                )}

                {/* Energy Track */}
                <div className="mb-4 relative z-10">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1 text-white/90">
                            <Zap className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                            Energy Level
                        </span>
                        <span className="font-mono text-white/80">{myVibe.energyLevel || 5}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                                width: `${(myVibe.energyLevel || 5) * 10}%`, 
                                backgroundColor: theme.accentColor,
                                boxShadow: `0 0 10px ${theme.accentColor}`
                            }}
                        ></div>
                    </div>
                </div>

                {/* intent and askMeAbout tags (showing all) */}
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                    {myVibe.currentIntent && myVibe.currentIntent.map((intent: string, idx: number) => (
                        <span key={`intent-${idx}`} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/15 text-white/90 border border-white/10">
                            {intent}
                        </span>
                    ))}
                    {myVibe.askMeAbout && myVibe.askMeAbout.map((item: string, idx: number) => (
                        <span key={`ask-${idx}`} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#33d6c0]/15 text-[#33d6c0] border border-[#33d6c0]/20">
                            {item}
                        </span>
                    ))}
                </div>

                {/* Feeling Like Section (showing all) */}
                {myVibe.feelingOptions && myVibe.feelingOptions.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-white/10 relative z-10 text-xs">
                        <span className="eyebrow flex items-center gap-1 mb-2">
                            <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                            Feeling like
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {myVibe.feelingOptions.map((feeling: string, idx: number) => (
                                <span key={`feeling-${idx}`} className="px-2.5 py-1 rounded-full bg-white/15 text-white/90 border border-white/20">
                                    {feeling}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-white/10 my-3.5 relative z-10"></div>

                {/* Short visual feel/availability indicators */}
                <div className="space-y-3 mb-4 relative z-10">
                    {myVibe.personalityPrompt && (
                        <div className="text-[12.5px] leading-relaxed text-white/80 italic pl-2 border-l-2" style={{ borderColor: theme.accentColor }}>
                            "Today I feel like {myVibe.personalityPrompt}"
                        </div>
                    )}
                    {myVibe.vibeAvailability && (
                        <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }}></span>
                            Status: <span className="font-semibold text-white">{myVibe.vibeAvailability}</span>
                        </div>
                    )}
                </div>

                {/* Bottom matching buttons */}
                <div className="flex gap-3 mt-4 relative z-10 text-xs">
                    <button 
                        onClick={() => router.push("/vibe/discover")} 
                        className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold border border-white/15 cursor-pointer transition-colors"
                    >
                        See Matches
                    </button>
                    <button 
                        onClick={() => router.push("/vibe/create")} 
                        className="flex-1 py-2.5 rounded-xl font-bold cursor-pointer transition-all hover:scale-[1.02]"
                        style={{ 
                            backgroundColor: theme.accentColor,
                            color: "#160E22",
                            boxShadow: `0 4px 15px ${theme.accentColor}40`
                        }}
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