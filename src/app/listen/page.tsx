"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/src/hooks/useSocket";
import {
  HeartHandshake,
  Loader2,
  MessageSquare,
  Trash2,
  Clock,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Volume2,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createListenCard,
  getMyActiveListenCard,
  cancelListenCard,
  getListenCards,
  acceptListenCard,
  getListenStatus,
  selectListenerForCard,
  rateListener,
  getMyListenChats
} from "../lib/vibeApi";
import { updateReadyToListen } from "../lib/api";

const TOPIC_PRESETS = [
  { id: "work", label: "💼 Work Stress", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/30" },
  { id: "heartbreak", label: "💔 Heartbreak", color: "from-red-500/10 to-pink-500/10 border-red-500/30" },
  { id: "lonely", label: "🌌 Lonely Night", color: "from-purple-500/10 to-indigo-500/10 border-purple-500/30" },
  { id: "dread", label: "🌀 Existential Dread", color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30" },
  { id: "family", label: "🏡 Family Issues", color: "from-amber-500/10 to-orange-500/10 border-amber-500/30" },
  { id: "anxiety", label: "📈 Overwhelm", color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30" },
];

export default function ListenPage() {
  const router = useRouter();
  const { socket, connected } = useSocket();

  // Core status states
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const [readyToListen, setReadyToListen] = useState(false);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [listenCards, setListenCards] = useState<any[]>([]);

  // Listen chats history and rating states
  const [myListenChats, setMyListenChats] = useState<any[]>([]);
  const [loadingMyChats, setLoadingMyChats] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingCardId, setRatingCardId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [selectingListenerId, setSelectingListenerId] = useState<string | null>(null);

  // Loading states
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [acceptingCardId, setAcceptingCardId] = useState<string | null>(null);
  const [togglingReady, setTogglingReady] = useState(false);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [reason, setReason] = useState("");
  const [heaviness, setHeaviness] = useState<"Light" | "Moderate" | "Heavy">("Light");

  // Timer reference for ban countdown
  const [banTimeRemaining, setBanTimeRemaining] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all initial data
  useEffect(() => {
    fetchListenData();
  }, []);

  // Sync listener card list when readyToListen changes
  useEffect(() => {
    if (readyToListen && !isBlocked && !isBanned) {
      loadOtherCards();
    } else {
      setListenCards([]);
    }
  }, [readyToListen, isBlocked, isBanned]);

  // Handle ban countdown
  useEffect(() => {
    if (isBanned && banUntil) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(banUntil).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setIsBanned(false);
          setBanTimeRemaining(null);
          if (timerRef.current) clearInterval(timerRef.current);
          fetchStatusAndActiveCard();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setBanTimeRemaining(
            `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBanned, banUntil]);

  // Listen for socket events for real-time connection and offers
  useEffect(() => {
    if (!socket || !connected) return;

    const handleOfferReceived = (data: any) => {
      console.log("Listen offer received in real-time:", data);
      fetchStatusAndActiveCard();
      toast("✨ Someone offered to listen to your card!", { icon: "🤝" });
    };

    const handleChatStarted = (data: any) => {
      console.log("Your listen offer was accepted, redirecting to chat:", data);
      toast.success("Your offer was accepted! Redirecting to chat...");
      router.push(`/chat/${data.chatId}`);
    };

    socket.on("listen-offer-received", handleOfferReceived);
    socket.on("listen-chat-started-notify", handleChatStarted);

    return () => {
      socket.off("listen-offer-received", handleOfferReceived);
      socket.off("listen-chat-started-notify", handleChatStarted);
    };
  }, [socket, connected]);

  const fetchListenData = async () => {
    await fetchStatusAndActiveCard();
    await loadMyChats();
  };

  const fetchStatusAndActiveCard = async () => {
    try {
      setLoadingStatus(true);
      const statusRes = await getListenStatus();
      if (statusRes.success) {
        setIsBlocked(statusRes.isBlocked);
        setIsBanned(statusRes.isBanned);
        setBanUntil(statusRes.banUntil);
        setReadyToListen(statusRes.readyToListen);
      }

      if (!statusRes.isBlocked && !statusRes.isBanned) {
        const activeRes = await getMyActiveListenCard();
        if (activeRes.success) {
          setActiveCard(activeRes.activeCard);
        }
      }
    } catch (error) {
      console.error("Error fetching listen status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadMyChats = async () => {
    try {
      setLoadingMyChats(true);
      const res = await getMyListenChats();
      if (res.success) {
        setMyListenChats(res.chats || []);
      }
    } catch (error) {
      console.error("Error loading my listen chats:", error);
    } finally {
      setLoadingMyChats(false);
    }
  };

  const handleSelectListener = async (cardId: string, listenerId: string) => {
    if (selectingListenerId) return;
    setSelectingListenerId(listenerId);
    try {
      const res = await selectListenerForCard(cardId, listenerId);
      if (res.success && res.chatId) {
        toast.success("Connection started! Entering chat room...");

        // Notify the listener via Socket in real-time
        if (socket && connected) {
          socket.emit("listen-chat-started", {
            listenerId,
            chatId: res.chatId,
          });
        }

        router.push(`/chat/${res.chatId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to connect to listener");
    } finally {
      setSelectingListenerId(null);
    }
  };

  const handleRateSubmit = async () => {
    if (!ratingCardId) return;
    setSubmittingRating(true);
    try {
      const res = await rateListener(ratingCardId, selectedRating);
      if (res.success) {
        toast.success("Thank you for your rating!");
        setShowRatingModal(false);
        setRatingCardId(null);
        fetchListenData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const loadOtherCards = async () => {
    try {
      setLoadingCards(true);
      const res = await getListenCards();
      if (res.success) {
        setListenCards(res.cards || []);
      }
    } catch (error) {
      console.error("Error loading listen cards:", error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleToggleReadyToListen = async () => {
    if (togglingReady) return;
    setTogglingReady(true);
    try {
      const newValue = !readyToListen;
      const res = await updateReadyToListen(newValue);
      const updatedValue = res?.user?.readyToListen ?? res?.readyToListen ?? newValue;
      setReadyToListen(updatedValue);
      toast.success(
        updatedValue
          ? "You are now open to listening to others!"
          : "Stopped listening mode"
      );
    } catch (error: any) {
      toast.error("Failed to toggle listen status");
    } finally {
      setTogglingReady(false);
    }
  };

  const handleCreateRequest = async () => {
    const finalTopic = topic === "custom" ? customTopic.trim() : topic;
    if (!finalTopic) {
      toast.error("Please specify a topic");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please explain why it feels heavy");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createListenCard({
        topic: finalTopic,
        reason: reason.trim(),
        heaviness,
      });

      if (res.success) {
        toast.success("Listen request card created successfully!");
        setActiveCard(res.card);
        setShowCreateForm(false);
        // Reset form
        setTopic("");
        setCustomTopic("");
        setReason("");
        setHeaviness("Light");
        setFormStep(1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeCard) return;
    if (!confirm("Are you sure you want to cancel your listen request?")) return;

    setCancelling(true);
    try {
      const res = await cancelListenCard(activeCard._id);
      if (res.success) {
        toast.success("Listen request cancelled");
        setActiveCard(null);
      }
    } catch (error) {
      toast.error("Failed to cancel request");
    } finally {
      setCancelling(false);
    }
  };

  const handleAcceptCard = async (cardId: string, cardOwnerId: string) => {
    if (acceptingCardId) return;
    setAcceptingCardId(cardId);
    try {
      const res = await acceptListenCard(cardId);
      if (res.success) {
        toast.success("Offer submitted successfully! Waiting for speaker to connect.");

        // Notify the card owner via Socket in real-time
        if (socket && connected) {
          socket.emit("new-listen-offer", {
            cardOwnerId,
            cardId,
          });
        }

        // Refresh cards list to remove this card
        loadOtherCards();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to accept request");
      // Refresh list in case it was already taken
      loadOtherCards();
    } finally {
      setAcceptingCardId(null);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60 font-medium">Checking Listen status...</p>
        </div>
      </div>
    );
  }

  // Blocked state view
  if (isBlocked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-black/50 border border-red-500/30 backdrop-blur-xl p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Access Restricted</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
            Due to receiving multiple community reports for violating our safety guidelines, your access to the **Listen** feature has been permanently blocked.
          </p>
          <div className="pt-4 border-t border-white/5 max-w-md mx-auto">
            <p className="text-white/40 text-sm">
              If you believe this is a mistake, please reach out to support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Banned state view
  if (isBanned) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-black/50 border border-amber-500/30 backdrop-blur-xl p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Clock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Temporarily Restricted</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
            Your account is temporarily suspended from using the **Listen** feature for 24 hours following a report.
          </p>

          {banTimeRemaining && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-xs mx-auto">
              <span className="text-xs text-white/40 uppercase tracking-widest font-semibold block mb-1">Time Remaining</span>
              <span className="text-2xl font-mono font-bold text-amber-400">{banTimeRemaining}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getHeavinessStyle = (lvl: "Light" | "Moderate" | "Heavy") => {
    switch (lvl) {
      case "Light":
        return {
          glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
          border: "border-cyan-500/30 hover:border-cyan-500/60",
          bg: "from-cyan-500/10 to-blue-500/5",
          badge: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
          emoji: "☁️"
        };
      case "Moderate":
        return {
          glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
          border: "border-purple-500/30 hover:border-purple-500/60",
          bg: "from-purple-500/10 to-pink-500/5",
          badge: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
          emoji: "⛰️"
        };
      case "Heavy":
        return {
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
          border: "border-red-500/30 hover:border-red-500/60",
          bg: "from-red-500/10 to-orange-500/5",
          badge: "bg-red-500/20 text-red-300 border border-red-500/30",
          emoji: "🌋"
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-purple-900/40 via-pink-900/20 to-black/60 border border-white/10 p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-pink-400 font-bold text-sm tracking-wider uppercase">
            <HeartHandshake className="w-4 h-4" />
            <span>Support Space</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Need a Listening Ear?</h1>
          <p className="text-white/60 max-w-xl">
            Share what's weighing heavy on your heart anonymously, or support someone else. All chats auto-expire in 5 hours for privacy.
          </p>
        </div>

        {/* Quick actions or status info */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <button
            onClick={handleToggleReadyToListen}
            disabled={togglingReady}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full font-bold border transition-all ${readyToListen
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
              }`}
          >
            {togglingReady ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Volume2 className={`w-5 h-5 ${readyToListen ? "animate-pulse" : ""}`} />
            )}
            <span>{readyToListen ? "Listening Mode: ON" : "Turn ON Listening Mode"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Request Management */}
        <div className="lg:col-span-1 space-y-8">

          {/* Section: Your Status */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Your Request Status</span>
            </h2>

            {activeCard ? (
              // Active Request Card
              <div className={`relative overflow-hidden bg-linear-to-b ${getHeavinessStyle(activeCard.heaviness).bg} border ${getHeavinessStyle(activeCard.heaviness).border} p-5 rounded-2xl ${getHeavinessStyle(activeCard.heaviness).glow} space-y-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">ACTIVE REQUEST</span>
                  <span className={getHeavinessStyle(activeCard.heaviness).badge}>
                    {getHeavinessStyle(activeCard.heaviness).emoji} {activeCard.heaviness}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-extrabold text-lg truncate">{activeCard.topic}</h3>
                  <p className="text-white/70 text-sm mt-2 line-clamp-4 leading-relaxed italic">
                    "{activeCard.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/40 pt-2 border-t border-white/5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires in: {new Date(activeCard.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {/* Listener Offers List */}
                {activeCard.offers && activeCard.offers.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">Interested Listeners ({activeCard.offers.length})</h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {activeCard.offers.map((offer: any) => {
                        const l = offer.listener;
                        if (!l) return null;
                        const hasRating = l.ratingCount > 0;
                        return (
                          <div key={offer._id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 transition-all hover:bg-white/10">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {l.profileImage ? (
                                <img src={l.profileImage} alt={l.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-300 border border-purple-500/30">
                                  {l.name?.[0] || "U"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate leading-none">{l.name}</p>
                                <p className="text-white/40 text-[10px] truncate mt-1">@{l.username}</p>
                                <p className="text-[10px] text-amber-400 mt-1 font-semibold">
                                  {hasRating ? `⭐ ${l.rating} (${l.ratingCount} reviews)` : "⭐ New Listener"}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleSelectListener(activeCard._id, l._id)}
                              disabled={selectingListenerId !== null}
                              className="shrink-0 px-2.5 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-md"
                            >
                              {selectingListenerId === l._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Connect"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold rounded-xl text-sm transition-all"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Cancel Request</span>
                </button>
              </div>
            ) : showCreateForm ? (
              // Create Request Form
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-sm font-semibold text-white/80">Step {formStep} of 3</span>
                  <button
                    onClick={() => { setShowCreateForm(false); setFormStep(1); }}
                    className="text-white/40 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {formStep === 1 && (
                  // Step 1: Select Preset Topic
                  <div className="space-y-4 animate-fadeIn">
                    <label className="text-sm font-medium text-white/80 block">What is this about?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TOPIC_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => { setTopic(preset.label); setFormStep(2); }}
                          className={`p-3 rounded-xl border text-left text-sm text-white/90 hover:bg-white/5 transition-all ${preset.color}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => { setTopic("custom"); setFormStep(2); }}
                      className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all"
                    >
                      ✍️ Custom Topic
                    </button>
                  </div>
                )}

                {formStep === 2 && (
                  // Step 2: Reason details
                  <div className="space-y-4 animate-fadeIn">
                    {topic === "custom" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 block">Custom Topic Summary</label>
                        <input
                          type="text"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value.slice(0, 100))}
                          placeholder="e.g. Life changes, toxic colleagues"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-sm text-white/60">
                        Topic: <strong className="text-white">{topic}</strong>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-white/80 block">Why is it heavy?</label>
                        <span className="text-[10px] text-white/40">{reason.length}/1000</span>
                      </div>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                        placeholder="Detail what is weighing on you. Be as honest as you want."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setFormStep(1); }}
                        className="flex-1 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-xl"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => { setFormStep(3); }}
                        disabled={topic === "custom" ? !customTopic.trim() || !reason.trim() : !reason.trim()}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  // Step 3: Heaviness level
                  <div className="space-y-4 animate-fadeIn">
                    <label className="text-sm font-medium text-white/80 block">How heavy does this feel?</label>
                    <div className="flex flex-col gap-2">
                      {(["Light", "Moderate", "Heavy"] as const).map((lvl) => {
                        const style = getHeavinessStyle(lvl);
                        return (
                          <button
                            key={lvl}
                            onClick={() => setHeaviness(lvl)}
                            className={`p-3 border rounded-xl text-left flex items-center justify-between transition-all ${heaviness === lvl
                                ? `${style.border} bg-white/10`
                                : "border-white/5 bg-transparent hover:bg-white/5"
                              }`}
                          >
                            <div>
                              <p className="text-white font-bold text-sm">{lvl}</p>
                              <p className="text-white/40 text-[10px]">
                                {lvl === "Light" && "Just want to speak, low tension"}
                                {lvl === "Moderate" && "Weighing on me, need support"}
                                {lvl === "Heavy" && "Hurting inside, feeling overwhelmed"}
                              </p>
                            </div>
                            <span className="text-xl">{style.emoji}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setFormStep(2); }}
                        className="flex-1 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-xl"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateRequest}
                        disabled={submitting}
                        className="flex-1 py-2 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Submit Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Empty Request View
              <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl space-y-4">
                <p className="text-white/40 text-sm">You do not have any active request.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-5 py-2.5 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 mx-auto shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Share What's Heavy</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Your Listen Chats */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-400" />
              <span>Your Listen Chats</span>
            </h2>
            {loadingMyChats ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
              </div>
            ) : myListenChats.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4">No recent listen sessions.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myListenChats.map((c) => {
                  const isEnded = c.isLocked;
                  const cardTitle = c.card?.topic || "Listen Session";
                  return (
                    <div key={c._id} className="bg-black/30 border border-white/5 p-3.5 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isEnded ? "bg-white/20" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"}`} />
                          <p className="text-white font-semibold text-xs truncate">{cardTitle}</p>
                        </div>
                        <p className="text-white/50 text-[10px] truncate mt-0.5">
                          With @{c.otherParticipant?.username || "Anonymous"}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!isEnded ? (
                          <button
                            onClick={() => router.push(`/chat/${c._id}`)}
                            className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg text-[10px] transition-all"
                          >
                            Chat
                          </button>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] text-white/30 font-medium">Closed</span>
                            {/* Only card owner can rate the listener */}
                            {c.listenCardId && !c.card?.rated && c.card?.status === "accepted" && (
                              <button
                                onClick={() => {
                                  setRatingCardId(c.listenCardId._id || c.listenCardId);
                                  setSelectedRating(5);
                                  setShowRatingModal(true);
                                }}
                                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold rounded-md text-[9px] border border-amber-500/30 hover:border-transparent transition-all"
                              >
                                Rate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Community Guidelines widget */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <h3 className="text-white/90 font-bold text-sm mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-pink-400" />
              <span>Community Guidelines</span>
            </h3>
            <ul className="text-white/50 text-xs space-y-2 list-disc list-inside leading-relaxed">
              <li>Be kind, patient, and respectful at all times.</li>
              <li>A report bans a misbehaving user for 24 hours immediately.</li>
              <li>Receiving 3 reports permanently blocks the Listen feature.</li>
              <li>Chats are completely private and expire after 5 hours.</li>
            </ul>
          </div>

        </div>

        {/* RIGHT COLUMN: Listener Board (Other cards) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-pink-500" />
              <span>Listener Board</span>
            </h2>

            {readyToListen && (
              <button
                onClick={loadOtherCards}
                className="text-pink-400 hover:text-pink-300 text-xs font-semibold"
                disabled={loadingCards}
              >
                {loadingCards ? "Refreshing..." : "🔄 Refresh"}
              </button>
            )}
          </div>

          {!readyToListen ? (
            // Disabled listen board
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-10 rounded-3xl text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-white/40">
                <Volume2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Turn on Listening Mode</h3>
              <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
                Toggle Listening Mode ON at the top right to view anonymous cards of people who need support.
              </p>
              <button
                onClick={handleToggleReadyToListen}
                disabled={togglingReady}
                className="px-6 py-2.5 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-sm transition-all"
              >
                Let me listen
              </button>
            </div>
          ) : loadingCards ? (
            // Loading Cards
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-white/40 text-sm">Searching for cards...</p>
            </div>
          ) : listenCards.length === 0 ? (
            // Empty Board
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-12 rounded-3xl text-center space-y-4">
              <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Board is all clear</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                No one is sharing anything heavy right now. Check back in a bit!
              </p>
            </div>
          ) : (
            // Render Cards Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listenCards.map((card) => {
                const style = getHeavinessStyle(card.heaviness);
                return (
                  <div
                    key={card._id}
                    className={`relative overflow-hidden bg-linear-to-b ${style.bg} border ${style.border} p-5 rounded-2xl flex flex-col justify-between h-[260px] transition-all hover:scale-[1.01] hover:shadow-xl ${style.glow}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-white/40 font-semibold tracking-wider block">ANONYMOUS VIBE</span>
                        <span className={style.badge}>
                          {style.emoji} {card.heaviness}
                        </span>
                      </div>

                      <h3 className="text-white font-extrabold text-lg line-clamp-1 mb-2">{card.topic}</h3>
                      <p className="text-white/70 text-sm line-clamp-4 leading-relaxed font-sans font-light italic">
                        "{card.reason}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-white/40">
                        {new Date(card.createdAt).toLocaleDateString()} at {new Date(card.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>

                      <button
                        onClick={() => handleAcceptCard(card._id, card.user?._id || card.user)}
                        disabled={acceptingCardId !== null}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white hover:text-pink-300 border border-white/15 hover:border-pink-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        {acceptingCardId === card._id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                        )}
                        <span>Listen & Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#120124] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Rate your Listener</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                How supportive was this active listener? Your rating will be stored on their profile to help others in the future.
              </p>
            </div>

            {/* Star Rating Selector */}
            <div className="flex justify-center items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="transition-transform active:scale-95 text-3xl focus:outline-none"
                >
                  {star <= selectedRating ? "⭐" : "☆"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRatingModal(false); setRatingCardId(null); }}
                disabled={submittingRating}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRateSubmit}
                disabled={submittingRating}
                className="flex-1 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
              >
                {submittingRating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
