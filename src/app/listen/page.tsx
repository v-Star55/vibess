"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/src/hooks/useSocket";
import { useUserStore } from "@/src/store/store";
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
  AlertTriangle,
  ArrowLeft,
  Flag,
  Ban
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
  getMyListenChats,
  getChat,
  sendMessage,
  endChatInChat,
  reportChat,
  blockUser
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

const moodColors: Record<string, { c: string; label: string }> = {
  chill: { c: "var(--chill)", label: "Chill" },
  fun: { c: "var(--fun)", label: "Fun" },
  over: { c: "var(--over)", label: "Overthinking" },
  chaos: { c: "var(--chaos)", label: "Chaos" },
  calm: { c: "var(--calm)", label: "Calm" },
};

const getCardMood = (card: any) => {
  const topicLower = (card.topic || "").toLowerCase();
  const reasonLower = (card.reason || "").toLowerCase();

  if (topicLower.includes("fun") || topicLower.includes("happy") || topicLower.includes("good")) {
    return "fun";
  }
  if (
    topicLower.includes("overthink") ||
    topicLower.includes("head") ||
    topicLower.includes("rehears") ||
    topicLower.includes("worry") ||
    topicLower.includes("anxiety") ||
    topicLower.includes("overwhelm") ||
    reasonLower.includes("overthink") ||
    reasonLower.includes("worry")
  ) {
    return "over";
  }
  if (topicLower.includes("chaos") || topicLower.includes("dread") || topicLower.includes("existential") || card.heaviness === "Heavy") {
    return "chaos";
  }
  if (topicLower.includes("calm") || topicLower.includes("quiet") || card.heaviness === "Light") {
    return "calm";
  }
  return "chill";
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function ListenPage() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { user } = useUserStore();

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
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [selectingListenerId, setSelectingListenerId] = useState<string | null>(null);

  // Overlay Active Chat States
  const [overlayChatId, setOverlayChatId] = useState<string | null>(null);
  const [overlayChat, setOverlayChat] = useState<any>(null);
  const [overlayMessages, setOverlayMessages] = useState<any[]>([]);
  const [overlayMessageText, setOverlayMessageText] = useState("");
  const [loadingOverlayChat, setLoadingOverlayChat] = useState(false);
  const [overlayTimeRemaining, setOverlayTimeRemaining] = useState<number | null>(null);
  const [showOverlayReportMenu, setShowOverlayReportMenu] = useState(false);
  const overlayMessagesEndRef = useRef<HTMLDivElement>(null);

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

  // Filter state for Listener Board
  const [boardFilter, setBoardFilter] = useState("all");

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
      console.log("Your listen offer was accepted, opening chat overlay:", data);
      toast.success("Your offer was accepted! Connection established.");
      setOverlayChatId(data.chatId);
    };

    const handleListenCardCreated = (data: any) => {
      console.log("Real-time: Listen card created", data.card);
      if (readyToListen && data.card?.user?._id !== user?.id && data.card?.user !== user?.id) {
        setListenCards((prev) => {
          if (prev.some((c) => c._id === data.card._id)) return prev;
          return [data.card, ...prev];
        });
      }
    };

    const handleListenCardCancelled = (data: any) => {
      console.log("Real-time: Listen card cancelled", data.cardId);
      setListenCards((prev) => prev.filter((c) => c._id !== data.cardId));
    };

    const handleListenCardRemoved = (data: any) => {
      console.log("Real-time: Listen card removed (accepted)", data.cardId);
      setListenCards((prev) => prev.filter((c) => c._id !== data.cardId));
    };

    const handleChatEnded = (data: any) => {
      console.log("Real-time: Listen session ended", data.chatId);
      toast("🚫 This listening session has been ended.", { icon: "🔒" });
      
      const matchingChat = myListenChats.find((c) => c._id === data.chatId);
      const listenCard = overlayChat?.listenCardId || matchingChat?.card || activeCard;
      const cardOwnerId = listenCard?.user?._id || listenCard?.user;
      const isSpeaker = cardOwnerId && user && cardOwnerId.toString() === user.id.toString();
      const cardId = listenCard?._id;

      setOverlayChatId(null);
      fetchListenData();

      if (isSpeaker && cardId) {
        setRatingCardId(cardId);
        setSelectedRating(Star => 5);
        setRatingComment("");
        setShowRatingModal(true);
      }
    };

    socket.on("listen-offer-received", handleOfferReceived);
    socket.on("listen-chat-started-notify", handleChatStarted);
    socket.on("listen-card-created", handleListenCardCreated);
    socket.on("listen-card-cancelled", handleListenCardCancelled);
    socket.on("listen-card-removed", handleListenCardRemoved);
    socket.on("listen-chat-ended-notify", handleChatEnded);

    return () => {
      socket.off("listen-offer-received", handleOfferReceived);
      socket.off("listen-chat-started-notify", handleChatStarted);
      socket.off("listen-card-created", handleListenCardCreated);
      socket.off("listen-card-cancelled", handleListenCardCancelled);
      socket.off("listen-card-removed", handleListenCardRemoved);
      socket.off("listen-chat-ended-notify", handleChatEnded);
    };
  }, [socket, connected, readyToListen, user, activeCard]);

  // Automatically open active (non-locked) chat on load / fetch
  useEffect(() => {
    const active = myListenChats.find((c) => !c.isLocked);
    if (active) {
      setOverlayChatId(active._id);
    }
  }, [myListenChats]);

  // Scroll to bottom of chat overlay
  useEffect(() => {
    overlayMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [overlayMessages]);

  // Timer countdown for overlay active chat
  useEffect(() => {
    if (!overlayChatId) return;
    const interval = setInterval(() => {
      setOverlayTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [overlayChatId]);

  // Manage overlay chat room messages and sockets
  useEffect(() => {
    if (!overlayChatId) {
      setOverlayChat(null);
      setOverlayMessages([]);
      setOverlayTimeRemaining(null);
      return;
    }

    let active = true;

    const fetchOverlayChat = async () => {
      try {
        setLoadingOverlayChat(true);
        const res = await getChat(overlayChatId);
        if (res.success && active) {
          setOverlayChat(res.chat);
          setOverlayMessages(res.chat.messages || []);
          setOverlayTimeRemaining(res.timeRemaining);
        }
      } catch (error) {
        console.error("Error loading overlay chat:", error);
        toast.error("Failed to load chat room");
      } finally {
        if (active) setLoadingOverlayChat(false);
      }
    };

    fetchOverlayChat();

    if (socket && connected) {
      socket.emit("join-room", overlayChatId);

      const handleConnect = () => {
        console.log("Overlay socket reconnected, re-joining room:", overlayChatId);
        socket.emit("join-room", overlayChatId);
      };

      const handleReceiveMsg = (data: any) => {
        if (data.chatId === overlayChatId) {
          setOverlayMessages((prev) => {
            const msgId = data.message?._id?.toString() ?? data.message?.toString();
            if (prev.some((m) => (m._id?.toString() ?? m.toString()) === msgId)) {
              return prev;
            }
            return [...prev, data.message];
          });
        }
      };

      socket.on("connect", handleConnect);
      socket.on("receive-message", handleReceiveMsg);

      return () => {
        active = false;
        socket.emit("leave-room", overlayChatId);
        socket.off("connect", handleConnect);
        socket.off("receive-message", handleReceiveMsg);
      };
    }
  }, [overlayChatId, socket, connected]);

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
          socket.emit("listen-card-accepted", { cardId });
        }

        setOverlayChatId(res.chatId);
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
      const res = await rateListener(ratingCardId, selectedRating, ratingComment.trim() || undefined);
      if (res.success) {
        toast.success("Thank you for your rating!");
        setShowRatingModal(false);
        setRatingCardId(null);
        setRatingComment("");
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

  const handleOpenCreateForm = () => {
    if (readyToListen) {
      toast.error("Please turn off Listening Mode to share what's on your mind.");
      return;
    }
    setShowCreateForm(true);
  };

  const handleSendOverlayMessage = async () => {
    if (!overlayChatId || !overlayMessageText.trim()) return;
    const text = overlayMessageText.trim();
    setOverlayMessageText("");
    try {
      const res = await sendMessage(overlayChatId, text);
      if (res.success) {
        const refresh = await getChat(overlayChatId);
        if (refresh.success) {
          setOverlayChat(refresh.chat);
          setOverlayMessages(refresh.chat.messages || []);

          const newMsg = refresh.chat.messages[refresh.chat.messages.length - 1];
          const other = refresh.chat.participants.find(
            (p: any) => (p?._id?.toString?.() ?? p?.toString?.()) !== user?.id
          );

          if (socket && connected) {
            socket.emit("send-message", {
              chatId: overlayChatId,
              message: newMsg,
              receiverId: other?._id?.toString?.() ?? other?.toString?.(),
            });
          }
        }
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleEndOverlayChat = async () => {
    if (!overlayChatId) return;
    if (!confirm("Are you sure you want to end this listening session? This chat will be permanently locked.")) return;

    try {
      const other = overlayChat?.participants?.find(
        (p: any) => (p?._id?.toString?.() ?? p?.toString?.()) !== user?.id
      );

      const matchingChat = myListenChats.find((c) => c._id === overlayChatId);
      const listenCard = overlayChat?.listenCardId || matchingChat?.card || activeCard;
      const cardOwnerId = listenCard?.user?._id || listenCard?.user;
      const isSpeaker = cardOwnerId && user && cardOwnerId.toString() === user.id.toString();
      const cardId = listenCard?._id;

      const res = await endChatInChat(overlayChatId);
      if (res.success) {
        toast.success("Session ended.");

        if (socket && connected) {
          socket.emit("listen-chat-ended", {
            chatId: overlayChatId,
            receiverId: other?._id?.toString?.() ?? other?.toString?.()
          });
        }

        setOverlayChatId(null);
        await fetchListenData();

        if (isSpeaker && cardId) {
          setRatingCardId(cardId);
          setSelectedRating(5);
          setRatingComment("");
          setShowRatingModal(true);
        }
      }
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const handleOverlayReport = async (reason: string) => {
    if (!overlayChatId) return;
    try {
      await reportChat(overlayChatId, reason);
      toast.success("Report submitted.");
      setShowOverlayReportMenu(false);
      setOverlayChatId(null);
      fetchListenData();
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const handleOverlayBlock = async () => {
    if (!overlayChatId) return;
    if (!confirm("Block this user? This will permanently restrict contact.")) return;
    try {
      await blockUser(overlayChatId);
      toast.success("User blocked.");
      setShowOverlayReportMenu(false);
      setOverlayChatId(null);
      fetchListenData();
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleCreateRequest = async () => {
    if (readyToListen) {
      toast.error("Please turn off Listening Mode to share what's on your mind.");
      return;
    }
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

        // Broadcast to other listeners
        if (socket && connected) {
          socket.emit("create-listen-card", { card: res.card });
        }
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

        // Broadcast cancellation to other listeners
        if (socket && connected) {
          socket.emit("cancel-listen-card", { cardId: activeCard._id });
        }

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
          emoji: "☁️",
          c: "var(--calm)"
        };
      case "Moderate":
        return {
          glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
          border: "border-purple-500/30 hover:border-purple-500/60",
          bg: "from-purple-500/10 to-pink-500/5",
          badge: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
          emoji: "⛰️",
          c: "var(--chill)"
        };
      case "Heavy":
        return {
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
          border: "border-red-500/30 hover:border-red-500/60",
          bg: "from-red-500/10 to-orange-500/5",
          badge: "bg-red-500/20 text-red-300 border border-red-500/30",
          emoji: "🌋",
          c: "var(--fun)"
        };
    }
  };

  // Filter listenCards list
  const filteredListenCards = listenCards.filter((card) => {
    if (boardFilter === "all") return true;
    return getCardMood(card) === boardFilter;
  });

  if (overlayChatId) {
    return (
      <div className="flex-1 relative flex flex-col h-full w-full overflow-hidden bg-[#0a0118]" style={{
        background: "radial-gradient(circle at 88% 0%, rgba(198,92,255,0.08), transparent 42%)"
      }}>
        {loadingOverlayChat ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
            <p className="text-white/40 text-xs font-semibold">Opening chat room...</p>
          </div>
        ) : (
          (() => {
            const otherUser = overlayChat?.participants?.find(
              (p: any) => (p?._id?.toString?.() ?? p?.toString?.()) !== user?.id
            );
            const matchingChat = myListenChats.find((c) => c._id === overlayChatId);
            const listenCard = typeof overlayChat?.listenCardId === 'object' ? overlayChat.listenCardId : (matchingChat?.card || activeCard);
            const hasRating = otherUser?.ratingCount > 0;
            
            const formatCountdown = (ms: number | null) => {
              if (ms === null || ms <= 0) return "00:00:00";
              const h = Math.floor(ms / (1000 * 60 * 60));
              const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((ms % (1000 * 60)) / 1000);
              return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            };

            return (
              <div className="flex-1 flex flex-col h-full bg-[#0a0118]/80 relative min-h-0">
                {/* --- CHAT HEADER --- */}
                <div className="px-6 py-4 border-b border-white/5 bg-[#120f26] flex flex-col gap-3 shrink-0 z-10 relative">
                  {/* First Row */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setOverlayChatId(null)}
                        className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
                        title="Return to Board"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      
                      {otherUser?.profileImage ? (
                        <img
                          src={otherUser.profileImage}
                          alt={otherUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-purple-500/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--fun)] to-[var(--chaos)] flex items-center justify-center text-sm font-black text-[#160E22] shadow-md shadow-purple-500/15">
                          {otherUser?.name?.[0]?.toUpperCase() || "A"}
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-white font-extrabold text-sm leading-none flex items-center gap-2">
                          <span>{otherUser?.name || "Anonymous User"}</span>
                          <span className="text-[10px] text-white/40 font-mono">@{otherUser?.username || "anonymous"}</span>
                        </h4>
                        <p className="text-[10px] text-amber-400 font-bold mt-1.5 leading-none">
                          {hasRating ? `⭐ ${otherUser.rating.toFixed(1)} (${otherUser.ratingCount} reviews)` : "⭐ New Listener"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-pink-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatCountdown(overlayTimeRemaining)}</span>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setShowOverlayReportMenu((v) => !v)}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-red-500/25 transition-all duration-200 group cursor-pointer"
                          title="Report / Block"
                        >
                          <Flag className="w-4 h-4 text-white/40 group-hover:text-[#FF5D73] transition-colors" />
                        </button>

                        {showOverlayReportMenu && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1235]/95 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-xl z-50 animate-fade-in">
                            {[
                              "Inappropriate content",
                              "Harassment",
                              "Spam",
                            ].map((reason) => (
                              <button
                                key={reason}
                                onClick={() => handleOverlayReport(reason)}
                                className="w-full text-left px-3.5 py-2 hover:bg-white/5 rounded-xl text-white/80 text-xs transition-colors cursor-pointer"
                              >
                                Report: {reason}
                              </button>
                            ))}
                            <div className="border-t border-white/5 mt-1 pt-1">
                              <button
                                onClick={handleOverlayBlock}
                                className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 rounded-xl text-[#FF5D73] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" /> Block User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleEndOverlayChat}
                        className="px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        End Session
                      </button>
                    </div>
                  </div>

                  {/* Second Row: Listen Card Context */}
                  {listenCard && (
                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">VIBE CARD TOPIC</span>
                        <div className="flex items-center gap-2 mt-1">
                          <h5 className="text-white font-extrabold text-xs truncate leading-none">{listenCard.topic}</h5>
                          <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full shrink-0">
                            {listenCard.heaviness}
                          </span>
                        </div>
                      </div>
                      <div className="md:max-w-2xl bg-black/10 px-3 py-1.5 rounded-xl border border-white/5 text-white/70 italic text-[11px] leading-relaxed line-clamp-1 flex-1">
                        "{listenCard.reason}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Message bubbles list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                  {overlayMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <HeartHandshake className="w-10 h-10 text-pink-400/50 animate-pulse" />
                      <p className="text-white/80 text-sm font-black">Connection Established</p>
                      <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                        Be kind and respectful. Take your time to express yourself.
                      </p>
                    </div>
                  ) : (
                    overlayMessages.map((msg: any, idx: number) => {
                      const isMe = msg.sender === user?.id || msg.sender?._id === user?.id || msg.sender === (user as any)?._id || msg.sender?._id === (user as any)?._id;
                      return (
                        <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isMe
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none shadow-md shadow-pink-500/10"
                              : "bg-white/5 border border-white/5 text-white/90 rounded-bl-none"
                            }`}>
                            <p>{msg.text}</p>
                            <span className="text-[8px] text-white/30 mt-1 block text-right font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={overlayMessagesEndRef} />
                </div>

                {/* Message input area */}
                <div className="p-4 md:p-6 bg-[#0a0118] border-t border-white/5 flex gap-3 shrink-0">
                  <input
                    type="text"
                    value={overlayMessageText}
                    onChange={(e) => setOverlayMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendOverlayMessage(); }}
                    placeholder="Type an anonymous support message..."
                    className="flex-1 bg-[var(--glass)] border border-[var(--glass-border)] focus:border-purple-500/50 focus:bg-[var(--glass-strong)] rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleSendOverlayMessage}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                  >
                    Send
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12 relative" style={{
      background: "radial-gradient(circle at 88% 0%, rgba(198,92,255,0.08), transparent 42%), radial-gradient(circle at 8% 50%, rgba(51,214,192,0.06), transparent 40%)"
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        h1, h2, h3, h4, h5, h6 {
          color: #ffffff !important;
        }
        .hero-banner {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-l);
          padding: 30px 32px;
          background: radial-gradient(circle at 12% 20%, rgba(255,93,115,0.18), transparent 55%), radial-gradient(circle at 90% 90%, rgba(198,92,255,0.14), transparent 55%), linear-gradient(165deg, var(--glass-strong), var(--glass));
          border: 1px solid var(--glass-border);
        }
        .hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .hero-ic {
          color: var(--fun);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hero-ic svg {
          width: 15px;
          height: 15px;
        }
        .listen-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 9px 9px 16px;
          border-radius: 100px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .listen-toggle .lbl {
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .listen-toggle.on .lbl {
          color: var(--calm);
        }
        .listen-toggle.off .lbl {
          color: var(--text-faint);
        }
        .switch {
          width: 42px;
          height: 24px;
          border-radius: 100px;
          background: var(--glass-strong);
          position: relative;
          border: 1px solid var(--glass-border);
          transition: background .25s ease;
          flex-shrink: 0;
        }
        .switch .knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--text-faint);
          transition: transform .25s cubic-bezier(.2,.8,.2,1), background .25s ease;
        }
        .switch.on {
          background: linear-gradient(120deg, var(--calm), var(--chaos));
        }
        .switch.on .knob {
          transform: translateX(18px);
          background: #fff;
        }
        .l-card {
          border-radius: var(--radius-l);
          padding: 20px;
          background: linear-gradient(165deg, var(--glass-strong), var(--glass));
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid var(--glass-border);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), var(--shadow-deep);
        }
        .l-card-head {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 14px;
        }
        .l-card-head svg {
          width: 17px;
          height: 17px;
          color: var(--chaos);
        }
        .l-card-head h3 {
          font-size: 15px;
          font-weight: 700;
        }
        .req-empty {
          text-align: center;
          padding: 20px 10px 6px;
        }
        .req-empty p {
          margin: 0 0 16px;
          font-size: 13.5px;
          color: var(--text-faint);
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 13.5px;
          color: #160E22;
          border: none;
          background: linear-gradient(120deg, var(--fun), var(--chaos));
          background-size: 200% 100%;
          box-shadow: 0 10px 26px -10px rgba(198,92,255,0.5);
          transition: transform .2s ease, box-shadow .2s ease, background-position .4s ease;
        }
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px -10px rgba(198,92,255,0.6);
          background-position: 100% 0;
        }
        .req-composer textarea {
          width: 100%;
          min-height: 95px;
          resize: vertical;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-s);
          padding: 12px 14px;
          color: var(--text);
          font-size: 13.5px;
          line-height: 1.5;
          outline: none;
          transition: border-color .25s ease, background .25s ease;
        }
        .req-composer textarea:focus {
          border-color: rgba(198,92,255,0.5);
          background: var(--glass-strong);
        }
        .mood-pick {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .mood-pick button {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 11px;
          border-radius: 100px;
          color: var(--text-dim);
          border: 1px solid var(--glass-border);
          background: var(--glass);
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all .2s ease;
        }
        .mood-pick button::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--c);
        }
        .mood-pick button.chill { --c: var(--chill); }
        .mood-pick button.fun { --c: var(--fun); }
        .mood-pick button.over { --c: var(--over); }
        .mood-pick button.chaos { --c: var(--chaos); }
        .mood-pick button.calm { --c: var(--calm); }
        .mood-pick button.active {
          color: var(--text);
          border-color: var(--c);
          background: color-mix(in srgb, var(--c) 18%, transparent);
        }
        .req-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .req-actions .primary {
          flex: 1;
          padding: 10px;
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 700;
          color: #160E22;
          border: none;
          background: linear-gradient(120deg, var(--fun), var(--chaos));
        }
        .req-actions .cancel {
          padding: 10px 16px;
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-faint);
          background: none;
          border: 1px solid var(--glass-border);
        }
        .req-pending {
          text-align: center;
          padding: 14px 6px 4px;
        }
        .pending-ring {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--glass-strong);
          position: relative;
        }
        .pending-ring .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--chill);
          box-shadow: 0 0 0 0 rgba(255,178,94,0.6);
          animation: pulse-ring 1.6s infinite;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,178,94,0.55); }
          70% { box-shadow: 0 0 0 10px rgba(255,178,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,178,94,0); }
        }
        .req-pending h4 {
          font-size: 13.5px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .req-pending p {
          margin: 0 0 14px;
          font-size: 12px;
          color: var(--text-faint);
        }
        .req-pending .cancel-req {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-faint);
          background: none;
          border: 1px solid var(--glass-border);
          padding: 8px 16px;
          border-radius: 100px;
        }
        .req-pending .cancel-req:hover {
          color: var(--fun);
          border-color: rgba(255,93,115,0.3);
        }
        .chat-hist-item {
          display: flex;
          gap: 11px;
          padding: 10px 4px;
          border-bottom: 1px solid var(--line);
        }
        .chat-hist-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .chat-hist-item:first-child {
          padding-top: 0;
        }
        .chat-hist-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(90deg, var(--surface), rgba(255,255,255,0.22), var(--surface));
        }
        .chat-hist-body {
          flex: 1;
          min-width: 0;
        }
        .chat-hist-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 2px;
        }
        .chat-hist-top span:first-child {
          font-size: 12.5px;
          font-weight: 600;
        }
        .chat-hist-time {
          font-family: var(--font-space-mono), monospace;
          font-size: 10px;
          color: var(--text-faint);
        }
        .chat-hist-stars {
          display: flex;
          gap: 1px;
        }
        .chat-hist-stars svg {
          width: 10px;
          height: 10px;
          color: var(--chill);
        }
        .guide-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .guide-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .guide-item .gi {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--glass-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .guide-item .gi svg {
          width: 12px;
          height: 12px;
          color: var(--calm);
        }
        .guide-item p {
          margin: 0;
          font-size: 12.5px;
          color: var(--text-dim);
          line-height: 1.5;
        }
        .board-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .board-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .board-title svg {
          width: 19px;
          height: 19px;
          color: var(--fun);
        }
        .board-title h2 {
          font-size: 19px;
          font-weight: 800;
        }
        .board-live {
          font-family: var(--font-space-mono), monospace;
          font-size: 11px;
          color: var(--text-faint);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .board-live .d {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--fun);
          box-shadow: 0 0 0 0 rgba(255,93,115,0.6);
          animation: pulse-ring-fun 1.8s infinite;
        }
        @keyframes pulse-ring-fun {
          0% { box-shadow: 0 0 0 0 rgba(255,93,115,0.55); }
          70% { box-shadow: 0 0 0 7px rgba(255,93,115,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,93,115,0); }
        }
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 100px;
          color: var(--text-dim);
          transition: all .2s ease;
        }
        .refresh-btn svg {
          width: 14px;
          height: 14px;
          transition: transform .5s ease;
        }
        .refresh-btn:hover {
          color: var(--text);
          background: var(--glass-strong);
        }
        .refresh-btn.spin svg {
          transform: rotate(360deg);
        }
        .board-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .board-filter {
          font-size: 12px;
          font-weight: 600;
          padding: 7px 13px;
          border-radius: 100px;
          color: var(--text-dim);
          border: 1px solid var(--glass-border);
          background: var(--glass);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all .2s ease;
          cursor: pointer;
        }
        .board-filter::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--c);
        }
        .board-filter[data-mood="all"]::before {
          display: none;
        }
        .board-filter.chill { --c: var(--chill); }
        .board-filter.fun { --c: var(--fun); }
        .board-filter.over { --c: var(--over); }
        .board-filter.chaos { --c: var(--chaos); }
        .board-filter.calm { --c: var(--calm); }
        .board-filter:hover {
          background: var(--glass-strong);
          color: var(--text);
        }
        .board-filter.active {
          background: linear-gradient(120deg, var(--fun), var(--chaos));
          color: #160E22;
          border-color: transparent;
        }
        .board-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .req-card {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 18px;
          border-radius: var(--radius-l);
          border-left: 3px solid var(--c);
          transition: transform .3s ease;
        }
        .req-card:hover {
          transform: translateY(-4px);
        }
        .req-card.chill { --c: var(--chill); }
        .req-card.fun { --c: var(--fun); }
        .req-card.over { --c: var(--over); }
        .req-card.chaos { --c: var(--chaos); }
        .req-card.calm { --c: var(--calm); }
        .req-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(90deg, var(--surface), rgba(255,255,255,0.24), var(--surface));
        }
        .req-body {
          flex: 1;
          min-width: 0;
        }
        .req-top {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .req-mood-tag {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 100px;
          color: var(--c);
          border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
          background: color-mix(in srgb, var(--c) 12%, transparent);
        }
        .req-meta {
          font-family: var(--font-space-mono), monospace;
          font-size: 10.5px;
          color: var(--text-faint);
        }
        .req-body p {
          margin: 0;
          font-size: 13.5px;
          color: var(--text-dim);
          line-height: 1.45;
        }
        .listen-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 700;
          padding: 10px 17px;
          border-radius: 100px;
          color: #160E22;
          border: none;
          background: linear-gradient(120deg, var(--fun), var(--chaos));
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .listen-btn svg {
          width: 14px;
          height: 14px;
        }
        .listen-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -10px rgba(198,92,255,0.5);
        }
        .board-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 70px 30px;
          border-radius: var(--radius-l);
          gap: 6px;
        }
        .board-empty-ic {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(51,214,192,0.1);
          border: 1px solid rgba(51,214,192,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }
        .board-empty-ic svg {
          width: 24px;
          height: 24px;
          color: var(--calm);
        }
        .board-empty h3 {
          font-size: 18px;
          font-weight: 700;
        }
        .board-empty p {
          margin: 0;
          color: var(--text-dim);
          font-size: 13.5px;
          max-width: 280px;
        }
        .star-picker button {
          background: none;
          border: none;
          padding: 2px;
        }
        .star-picker svg {
          width: 30px;
          height: 30px;
          color: var(--glass-border);
          transition: color .15s ease, transform .15s ease;
        }
        .star-picker button.filled svg {
          color: var(--chill);
        }
        .star-picker button:hover svg {
          transform: scale(1.15);
        }
        @media (max-width: 640px) {
          .req-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .listen-btn {
            width: 100%;
            justify-content: center;
          }
        }
      ` }} />

      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Banner */}
        <div className="hero-banner">
          <div className="hero-top">
            <div className="space-y-2">
              <div className="hero-ic">
                <HeartHandshake className="w-4 h-4" />
                <span className="eyebrow" style={{ color: "var(--fun)" }}>Support Space</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Need a Listening Ear?</h1>
              <p className="text-[var(--text-dim)] text-sm max-w-xl leading-relaxed">
                Share what's weighing heavy on your heart anonymously, or support someone else. All chats auto-expire in 5 hours for privacy.
              </p>
            </div>

            {/* Switch Action */}
            <div
              onClick={handleToggleReadyToListen}
              className={`listen-toggle glass transition-all ${readyToListen ? "on" : "off"}`}
            >
              <span className="lbl">
                {togglingReady ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--calm)]" />
                ) : (
                  <Volume2 className={`w-3.5 h-3.5 ${readyToListen ? "animate-pulse" : ""}`} />
                )}
                <span>{readyToListen ? "Listening Mode: ON" : "Listening Mode: OFF"}</span>
              </span>
              <div className={`switch ${readyToListen ? "on" : "off"}`}>
                <div className="knob" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT COLUMN: Requests, Chats and Guidelines */}
          <div className="lg:col-span-1 space-y-6">

            {/* Request Status Card */}
            <div className="l-card">
              <div className="l-card-head">
                <Sparkles className="w-4.5 h-4.5" />
                <h3>Your Request Status</h3>
              </div>

              {activeCard ? (
                // Active Card Display
                <div className="space-y-4">
                  <div className={`relative overflow-hidden bg-gradient-to-b ${getHeavinessStyle(activeCard.heaviness).bg} border ${getHeavinessStyle(activeCard.heaviness).border} p-5 rounded-2xl ${getHeavinessStyle(activeCard.heaviness).glow} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Active Request</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getHeavinessStyle(activeCard.heaviness).badge}`}>
                        {getHeavinessStyle(activeCard.heaviness).emoji} {activeCard.heaviness}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-white font-extrabold text-base truncate">{activeCard.topic}</h3>
                      <p className="text-white/80 text-xs mt-2 line-clamp-4 leading-relaxed italic">
                        "{activeCard.reason}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-white/40 pt-2 border-t border-white/5 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>Expires in: {new Date(activeCard.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    {/* Listener Offers inside Active Card */}
                    {activeCard.offers && activeCard.offers.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Interested Listeners ({activeCard.offers.length})</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {activeCard.offers.map((offer: any) => {
                            const l = offer.listener;
                            if (!l) return null;
                            const hasRating = l.ratingCount > 0;
                            return (
                              <div key={offer._id} className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-2 min-w-0">
                                  {l.profileImage ? (
                                    <img src={l.profileImage} alt={l.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-extrabold text-purple-300 border border-purple-500/30">
                                      {l.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-white text-xs font-bold truncate leading-none">{l.name}</p>
                                    <p className="text-white/40 text-[9px] truncate mt-0.5">@{l.username}</p>
                                    <p className="text-[9px] text-amber-400 mt-0.5 font-bold">
                                      {hasRating ? `⭐ ${l.rating.toFixed(1)} (${l.ratingCount})` : "⭐ New Listener"}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleSelectListener(activeCard._id, l._id)}
                                  disabled={selectingListenerId !== null}
                                  className="shrink-0 px-3 py-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-extrabold rounded-lg text-[10px] transition-all shadow-md active:scale-95"
                                >
                                  {selectingListenerId === l._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
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
                  </div>

                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {cancelling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Cancel Request</span>
                  </button>
                </div>
              ) : showCreateForm ? (
                // 3-Step Create Form
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-bold text-white/50">
                    <span>STEP {formStep} OF 3</span>
                    <button
                      onClick={() => { setShowCreateForm(false); setFormStep(1); }}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {formStep === 1 && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-white/80 block">What topic is on your mind?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TOPIC_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => { setTopic(preset.label); setFormStep(2); }}
                            className={`p-3 rounded-xl border text-left text-xs font-bold text-white/90 hover:bg-white/5 active:scale-[0.97] transition-all bg-gradient-to-br ${preset.color}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => { setTopic("custom"); setFormStep(2); }}
                        className="w-full py-2.5 bg-[var(--glass)] border border-[var(--glass-border)] hover:bg-[var(--glass-strong)] hover:border-purple-500/40 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                      >
                        ✍️ Custom Topic
                      </button>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="space-y-4">
                      {topic === "custom" ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/80 block">Topic Subject</label>
                          <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value.slice(0, 100))}
                            placeholder="e.g. Life changes, bad day"
                            className="w-full bg-[var(--glass)] border border-[var(--glass-border)] focus:border-purple-500/50 focus:bg-[var(--glass-strong)] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-all"
                          />
                        </div>
                      ) : (
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-xs text-white/60">
                          Selected Topic: <strong className="text-white font-bold">{topic}</strong>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-semibold text-white/80">Explain what feels heavy</label>
                          <span className="text-[10px] text-white/30">{reason.length}/1000</span>
                        </div>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                          placeholder="No names, no faces — write whatever is on your heart."
                          rows={4}
                          className="w-full bg-[var(--glass)] border border-[var(--glass-border)] focus:border-purple-500/50 focus:bg-[var(--glass-strong)] rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all leading-relaxed"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setFormStep(1)}
                          className="flex-1 py-2 bg-white/5 border border-white/5 text-white/70 text-xs font-bold rounded-xl active:scale-[0.98]"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setFormStep(3)}
                          disabled={topic === "custom" ? !customTopic.trim() || !reason.trim() : !reason.trim()}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-extrabold rounded-xl active:scale-[0.98]"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {formStep === 3 && (
                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-white/80 block">Choose Heaviness Level</label>
                      <div className="flex flex-col gap-2">
                        {(["Light", "Moderate", "Heavy"] as const).map((lvl) => {
                          const style = getHeavinessStyle(lvl);
                          return (
                            <button
                              key={lvl}
                              onClick={() => setHeaviness(lvl)}
                              className={`p-3 border rounded-xl text-left flex items-center justify-between transition-all active:scale-[0.99] ${heaviness === lvl
                                  ? `${style.border} bg-white/10`
                                  : "border-white/5 bg-transparent hover:bg-white/5"
                                }`}
                            >
                              <div>
                                <p className="text-white font-bold text-xs">{lvl}</p>
                                <p className="text-white/40 text-[9px] mt-0.5">
                                  {lvl === "Light" && "Just want to speak, low tension"}
                                  {lvl === "Moderate" && "Weighing on me, need support"}
                                  {lvl === "Heavy" && "Hurting inside, feeling overwhelmed"}
                                </p>
                              </div>
                              <span className="text-lg">{style.emoji}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setFormStep(2)}
                          className="flex-1 py-2 bg-white/5 border border-white/5 text-white/70 text-xs font-bold rounded-xl active:scale-[0.98]"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateRequest}
                          disabled={submitting}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Submit Card</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Empty Request state
                <div className="req-empty space-y-4">
                  <p>You don't have an active request right now.</p>
                  <button onClick={handleOpenCreateForm} className="share-btn cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    <span>Share What's Heavy</span>
                  </button>
                </div>
              )}
            </div>

            {/* Recent Listen Chats */}
            <div className="l-card space-y-4">
              <div className="l-card-head">
                <MessageSquare className="w-4.5 h-4.5" />
                <h3>Your Listen Chats</h3>
              </div>

              {loadingMyChats ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                </div>
              ) : myListenChats.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-6">No recent listen sessions.</p>
              ) : (
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {myListenChats.map((c) => {
                    const isEnded = c.isLocked;
                    const cardTitle = c.card?.topic || "Listen Session";
                    return (
                      <div key={c._id} className="bg-black/20 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isEnded ? "bg-white/20" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"}`} />
                            <p className="text-white font-bold text-xs truncate">{cardTitle}</p>
                          </div>
                          <p className="text-white/40 text-[9px] truncate mt-0.5">
                            With @{c.otherParticipant?.username || "Anonymous"}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {!isEnded ? (
                            <button
                              onClick={() => setOverlayChatId(c._id)}
                              className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-extrabold rounded-lg text-[9px] transition-all cursor-pointer shadow-md"
                            >
                              Chat
                            </button>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[9px] text-white/30 font-medium font-mono">Closed</span>
                              {c.listenCardId && !c.card?.rated && c.card?.status === "accepted" && (
                                <button
                                  onClick={() => {
                                    setRatingCardId(c.listenCardId._id || c.listenCardId);
                                    setSelectedRating(5);
                                    setShowRatingModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 hover:border-transparent rounded-md text-[9px] font-bold transition-all cursor-pointer"
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

            {/* Community Guidelines */}
            <div className="l-card space-y-4">
              <div className="l-card-head">
                <ShieldAlert className="w-4.5 h-4.5 text-pink-400" />
                <h3>Guidelines</h3>
              </div>

              <div className="guide-list">
                <div className="guide-item">
                  <div className="gi">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p>Just listen — you don't have to fix anything.</p>
                </div>
                <div className="guide-item">
                  <div className="gi">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p>Stay anonymous, stay kind — always.</p>
                </div>
                <div className="guide-item">
                  <div className="gi">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p>Report anything that feels off, no hesitation.</p>
                </div>
                <div className="guide-item">
                  <div className="gi">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p>All sessions auto-expire in 5 hours for privacy.</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Listener Board */}
          <div className="lg:col-span-2 space-y-6">

            <div className="board-head">
              <div className="board-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
                <h2>Listener Board</h2>
                {readyToListen && (
                  <span className="board-live font-mono">
                    <span className="d"></span>
                    <span>{listenCards.length} active cards</span>
                  </span>
                )}
              </div>

              {readyToListen && (
                <button
                  onClick={loadOtherCards}
                  disabled={loadingCards}
                  className={`refresh-btn glass cursor-pointer hover:scale-105 active:scale-95 ${loadingCards ? "spin" : ""}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-3-6.7" />
                    <path d="M21 4v6h-6" />
                  </svg>
                  <span>{loadingCards ? "Refreshing..." : "Refresh"}</span>
                </button>
              )}
            </div>

            {/* Filter controls */}
            {readyToListen && (
              <div className="board-filters">
                <button
                  onClick={() => setBoardFilter("all")}
                  className={`board-filter ${boardFilter === "all" ? "active" : ""}`}
                  data-mood="all"
                >
                  All
                </button>
                <button
                  onClick={() => setBoardFilter("chill")}
                  className={`board-filter chill ${boardFilter === "chill" ? "active" : ""}`}
                  data-mood="chill"
                >
                  Chill
                </button>
                <button
                  onClick={() => setBoardFilter("fun")}
                  className={`board-filter fun ${boardFilter === "fun" ? "active" : ""}`}
                  data-mood="fun"
                >
                  Fun
                </button>
                <button
                  onClick={() => setBoardFilter("over")}
                  className={`board-filter over ${boardFilter === "over" ? "active" : ""}`}
                  data-mood="over"
                >
                  Overthinking
                </button>
                <button
                  onClick={() => setBoardFilter("chaos")}
                  className={`board-filter chaos ${boardFilter === "chaos" ? "active" : ""}`}
                  data-mood="chaos"
                >
                  Chaos
                </button>
                <button
                  onClick={() => setBoardFilter("calm")}
                  className={`board-filter calm ${boardFilter === "calm" ? "active" : ""}`}
                  data-mood="calm"
                >
                  Calm
                </button>
              </div>
            )}

            {/* Cards List or Empty States */}
            {!readyToListen ? (
              // Empty state when listening mode is off
              <div className="bg-white/5 border border-white/10 backdrop-blur-md p-12 rounded-3xl text-center space-y-5 shadow-lg">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-white/40">
                  <Volume2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Turn on Listening Mode</h3>
                <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
                  Toggle Listening Mode ON at the top right to view anonymous cards of people who need support.
                </p>
                <button
                  onClick={handleToggleReadyToListen}
                  disabled={togglingReady}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Let me listen
                </button>
              </div>
            ) : loadingCards ? (
              // Spinner during search
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
                <p className="text-white/40 text-xs font-semibold">Searching cards...</p>
              </div>
            ) : filteredListenCards.length === 0 ? (
              // Empty Board View
              <div className="board-empty glass">
                <div className="board-empty-ic">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3>Board is all clear</h3>
                <p>No one is sharing anything heavy matching this filter right now. Check back soon!</p>
              </div>
            ) : (
              // Active board cards list
              <div className="board-list">
                {filteredListenCards.map((card) => {
                  const mood = getCardMood(card);
                  const colorInfo = moodColors[mood] || moodColors.chill;
                  const timeLabel = formatTimeAgo(card.createdAt);

                  return (
                    <div
                      key={card._id}
                      style={{ "--c": colorInfo.c } as React.CSSProperties}
                      className="req-card glass hover:shadow-xl active:scale-[0.99]"
                    >
                      <div className="req-avatar" />
                      <div className="req-body">
                        <div className="req-top">
                          <span className="req-mood-tag">{colorInfo.label}</span>
                          <span className="req-meta font-mono">{timeLabel}</span>
                        </div>
                        <h4 className="text-white font-extrabold text-sm mb-1 leading-snug truncate">{card.topic}</h4>
                        <p className="line-clamp-2">"{card.reason}"</p>
                      </div>

                      <button
                        onClick={() => handleAcceptCard(card._id, card.user?._id || card.user)}
                        disabled={acceptingCardId !== null}
                        className="listen-btn cursor-pointer active:scale-95"
                      >
                        {acceptingCardId === card._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#160E22]" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                          </svg>
                        )}
                        <span>I'll listen</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#120124] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Rate your Listener</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                How supportive was this active listener? Your rating will be stored on their profile to help others in the future.
              </p>
            </div>

            {/* Stars selection panel */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="transition-all hover:scale-115 active:scale-95 focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 transition-colors duration-150 ${star <= selectedRating ? "text-[var(--chill)] fill-current" : "text-white/20"
                      }`}
                    viewBox="0 0 24 24"
                    fill={star <= selectedRating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Comment Text Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">Feedback Comment (Optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Write a message of gratitude or support feedback..."
                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowRatingModal(false); setRatingCardId(null); setRatingComment(""); }}
                disabled={submittingRating}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRateSubmit}
                disabled={submittingRating}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-black text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
              >
                {submittingRating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Overlay */}

    </div>
  );
}
