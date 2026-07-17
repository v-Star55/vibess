"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  MessageCircle,
  Heart,
  MapPin,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Star,
  ChevronDown,
  RefreshCw,
  Send,
  Sliders,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

/* ------------------------------------------------------------------ */
/*  Reveal-on-scroll wrapper                                           */
/* ------------------------------------------------------------------ */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Orb background component                                           */
/* ------------------------------------------------------------------ */
function OrbBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large purple orb */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-orb-1" />
      {/* Pink orb */}
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-pink-500/15 blur-[100px] animate-orb-2" />
      {/* Deep violet orb */}
      <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-violet-700/20 blur-[130px] animate-orb-3" />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0d0019]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-purple-900/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Vibess
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#vibe-creator" className="hover:text-white transition-colors">Vibe Card</a>
          <a href="#demo" className="hover:text-white transition-colors">Interface Walkthrough</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const stat1 = useCountUp(950, 1800);
  const stat2 = useCountUp(24, 1400);
  const stat3 = useCountUp(100, 1600);

  /* ----------------- State for Interactive Vibe Card ----------------- */
  const moodPresets = [
    { key: "chill", label: "😴 Chill / Cozy", emoji: "😴", text: "Low energy, cozy blanket vibes. Listening to quiet lofi beats.", intention: "Quiet conversation", energy: 20, glow: "glow-purple", color: "from-purple-900/40 via-purple-950/20 to-black/60 border-purple-500/30", tags: ["chill", "lazy", "lofi"] },
    { key: "chaos", label: "🤪 Chaotic Chaos", emoji: "🤪", text: "100% chaotic energy. Let's debate why cereal is technically soup.", intention: "Roast sessions & nonsense", energy: 95, glow: "glow-amber", color: "from-amber-900/40 via-amber-950/20 to-black/60 border-amber-500/30", tags: ["chaos", "debates", "memes"] },
    { key: "overthink", label: "🤯 Brain Dump", emoji: "🤯", text: "Brain is running 50 background tasks. Need to vent about ambitions and code.", intention: "Deep talk & venting", energy: 80, glow: "glow-pink", color: "from-pink-900/40 via-pink-950/20 to-black/60 border-pink-500/30", tags: ["venting", "career", "life"] },
    { key: "listen", label: "😌 Soft Listener", emoji: "😌", text: "Gentle presence. Ready to listen to your day or just vibe quietly.", intention: "Safe chill space", energy: 40, glow: "glow-emerald", color: "from-emerald-900/40 via-emerald-950/20 to-black/60 border-emerald-500/30", tags: ["listen", "comfort", "gentle"] },
  ];
  const [selectedMood, setSelectedMood] = useState(moodPresets[0]);

  /* ---------------- State for Interactive Location Radar --------------- */
  const [selectedRadius, setSelectedRadius] = useState<number>(30); // 5km, 15km, 30km, 50km
  const [activeHoverNode, setActiveHoverNode] = useState<any | null>(null);

  const radarNodes = [
    { id: 1, type: "vibe", emoji: "😴", name: "Chill Lofi", dist: 3, ring: 1, left: "64%", top: "36%", desc: "Listening to records under a blanket" },
    { id: 2, type: "gp", emoji: "✨", name: "Lofi Debate Room", dist: 8, ring: 2, left: "75%", top: "68%", desc: "Vibe GP • 3/5 members • 1h 45m left" },
    { id: 3, type: "vibe", emoji: "🤪", name: "Chaotic Squirrel", dist: 12, ring: 2, left: "26%", top: "28%", desc: "Argue with me why dogs are superior to cats" },
    { id: 4, type: "vibe", emoji: "😌", name: "Quiet Listener", dist: 14, ring: 2, left: "34%", top: "72%", desc: "Tell me all about your coding stressors today" },
    { id: 5, type: "gp", emoji: "🎬", name: "Horror Fans GP", dist: 22, ring: 3, left: "78%", top: "22%", desc: "Movie GP • 4/5 members • Permanent" },
    { id: 6, type: "vibe", emoji: "🤯", name: "Mind Overloaded", dist: 28, ring: 3, left: "18%", top: "60%", desc: "Venting about type constraints in TS" },
    { id: 7, type: "gp", emoji: "🎌", name: "Anime Talk GP", dist: 38, ring: 4, left: "20%", top: "82%", desc: "Anime GP • 2/5 members • 3h 10m left" },
    { id: 8, type: "vibe", emoji: "😎", name: "Meme Dispatcher", dist: 45, ring: 4, left: "84%", top: "52%", desc: "Dumping top-tier lofi memes" },
  ];

  /* ---------------- State for Interactive Tic-Tac-Toe Game ----------- */
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(s => s !== null)) return "Draw";
    return null;
  };

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;
    const newBoard = [...board];
    newBoard[idx] = isXNext ? "❌" : "⭕";
    setBoard(newBoard);
    setIsXNext(!isXNext);
    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinner(winResult);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  /* ---------------- State for Interactive Whisper Space -------------- */
  const whispers = [
    "Sometimes I code in light mode just to feel something.",
    "I haven't told my match yet, but their comfort anime is also my comfort anime.",
    "Joined a Movie GP for horror movies and ended up talking about cat videos for 2 hours.",
    "Vibe check: current energy is 10% but my heart is 100%.",
    "I generated 10 AI icebreakers and sent the cheesiest one. No regrets, they replied!",
    "Actually converted my first temporary GP to a permanent group today. Feels like a win."
  ];
  const [whisperIdx, setWhisperIdx] = useState(0);

  const rotateWhisper = () => {
    setWhisperIdx((prev) => (prev + 1) % whispers.length);
  };

  /* ---------------- State for Interactive Listening Space ------------ */
  const mockSupportRequests = [
    {
      id: 1,
      topic: "🌌 Lonely Night",
      heaviness: "Light",
      reason: "Just looking for someone to talk to while coding at 2 AM. Quiet vibes.",
      user: "Nikhil, 3.4km away",
      options: [
        "Hey Nikhil, what are you building? Down to talk.",
        "Hey Nikhil, late night coding is real. What language?",
        "I'm up too. Down for a chill chat to keep you company!"
      ],
      reply: "Thanks for connecting. Honestly, just having someone here makes a big difference. I'm working on a React project, debugging state locks. What are you up to?"
    },
    {
      id: 2,
      topic: "🌀 Existential Dread",
      heaviness: "Heavy",
      reason: "Everything feels overwhelming right now. Need an empathetic listener to vent to about career goals.",
      user: "Simran, 1.8km away",
      options: [
        "Hey Simran, take a deep breath. I'm here. What's on your mind?",
        "I completely relate. Take your time, what's causing the dread?",
        "Hey, it's okay to feel overwhelmed. Vent away, I am listening."
      ],
      reply: "Thank you so much. It's just hard figuring out the next steps after graduation. Hearing that someone cares helps a lot. Do you ever feel like you're falling behind?"
    },
    {
      id: 3,
      topic: "💼 Work Stress",
      heaviness: "Moderate",
      reason: "Had a rough review session today. Just want a distraction or to talk it through.",
      user: "Rohit, 5.0km away",
      options: [
        "Rough reviews suck. Do you want to vent or talk distractions?",
        "Hey Rohit, I can listen if you want to debrief. Or we can discuss hobbies!",
        "Take it easy. Work is just work. What's a topic you love instead?"
      ],
      reply: "Haha, honestly, a distraction would be amazing. Let's talk about movies or favorite video games! What was the last good movie you saw?"
    }
  ];

  const [readyToListen, setReadyToListen] = useState(false);
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  const [listeningSessionActive, setListeningSessionActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "system" | "seeker" | "listener"; text: string }[]>([]);
  const [isTypingResponse, setIsTypingResponse] = useState(false);

  const startListeningSession = () => {
    const request = mockSupportRequests[activeRequestIndex];
    setChatMessages([
      { sender: "system", text: `Connected with ${request.user}. Be supportive, empathetic, and kind.` },
      { sender: "seeker", text: `Topic: ${request.topic} (${request.heaviness} Support)\n\n"${request.reason}"` }
    ]);
    setListeningSessionActive(true);
  };

  const handleSendSupportMessage = (text: string) => {
    if (isTypingResponse) return;
    setChatMessages((prev) => [...prev, { sender: "listener", text }]);
    setIsTypingResponse(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: "seeker", text: mockSupportRequests[activeRequestIndex].reply }
      ]);
      setIsTypingResponse(false);
    }, 1500);
  };

  const endListeningSession = () => {
    setListeningSessionActive(false);
    setChatMessages([]);
  };

  const [activeStep, setActiveStep] = useState(0);

  /* tick-based typing effect for hero tagline */
  const taglines = [
    "Find people who match your vibe.",
    "Chat for 24 hours, zero pressure.",
    "Your city, your mood, your people.",
  ];
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const full = taglines[taglineIdx];
    if (typing) {
      if (displayed.length < full.length) {
        const t = setTimeout(() => setDisplayed(full.slice(0, displayed.length + 1)), 40);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
        return () => clearTimeout(t);
      } else {
        setTaglineIdx((i) => (i + 1) % taglines.length);
        setTyping(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed, typing, taglineIdx]);

  return (
    <div className="min-h-screen bg-[#060013] text-white overflow-x-hidden selection:bg-purple-500/30">
      <OrbBackground />
      <Navbar />

      {/* ═══════════════════════════════════════════════ */}
      {/*   HERO — cinematic full-width radar centrepiece */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16 overflow-hidden">

        {/* ── extra top glow ── */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-purple-600/10 blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center w-full relative z-10 animate-fade-in">
          
          {/* Left Column: Cinematic details */}
          <div className="lg:col-span-6 text-left space-y-6 animate-fade-in">

          {/* badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold tracking-widest text-purple-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            LIVE • GEOSPATIAL MOOD MATCHING
          </div>

          {/* headline */}
          <h1 className="text-5xl sm:text-6xl md:text-[82px] font-black leading-[1.0] tracking-tight">
            <span className="bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">Find people who</span>
            <br />
            <span
              className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 40px rgba(192,132,252,0.35))" }}
            >
              match your vibe.
            </span>
          </h1>
                    <Reveal delay={120}>
              <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
                Connect with active vibes and local Group Chats (GPs) nearby. Adjust your scanning radius to find people on your wavelength, share your mood, and chat with zero pressure.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={180}>
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-stretch sm:items-center mt-2">
                <Link
                  href="/signup"
                  className="group relative px-9 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white font-bold text-base flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] hover:scale-105 transition-all"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Create Vibe Card
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
                <Link
                  href="/login"
                  className="px-9 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white font-semibold text-base text-center transition-all border border-white/10 hover:border-purple-500/40 backdrop-blur-md"
                >
                  Sign In
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Free floating orbital radar visual (simple layout matching reference image) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full relative">
            <Reveal delay={250} className="w-full flex flex-col items-center">
              
              {/* Radius Pills Selector */}
              <div className="flex items-center gap-2 mb-8 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md z-20 select-none">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">Radius:</span>
                {[5, 15, 30, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRadius(r)}
                    className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                      selectedRadius === r
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/25"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              {/* Radar Screen Visual */}
              <div
                className="relative w-full aspect-square rounded-full flex items-center justify-center overflow-visible border border-white/[0.03] bg-[#050110]/10 max-w-[380px] sm:max-w-[420px]"
                style={{
                  boxShadow: "inset 0 0 40px rgba(168,85,247,0.02)"
                }}
              >
                {/* Central Volumetric Conic Gradient Orb */}
                <div
                  className="w-[36%] h-[36%] rounded-full relative flex items-center justify-center shadow-[0_0_80px_rgba(236,72,153,0.3),0_0_30px_rgba(168,85,247,0.2)] animate-float-slow z-10 select-none"
                  style={{
                    background: "conic-gradient(from 180deg at 50% 50%, #f43f5e, #ec4899, #d946ef, #8b5cf6, #3b82f6, #06b6d4, #10b981, #eab308, #f97316, #f43f5e)",
                  }}
                >
                  {/* 3D volumetric glass shade overlay */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.5) 85%)"
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                </div>

                {/* Orbit 1 (5 km range) */}
                <div
                  className={`absolute w-[56%] h-[56%] border border-dashed rounded-full pointer-events-none flex items-center justify-center transition-opacity duration-500 ${
                    selectedRadius >= 5 ? "border-white/10 opacity-100" : "border-white/[0.03] opacity-30"
                  }`}
                >
                  {/* Orbiting nodes wrapper (Vibe 1 & Vibe 2) */}
                  {[
                    { node: radarNodes[0], delay: "-0s", dotColor: "#f97316" }, // Chill Lofi (Orange)
                    { node: radarNodes[1], delay: "-15s", dotColor: "#d946ef" } // Lofi GP (Purple)
                  ].map(({ node, delay, dotColor }) => {
                    const isActive = node.dist <= selectedRadius;
                    return (
                      <div
                        key={node.id}
                        className={`absolute inset-0 animate-orbit-1 pause-on-hover ${
                          isActive ? "pointer-events-auto" : "pointer-events-none"
                        }`}
                        style={{ animationDelay: delay }}
                      >
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        >
                          <div
                            className="animate-counter-orbit-1"
                            style={{ animationDelay: delay }}
                          >
                            <button
                              onMouseEnter={() => setActiveHoverNode(node)}
                              onMouseLeave={() => setActiveHoverNode(null)}
                              className={`px-3 py-1.5 rounded-full bg-[#0e0c1b]/85 border backdrop-blur-md flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 ${
                                isActive
                                  ? "border-white/10 opacity-100"
                                  : "border-white/5 opacity-10 grayscale"
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 8px ${dotColor}`
                                }}
                              />
                              <span className="text-[10px] font-bold font-mono tracking-wide text-white/90 capitalize whitespace-nowrap">
                                {node.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/30">{node.dist}km</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Orbit 2 (15 km range) */}
                <div
                  className={`absolute w-[78%] h-[78%] border border-dashed rounded-full pointer-events-none flex items-center justify-center transition-opacity duration-500 ${
                    selectedRadius >= 15 ? "border-white/10 opacity-100" : "border-white/[0.03] opacity-30"
                  }`}
                >
                  {/* Orbiting nodes wrapper (Vibe 3 & Vibe 4) */}
                  {[
                    { node: radarNodes[2], delay: "-10s", dotColor: "#ef4444" }, // Chaotic Squirrel (Red)
                    { node: radarNodes[3], delay: "-32.5s", dotColor: "#10b981" } // Quiet Listener (Teal)
                  ].map(({ node, delay, dotColor }) => {
                    const isActive = node.dist <= selectedRadius;
                    return (
                      <div
                        key={node.id}
                        className={`absolute inset-0 animate-orbit-2 pause-on-hover ${
                          isActive ? "pointer-events-auto" : "pointer-events-none"
                        }`}
                        style={{ animationDelay: delay }}
                      >
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        >
                          <div
                            className="animate-counter-orbit-2"
                            style={{ animationDelay: delay }}
                          >
                            <button
                              onMouseEnter={() => setActiveHoverNode(node)}
                              onMouseLeave={() => setActiveHoverNode(null)}
                              className={`px-3 py-1.5 rounded-full bg-[#0e0c1b]/85 border backdrop-blur-md flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 ${
                                isActive
                                  ? "border-white/10 opacity-100"
                                  : "border-white/5 opacity-10 grayscale"
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 8px ${dotColor}`
                                }}
                              />
                              <span className="text-[10px] font-bold font-mono tracking-wide text-white/90 capitalize whitespace-nowrap">
                                {node.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/30">{node.dist}km</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Orbit 3 (30 km range) */}
                <div
                  className={`absolute w-[100%] h-[100%] border border-dashed rounded-full pointer-events-none flex items-center justify-center transition-opacity duration-500 ${
                    selectedRadius >= 30 ? "border-white/10 opacity-100" : "border-white/[0.03] opacity-30"
                  }`}
                >
                  {/* Orbiting nodes wrapper (Vibe 5 & Vibe 6) */}
                  {[
                    { node: radarNodes[4], delay: "-20s", dotColor: "#ec4899" }, // Horror Fans GP (Pink)
                    { node: radarNodes[5], delay: "-50s", dotColor: "#f43f5e" } // Mind Overloaded (Rose)
                  ].map(({ node, delay, dotColor }) => {
                    const isActive = node.dist <= selectedRadius;
                    return (
                      <div
                        key={node.id}
                        className={`absolute inset-0 animate-orbit-3 pause-on-hover ${
                          isActive ? "pointer-events-auto" : "pointer-events-none"
                        }`}
                        style={{ animationDelay: delay }}
                      >
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        >
                          <div
                            className="animate-counter-orbit-3"
                            style={{ animationDelay: delay }}
                          >
                            <button
                              onMouseEnter={() => setActiveHoverNode(node)}
                              onMouseLeave={() => setActiveHoverNode(null)}
                              className={`px-3 py-1.5 rounded-full bg-[#0e0c1b]/85 border backdrop-blur-md flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 ${
                                isActive
                                  ? "border-white/10 opacity-100"
                                  : "border-white/5 opacity-10 grayscale"
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 8px ${dotColor}`
                                }}
                              />
                              <span className="text-[10px] font-bold font-mono tracking-wide text-white/90 capitalize whitespace-nowrap">
                                {node.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/30">{node.dist}km</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra Orbit 4 (50 km range - floating slightly offset outside the screen space) */}
                <div
                  className={`absolute w-[122%] h-[122%] border border-dashed rounded-full pointer-events-none flex items-center justify-center transition-opacity duration-500 ${
                    selectedRadius >= 50 ? "border-white/5 opacity-100" : "border-white/[0.02] opacity-20"
                  }`}
                >
                  {[
                    { node: radarNodes[6], delay: "-15s", dotColor: "#eab308" }, // Anime Talk GP (Yellow)
                    { node: radarNodes[7], delay: "-45s", dotColor: "#3b82f6" } // Meme Dispatcher (Blue)
                  ].map(({ node, delay, dotColor }) => {
                    const isActive = node.dist <= selectedRadius;
                    return (
                      <div
                        key={node.id}
                        className={`absolute inset-0 animate-orbit-2 pause-on-hover ${
                          isActive ? "pointer-events-auto" : "pointer-events-none"
                        }`}
                        style={{ animationDelay: delay }}
                      >
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        >
                          <div
                            className="animate-counter-orbit-2"
                            style={{ animationDelay: delay }}
                          >
                            <button
                              onMouseEnter={() => setActiveHoverNode(node)}
                              onMouseLeave={() => setActiveHoverNode(null)}
                              className={`px-3 py-1.5 rounded-full bg-[#0e0c1b]/85 border backdrop-blur-md flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 ${
                                isActive
                                  ? "border-white/10 opacity-100"
                                  : "border-white/5 opacity-10 grayscale"
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 8px ${dotColor}`
                                }}
                              />
                              <span className="text-[10px] font-bold font-mono tracking-wide text-white/90 capitalize whitespace-nowrap">
                                {node.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/30">{node.dist}km</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra Static Orbit Dots for detail */}
                <div className="absolute w-[68%] h-[68%] border border-white/[0.02] rounded-full pointer-events-none animate-orbit-3">
                  <span className="absolute top-1/4 left-0 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                  <span className="absolute bottom-1/4 right-0 w-1 h-1 rounded-full bg-indigo-400/40" />
                </div>

                {/* Hover Details Overlay */}
                {activeHoverNode && (
                  <div className="absolute bottom-4 left-4 right-4 z-40 bg-[#0c031c]/95 border border-purple-500/30 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-left animate-fade-in pointer-events-none select-none">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-2xl">{activeHoverNode.emoji}</span>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{activeHoverNode.name}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: activeHoverNode.type === "gp" ? "#d946ef" : "#3b82f6" }}>
                          {activeHoverNode.type === "gp" ? "⚡ Group Chat (GP)" : "👤 Viber Status"}
                        </span>
                      </div>
                      <span className="ml-auto text-[9px] font-mono text-white/40">{activeHoverNode.dist} km</span>
                    </div>
                    <p className="text-[10px] text-white/60 leading-relaxed italic border-t border-white/5 pt-1.5">
                      &ldquo;{activeHoverNode.desc}&rdquo;
                    </p>
                  </div>
                )}
              </div>

            </Reveal>
          </div>
        </div>

        {/* Scroll Caret */}
        <div className="absolute bottom-6 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/15" />
        </div>
      </section>

      {/* ═══════════════════ STATS COUNTERS ═══════════════════ */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6 px-6">
          {[
            { ref: stat1.ref, count: stat1.count, suffix: "+", label: "Active Vibes Shared" },
            { ref: stat2.ref, count: stat2.count, suffix: "h", label: "DM Expiry Cooldown" },
            { ref: stat3.ref, count: stat3.count, suffix: "%", label: "Match Quality Rating" },
          ].map((s, i) => (
            <div key={i} ref={s.ref} className="text-center">
              <div className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent font-mono">
                {s.count}{s.suffix}
              </div>
              <div className="text-[11px] sm:text-xs text-white/40 mt-1 font-semibold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ NEW: VIBE CARD CREATOR SECTION ═══════════════════ */}
      <section id="vibe-creator" className="relative z-10 py-24 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Info details */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-pink-300 backdrop-blur-sm">
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                <span>EXPRESS WHO YOU ARE</span>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h2 className="text-4xl md:text-5xl font-bold">
                Express your energy with a <span className="text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 bg-clip-text font-extrabold">Vibe Card</span>
              </h2>
            </Reveal>

            <Reveal delay={150}>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                Choose a mood preset or construct your custom description. Our integrated Gemini AI assists you in writing engaging profiles, tags, and topics so others match your exact frequency.
              </p>
            </Reveal>

            {/* Presets Grid */}
            <Reveal delay={200} className="space-y-4">
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block">Vibe presets:</span>
              <div className="grid grid-cols-2 gap-2">
                {moodPresets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => setSelectedMood(preset)}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                      selectedMood.key === preset.key
                        ? "bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="text-[10px] opacity-40 font-mono">{preset.energy}%</span>
                  </button>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right: The Interactive Vibe Card Card Widget */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <Reveal delay={300} className="w-full max-w-sm">
              <div className={`w-full bg-gradient-to-b ${selectedMood.color} rounded-3xl p-6 border backdrop-blur-xl ${selectedMood.glow} transition-all duration-500 relative overflow-hidden animate-float-slow`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="text-5xl block mb-2 transition-transform duration-500 transform hover:scale-110">{selectedMood.emoji}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-white/70 font-medium">
                      Status: Live Preview
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white/40 block">Energy Level</span>
                    <span className="text-lg font-bold text-white font-mono">{selectedMood.energy}%</span>
                  </div>
                </div>

                {/* Energy Slider */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${selectedMood.energy}%` }}
                  />
                </div>

                {/* Vibe line */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-1">Mood Description</span>
                    <p className="text-white font-medium text-sm leading-relaxed min-h-[48px] transition-all duration-500">
                      &ldquo;{selectedMood.text}&rdquo;
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-1">Interactions Wanted</span>
                    <p className="text-purple-300 font-semibold text-xs transition-all duration-500">
                      {selectedMood.intention}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap mt-6 pt-4 border-t border-white/5">
                  {selectedMood.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-white/5 rounded-full text-[10px] text-white/60 border border-white/5 font-semibold">
                      #{tag}
                    </span>
                  ))}
                  <span className="ml-auto flex items-center gap-1 text-[9px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2 rounded-full">
                    ✨ AI Optimized
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ═══════════════════ BENTO GRID FEATURES ═══════════════════ */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.25em] text-purple-400 font-semibold mb-3">Core Ecosystem</p>
              <h2 className="text-4xl md:text-5xl font-bold">
                Everything you need to <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-extrabold">vibe comfortably</span>
              </h2>
            </div>
          </Reveal>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Box 1: GP Chats (Location Based) - 2cols */}
            <Reveal delay={50} className="md:col-span-2">
              <div className="h-full bg-gradient-to-br from-purple-500/10 to-[#120127] border border-purple-500/10 rounded-3xl p-8 hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center mb-5">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Location-Based Group Chats (GPs)</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-6">
                    Discover interest groups created by nearby users in real-time. Categories include Vibe GP, Movie GP, Anime GP, and Other GP. Join active rooms, match topics, and coordinate meets.
                  </p>
                </div>

                {/* Mock Groups List Visual */}
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400">✨ Vibe GP</span>
                      <span className="text-[10px] text-white/40">1.2 km away</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Chaos - Lofi Debate Room</span>
                    <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
                      <span>3/5 members</span>
                      <span className="text-amber-400 font-mono">1h 45m left</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">🎬 Movie GP</span>
                      <span className="text-[10px] text-white/40">3.5 km away</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Horror fans: Insidious review</span>
                    <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
                      <span>4/5 members</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 font-bold text-[9px]">Permanent</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Box 2: 1v1 Temporary Chats */}
            <Reveal delay={100}>
              <div className="h-full bg-gradient-to-br from-pink-500/10 to-[#1d0023] border border-pink-500/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/15 flex items-center justify-center mb-5">
                    <MessageCircle className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">24h Direct DMs</h3>
                  <p className="text-white/50 text-xs leading-relaxed mb-6">
                    Matching creates a 24-hour temporary conversation space. Continue the chat if you build a true connection, or let it expire naturally with zero pressure.
                  </p>
                </div>

                {/* Mock conversation snippet */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/5 space-y-2">
                  <div className="text-left">
                    <span className="text-[9px] text-white/40 block">Viber Match</span>
                    <span className="inline-block bg-white/10 text-white text-xs px-3 py-1.5 rounded-2xl mt-0.5">Let's talk about the AI icebreaker!</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-2xl mt-0.5">Haha it worked so well!</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Box 3: AI Icebreakers */}
            <Reveal delay={150}>
              <div className="h-full bg-gradient-to-br from-amber-500/10 to-[#190600] border border-amber-500/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gemini AI Icebreakers</h3>
                  <p className="text-white/50 text-xs leading-relaxed mb-6">
                    Stuck on how to start? Get custom icebreaker suggestions tailored to their exact vibe card properties in one click.
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Icebreaker Prompt</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed italic">
                    &ldquo;Since your tag says #lofi and you intend to chill, what&apos;s your go-to late-night programming album?&rdquo;
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Box 4: Interactive Sparks Mini Games - Playable directly! */}
            <Reveal delay={200} className="md:col-span-2">
              <div className="h-full bg-gradient-to-br from-emerald-500/10 to-[#02170f] border border-emerald-500/10 rounded-3xl p-8 hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="flex-1 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
                    <Heart className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Sparks Mini-Games</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    Bond over instant, real-time mini-games inside your chat workspaces. Play Tic-Tac-Toe or Connect Four without leaving the conversation panel.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                    🎮 Try Playable Demo Right Here!
                  </div>
                </div>

                {/* Playable mini Tic-Tac-Toe Widget */}
                <div className="w-44 shrink-0 bg-black/60 border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">Turn: {isXNext ? "❌" : "⭕"}</span>
                    {winner && (
                      <button onClick={resetGame} className="text-emerald-400 font-bold hover:underline">
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {board.map((cell, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCellClick(idx)}
                        className="h-10 w-full bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        {cell}
                      </button>
                    ))}
                  </div>

                  <div className="text-center text-[10px] text-white/50 font-medium">
                    {winner ? (winner === "Draw" ? "🤝 It's a draw!" : `🎉 Winner: ${winner}`) : "Align 3 to win!"}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Box 5: Whisper Space */}
            <Reveal delay={250}>
              <div className="h-full bg-gradient-to-br from-violet-500/10 to-[#100122] border border-violet-500/10 rounded-3xl p-8 hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/5 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-5">
                    <Send className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Whisper Space</h3>
                  <p className="text-white/50 text-xs leading-relaxed mb-6">
                    A safe, anonymous local wall to share confessions, random thoughts, or seek support from the community without disclosing your profile metadata.
                  </p>
                </div>

                {/* Interactive Whisper Card Mockup */}
                <div className="p-3 bg-linear-to-br from-violet-900/30 to-purple-950/20 border border-violet-500/20 rounded-2xl relative">
                  <span className="text-[8px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full absolute -top-2.5 left-3 font-bold uppercase tracking-wider">
                    Anonymous Whisper
                  </span>
                  <p className="text-xs text-white/90 leading-relaxed italic min-h-[40px] pt-1">
                    &ldquo;{whispers[whisperIdx]}&rdquo;
                  </p>
                  <button
                    onClick={rotateWhisper}
                    className="mt-2 text-[10px] text-purple-400 font-bold flex items-center gap-1 hover:text-purple-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Read Another
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Box 6: Listening Space (Open to Listen) */}
            <Reveal delay={300} className="md:col-span-2">
              <div className="h-full bg-gradient-to-br from-teal-500/10 to-[#00120f] border border-teal-500/10 rounded-3xl p-8 hover:border-teal-500/30 transition-all hover:shadow-xl hover:shadow-teal-500/5 flex flex-col md:flex-row gap-6 items-stretch justify-between">
                <div className="flex-1 flex flex-col justify-between text-left">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/15 flex items-center justify-center mb-5">
                      <HeartHandshake className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Listening Space & Profiles</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                      Step up as a listener or find support when things get heavy. Toggle your status to go online, accept anonymous topic cards, and join private support chats. Build listening stats to highlight your empathy rating.
                    </p>
                  </div>

                  {/* Status Toggle & Stats Mockup */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setReadyToListen(!readyToListen);
                          if (readyToListen) {
                            endListeningSession();
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          readyToListen ? "bg-teal-500" : "bg-white/10"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            readyToListen ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-white/80">
                        {readyToListen ? (
                          <span className="flex items-center gap-2 text-teal-400">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                            Open to Listen (Online)
                          </span>
                        ) : (
                          "Offline • Toggle to Start Listening"
                        )}
                      </span>
                    </div>

                    <div className="flex gap-4 border-t border-white/5 pt-4 text-xs text-white/40">
                      <div>
                        <span className="block text-white/70 font-mono font-bold">14.5 hrs</span>
                        <span>Total Listened</span>
                      </div>
                      <div>
                        <span className="block text-white/70 font-mono font-bold">4.9 ★</span>
                        <span>Empathy Rating</span>
                      </div>
                      <div>
                        <span className="block text-white/70 font-mono font-bold">O(1) Performance</span>
                        <span>Cached Duration</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Area */}
                <div className="w-full md:w-80 shrink-0 bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
                  {!readyToListen ? (
                    /* Inactive Offline State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-3">
                        <HeartHandshake className="w-5 h-5 text-white/25" />
                      </div>
                      <h4 className="text-xs font-bold text-white/60 mb-1">Listener Board Offline</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">
                        Toggle your &ldquo;Open to Listen&rdquo; status to start viewing support cards and helping others in your area.
                      </p>
                    </div>
                  ) : listeningSessionActive ? (
                    /* Active Simulated Chat State */
                    <div className="flex-1 flex flex-col justify-between h-full">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Support Session</span>
                        <button
                          onClick={endListeningSession}
                          className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-2 py-0.5 rounded-full"
                        >
                          End
                        </button>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[140px] pr-1 mb-3 text-[11px] scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                        {chatMessages.map((msg, i) => {
                          if (msg.sender === "system") {
                            return (
                              <div key={i} className="text-center text-[9px] text-white/30 italic py-1 leading-tight border-b border-white/5 mb-2">
                                {msg.text}
                              </div>
                            );
                          }
                          const isSeeker = msg.sender === "seeker";
                          return (
                            <div
                              key={i}
                              className={`flex flex-col max-w-[85%] ${
                                isSeeker ? "self-start text-left" : "self-end text-right ml-auto"
                              }`}
                            >
                              <div
                                className={`px-3 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                                  isSeeker
                                    ? "bg-white/5 border border-white/5 text-white/90 rounded-tl-none"
                                    : "bg-teal-500 text-[#00120f] font-semibold rounded-tr-none"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                        {isTypingResponse && (
                          <div className="flex items-center gap-1.5 text-[9px] text-white/40 italic mt-1 self-start">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span>Seeker is typing...</span>
                          </div>
                        )}
                      </div>

                      {/* Empathetic Pre-defined Reply Options */}
                      {chatMessages.length === 2 && !isTypingResponse && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/30 block mb-1">Choose a supportive reply:</span>
                          {mockSupportRequests[activeRequestIndex].options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendSupportMessage(opt)}
                              className="w-full text-left p-2 bg-white/5 border border-white/5 hover:border-teal-500/40 hover:bg-teal-500/5 text-white/80 hover:text-white rounded-xl text-[10px] leading-tight transition-all"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {chatMessages.length > 2 && !isTypingResponse && (
                        <div className="text-center pt-2">
                          <span className="text-[10px] text-teal-400 font-bold block mb-1">Session Complete!</span>
                          <button
                            onClick={endListeningSession}
                            className="w-full py-2 bg-teal-500 text-[#00120f] font-bold text-xs rounded-xl hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
                          >
                            Close & Rate listener
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Active Listener Board State (Support Cards List) */
                    <div className="flex-1 flex flex-col justify-between h-full">
                      <div>
                        {/* Request Cards Navigation Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Active Cards ({mockSupportRequests.length})</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setActiveRequestIndex((prev) => (prev > 0 ? prev - 1 : mockSupportRequests.length - 1))}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors animate-pulse"
                            >
                              ←
                            </button>
                            <span className="text-[10px] font-mono text-white/40 px-1 bg-white/5 rounded flex items-center justify-center">
                              {activeRequestIndex + 1}/{mockSupportRequests.length}
                            </span>
                            <button
                              onClick={() => setActiveRequestIndex((prev) => (prev < mockSupportRequests.length - 1 ? prev + 1 : 0))}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors animate-pulse"
                            >
                              →
                            </button>
                          </div>
                        </div>

                        {/* Request Content */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between font-semibold">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] border ${
                              mockSupportRequests[activeRequestIndex].heaviness === "Heavy"
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : mockSupportRequests[activeRequestIndex].heaviness === "Moderate"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
                            }`}>
                              {mockSupportRequests[activeRequestIndex].topic} • {mockSupportRequests[activeRequestIndex].heaviness}
                            </span>
                            <span className="text-[9px] text-white/40 font-semibold">{mockSupportRequests[activeRequestIndex].user.split(",")[1].trim()}</span>
                          </div>

                          <p className="text-xs text-white/80 leading-relaxed font-medium italic min-h-[50px] bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                            &ldquo;{mockSupportRequests[activeRequestIndex].reason}&rdquo;
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={startListeningSession}
                        className="w-full mt-4 py-2.5 rounded-xl bg-teal-500 text-[#00120f] font-bold text-xs hover:bg-teal-400 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/15"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Connect & Listen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.25em] text-pink-400 font-semibold mb-3">SIMPLE DIRECT PATHWAY</p>
              <h2 className="text-4xl md:text-5xl font-bold">How Vibess Works</h2>
              <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto mt-4">
                Four simple steps to broadcast your frequency, discover matches, and build real connections on your own terms.
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left side: Step Selector */}
            <div className="lg:col-span-5 space-y-4">
              {[
                { step: "01", icon: Sparkles, color: "purple", title: "Broadcast Your Vibe", desc: "Select your emoji, describe your current mood keywords, choose a track, and set your energy level." },
                { step: "02", icon: MapPin, color: "pink", title: "Scan Proximity Radar", desc: "Adjust your range scanner (from 5km to 50km+) to find active vibe cards and temporary Group Chats (GPs) around you." },
                { step: "03", icon: MessageCircle, color: "amber", title: "Chat with Zero Pressure", desc: "Initiate 24-hour temporary chat windows. Make use of personalized Gemini AI icebreakers when the conversation gets stuck." },
                { step: "04", icon: Star, color: "emerald", title: "Form Permanent Bonds", desc: "Cast follow votes to make chats permanent, or collectively vote to upgrade temporary Group Chats into lifetime hubs." },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeStep === idx;
                const colorClassMap: Record<string, string> = {
                  purple: "text-purple-400 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40",
                  pink: "text-pink-400 border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40",
                  amber: "text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
                  emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40",
                };
                return (
                  <Reveal key={idx} delay={idx * 50}>
                    <button
                      onClick={() => setActiveStep(idx)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 select-none ${
                        isActive
                          ? "bg-white/[0.04] border-white/10 shadow-lg shadow-purple-500/5 translate-x-2"
                          : "bg-transparent border-transparent hover:bg-white/[0.01] hover:border-white/5 opacity-55 hover:opacity-100"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border ${
                        isActive ? colorClassMap[item.color].split(" ")[1] : "border-white/5"
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? colorClassMap[item.color].split(" ")[0] : "text-white/40"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isActive ? colorClassMap[item.color].split(" ")[0] : "text-white/30"}`}>
                            Step {item.step}
                          </span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />}
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </div>

            {/* Right side: Dynamic Preview Mockup */}
            <div className="lg:col-span-7 flex justify-center w-full relative">
              <Reveal delay={200} className="w-full max-w-lg">
                <div className="w-full aspect-video sm:aspect-[4/3] bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between overflow-hidden relative min-h-[320px] transition-all duration-500">
                  <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Dynamic Mockup Headers */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <span className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest flex items-center gap-1.5 select-none">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      Interactive Sandbox Simulator
                    </span>
                    <span className="text-xs font-bold text-white/60 select-none">
                      Preview: Step {activeStep + 1}
                    </span>
                  </div>

                  {/* Render Visual based on activeStep */}
                  <div className="flex-1 flex flex-col justify-center items-center relative">
                    {activeStep === 0 && (
                      /* Broadcast Vibe Mockup */
                      <div className="w-full max-w-xs bg-gradient-to-b from-purple-900/30 to-black/80 border border-purple-500/20 rounded-2xl p-5 text-left animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-4xl block mb-1 select-none">🤯</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] text-purple-300 font-bold select-none">
                              Status: Ambition Mode
                            </span>
                          </div>
                          <span className="text-sm font-mono font-bold text-purple-300 select-none">88% Energy</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed mb-3 italic font-semibold select-none">
                          &ldquo;Writing compiler logic at 3 AM. Need a soundboard to review TS interfaces.&rdquo;
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 border-t border-white/5 pt-2.5">
                          <span className="text-purple-400">🎵 Music Genre:</span>
                          <span className="text-white/70 font-semibold select-none">Synthwave Lofi</span>
                        </div>
                      </div>
                    )}

                    {activeStep === 1 && (
                      /* Scan Radar Mockup */
                      <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center relative animate-pulse-slow">
                        {/* Radar sweep */}
                        <div className="absolute inset-0 rounded-full opacity-10 animate-spin-slow pointer-events-none" style={{ background: "conic-gradient(from 0deg, rgba(168,85,247,0.25) 0%, transparent 60%)" }} />
                        {/* Inner rings */}
                        <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center" />
                        <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center" />
                        
                        {/* Pulse Center */}
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-pink-500 animate-ping" />
                        </div>

                        {/* Found matches */}
                        <div className="absolute top-8 left-12 p-1.5 rounded-full bg-black/80 border border-purple-500/30 flex items-center gap-1.5 text-[9px] font-bold shadow-lg animate-float-slow">
                          <span>😴</span>
                          <span className="text-white/80">92% Match</span>
                          <span className="text-white/30 font-mono">1.2km</span>
                        </div>

                        <div className="absolute bottom-12 right-6 p-1.5 rounded-full bg-black/80 border-pink-500/30 flex items-center gap-1.5 text-[9px] font-bold shadow-lg animate-float-slow" style={{ animationDelay: '1.5s' }}>
                          <span>🤪</span>
                          <span className="text-white/80">78% Match</span>
                          <span className="text-white/30 font-mono">3.4km</span>
                        </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      /* Chat with Zero Pressure Mockup */
                      <div className="w-full max-w-xs bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-left space-y-3 shadow-xl relative">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
                            <span className="text-[10px] font-bold text-white">Nikhil, 3.4km away</span>
                          </div>
                          <span className="text-[9px] text-amber-400 font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full font-bold">23h remaining</span>
                        </div>
                        <div className="space-y-2 text-[10px]">
                          <div className="bg-white/5 px-3 py-1.5 rounded-xl rounded-tl-none self-start max-w-[80%] text-white/90">
                            Hey, saw you match 92% on overthinking topics?
                          </div>
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-xl rounded-tr-none self-end max-w-[80%] ml-auto text-right font-medium">
                            Haha yes, debugging compiler configurations!
                          </div>
                        </div>
                        <div className="pt-2 border-t border-dashed border-white/10 text-[9px] text-white/40">
                          <span className="text-emerald-400 font-bold">AI Suggestion:</span> Ask what their favorite late night snack is.
                        </div>
                      </div>
                    )}

                    {activeStep === 3 && (
                      /* Star Permanent Bonding Mockup */
                      <div className="w-full max-w-xs bg-[#0b061c]/80 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                          <Star className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1">Make Group Chat Permanent?</h4>
                          <p className="text-[10px] text-white/55 leading-relaxed">
                            Active Group Chats can be converted into permanent rooms if 70% of members agree.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-emerald-400">
                            <span>Voting Approval:</span>
                            <span>80% Met (4/5 votes)</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '80%' }} />
                          </div>
                        </div>
                        <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 font-bold text-[9px] select-none">
                          🎉 Group Chat Upgraded to Permanent
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sandbox Navigation Controls */}
                  <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[10px] text-white/30">
                    <span>Active Wavelength: 94.6 FM</span>
                    <div className="flex gap-1.5 font-bold">
                      <button
                        onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 3))}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors font-semibold"
                      >
                        Prev Step
                      </button>
                      <button
                        onClick={() => setActiveStep((prev) => (prev < 3 ? prev + 1 : 0))}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors font-semibold"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ APP DEMO PREVIEW SECTION ═══════════════════ */}
      <section id="demo" className="relative z-10 py-24 px-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.25em] text-purple-400 font-semibold mb-3">Vibe-first, zero-pressure</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Not a dating app. Not a stress zone.
              </h2>
              <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
                Just a comfortable space to express your mood, join group chats, and talk on your own terms.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-12 gap-12 items-center w-full relative">
            
            {/* Visual Left - details matching user upload */}
            <div className="md:col-span-5 text-left flex flex-col justify-center space-y-6">
              <Reveal delay={100}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 text-[10px] font-bold tracking-widest text-pink-400 uppercase select-none w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  VIBE DIRECT CHATS
                </div>
              </Reveal>

              <Reveal delay={150}>
                <h3 className="text-3xl font-extrabold text-white leading-tight">
                  A window to talk, not a lifetime commitment.
                </h3>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                  Every match opens a 24-hour chat. If it's good, it keeps going. If it's not, it just quietly closes.
                </p>
              </Reveal>

              <Reveal delay={250}>
                <ul className="space-y-3.5 text-xs text-white/70 font-semibold">
                  <li className="flex items-start gap-2.5">
                    <span className="text-purple-400 font-mono font-bold select-none">+</span>
                    <span>Gemini-powered icebreakers when the silence gets awkward</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-purple-400 font-mono font-bold select-none">+</span>
                    <span>Block, report, and follow — right from the chat</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-purple-400 font-mono font-bold select-none">+</span>
                    <span>No lingering threads, no ghosting guilt</span>
                  </li>
                </ul>
              </Reveal>
            </div>

            {/* Visual Right - mock chat card from user upload */}
            <div className="md:col-span-7 flex justify-center w-full relative z-10">
              <Reveal delay={300} className="w-full max-w-md">
                <div className="w-full bg-[#110c24]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-6 select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 shadow-md shadow-pink-500/20 animate-pulse" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">Anaya, 2.1km away</span>
                      </div>
                    </div>
                    <span className="border border-amber-500/35 px-3 py-1 rounded-full text-[10px] text-amber-400 font-mono font-bold bg-amber-500/5">
                      23:41:07 left
                    </span>
                  </div>

                  {/* Chat Messages Area */}
                  <div className="space-y-4 flex-1 flex flex-col justify-end text-xs mb-6 select-none">
                    {/* Msg 1 (Left) */}
                    <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-left text-white/90 leading-relaxed self-start">
                      omg you like connect four too??
                    </div>
                    
                    {/* Msg 2 (Right) */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] text-left text-white leading-relaxed self-end shadow-md shadow-purple-500/10">
                      only competitively
                    </div>

                    {/* Msg 3 (Left) */}
                    <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-left text-white/90 leading-relaxed self-start">
                      it's giving chaos vibe energy ngl
                    </div>
                  </div>

                  {/* AI Icebreaker Footer */}
                  <div className="border-t border-dashed border-white/10 pt-4 flex items-start gap-2 text-[10px] text-white/50 text-left leading-relaxed select-none">
                    <span className="text-emerald-400 font-semibold select-none">✦</span>
                    <p>
                      <span className="text-white/30 font-semibold">Icebreaker: </span>
                      ask her what her go-to overthinking-at-2am song is
                    </p>
                  </div>

                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════ LISTENING SPACE PROFILE HIGHLIGHT ═══════════════════ */}
      <section id="listening-space-details" className="relative z-10 py-24 px-6 bg-gradient-to-br from-[#021b17]/50 via-transparent to-transparent border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-12 items-center w-full relative">
          
          {/* Mock Illustration or Cards on the Left */}
          <div className="md:col-span-6 flex justify-center w-full order-last md:order-first">
            <Reveal delay={150} className="w-full max-w-md">
              <div className="w-full bg-[#001411]/60 border border-teal-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Topic tags row */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 select-none">
                    💆 Empathy-First Space
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 select-none">
                    🔒 100% Anonymous
                  </span>
                </div>

                {/* Main illustration quote block */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/55 uppercase tracking-wider">Heavy Support Request</span>
                  </div>
                  <p className="text-sm font-semibold text-white/90 leading-relaxed italic">
                    &ldquo;Everything feels heavy tonight and I have nobody to hear me. Just need to vent without being judged.&rdquo;
                  </p>
                </div>

                {/* Quick listener profile snippet */}
                <div className="flex items-center gap-3 p-3 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg select-none">
                    😌
                  </div>
                  <div className="text-left flex-1">
                    <span className="text-xs font-bold text-white block">Active Listener Connected</span>
                    <span className="text-[9px] text-teal-400 font-medium">Ready to support, validate, and hear you out</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">5.0 ★</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Details Column on the Right */}
          <div className="md:col-span-6 text-left flex flex-col justify-center space-y-6">
            <Reveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-[10px] font-bold tracking-widest text-teal-400 uppercase select-none w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Listening Space
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                When it feels heavy, and there&apos;s nobody to hear you.
              </h3>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                Sometimes, you just need a safe space to release what&apos;s weighing you down. The Listening Space connects you with empathetic listeners who are online solely to hear you out, validate your feelings, and offer quiet support.
              </p>
            </Reveal>

            <Reveal delay={250}>
              <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-white/80">
                <div className="space-y-1">
                  <h4 className="text-teal-400 font-bold flex items-center gap-1.5">
                    ✦ Zero Judgment
                  </h4>
                  <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                    Share your thoughts anonymously without revealing your main profile or matching preferences.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-teal-400 font-bold flex items-center gap-1.5">
                    ✦ Filter by Heaviness
                  </h4>
                  <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                    Flag requests as Light, Moderate, or Heavy so listeners are fully prepared to support your specific needs.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-teal-400 font-bold flex items-center gap-1.5">
                    ✦ Verified Empathy
                  </h4>
                  <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                    Listeners earn reviews, feedback tags, and ratings based on active sessions to maintain a warm, safe workspace.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-teal-400 font-bold flex items-center gap-1.5">
                    ✦ O(1) Performance Caching
                  </h4>
                  <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                    Seamless session duration logging is optimized in the background so that profile performance is never impacted.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MANIFESTO ═══════════════════ */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent to-[#0b0018]">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl sm:text-4xl font-extrabold leading-snug">
              <span className="text-white/90">&ldquo;Not a dating app. Not a stress zone. Just a place to </span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">feel heard</span>
              <span className="text-white/90">, have fun, and make </span>
              <span className="bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">real friends</span>
              <span className="text-white/90"> — based on vibes, not photos.&rdquo;</span>
            </blockquote>

            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {["Feel understood", "Express your mood", "Zero judgment", "Real connections"].map((text, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="relative z-10 py-28 px-6">
        <Reveal>
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl rounded-full" />

            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
                Ready to share your vibe?
              </h2>
              <p className="text-sm sm:text-base text-white/50 mb-10 max-w-md mx-auto">
                Create your Vibe Card in less than 30 seconds and start matching.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vibess</span>
          </div>

          <div className="flex gap-8 text-sm text-white/40">
            <Link href="/about" className="hover:text-white/70 transition-colors">About</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
          </div>

          <p className="text-xs text-white/20">© 2026 Vibess. All vibes reserved.</p>
        </div>
      </footer>
    </div>
  );
}
