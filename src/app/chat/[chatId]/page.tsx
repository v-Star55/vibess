"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useUserStore } from "@/src/store/store";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { useSocket } from "@/src/hooks/useSocket";
import {
  getChat,
  sendMessage,
  reportChat,
  blockUser,
  getUnreadChatCount,
  generateAIIcebreakers,
  followUserInChat,
  endChatInChat,
  deleteChat,
} from "../../lib/vibeApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Send,
  Flag,
  Ban,
  Clock,
  Lock,
  Sparkles,
  UserPlus,
  UserCheck,
  Gamepad2,
  HeartHandshake,
  Trash2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import SparksPanel from "../../components/SparksPanel";
import ConvoStarterCardDropdown from "../../components/chat/ConvoStarterCardDropdown";

const ICEBREAKER_PROMPTS = [
  "What made you choose that song?",
  "Your vibe feels relatable :) What's up?",
  "Love your energy! How's your day?",
  "That song is a mood! What's the story?",
  "Feeling the same way! Want to chat?",
];

function formatCountdown(ms: number) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Deterministic gradient per name
const GRADIENTS = [
  ["#FF5D73", "#C65CFF"],
  ["#C65CFF", "#33D6C0"],
  ["#33D6C0", "#FFB25E"],
  ["#FFB25E", "#FF5D73"],
];
function getGradient(name: string) {
  const idx = (name?.charCodeAt(0) || 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUserStore();
  const { setUnreadCount } = useChatNotificationStore();
  const { socket, connected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [showSparks, setShowSparks] = useState(false);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [canShowFollowButton, setCanShowFollowButton] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingUser, setFollowingUser] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [icebreakerVisible, setIcebreakerVisible] = useState(true);
  const [activeIcebreaker, setActiveIcebreaker] = useState<string>("");
  const [showStarterCard, setShowStarterCard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const icebreakersLoadedRef = useRef<boolean>(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const flagButtonRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Report menu positioning
  useEffect(() => {
    if (showReportMenu && flagButtonRef.current) {
      const update = () => {
        if (flagButtonRef.current) {
          const rect = flagButtonRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };
      update();
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    }
  }, [showReportMenu]);

  useEffect(() => {
    if (!showReportMenu) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        reportMenuRef.current &&
        !reportMenuRef.current.contains(target) &&
        menuPortalRef.current &&
        !menuPortalRef.current.contains(target)
      ) {
        setShowReportMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showReportMenu]);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getUnreadChatCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch {}
  }, [setUnreadCount]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const fetchChat = async () => {
      try {
        const res = await getChat(chatId);
        if (res.success) {
          setChat(res.chat);
          setTimeRemaining(res.timeRemaining);
          setCanShowFollowButton(res.canShowFollowButton || false);
          setIsFollowing(res.isFollowing || false);
          refreshUnread();
        }
      } catch {
        toast.error("Failed to load chat");
        router.push("/vibe/discover");
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
    refreshUnread();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) =>
        prev !== null ? Math.max(0, prev - 1000) : null
      );
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatId, user, router, refreshUnread]);

  // Socket
  useEffect(() => {
    if (!socket || !connected || !chatId) return;

    // Join room initially
    socket.emit("join-room", chatId);

    // Re-join room on reconnect
    const handleConnect = () => {
      console.log("Socket reconnected, re-joining chat room:", chatId);
      socket.emit("join-room", chatId);
    };

    const handleMsg = (data: any) => {
      if (data.chatId === chatId) {
        setChat((prev: any) => {
          if (!prev) return prev;
          const msgId =
            data.message?._id?.toString() ?? data.message?.toString();
          if (
            prev.messages.some(
              (m: any) =>
                (m._id?.toString() ?? m.toString()) === msgId
            )
          )
            return prev;
          return { ...prev, messages: [...prev.messages, data.message] };
        });
        refreshUnread();
      }
    };
    const handleSparksNotify = (data: any) => {
      if (data.senderId === user?.id || data.senderId === (user as any)?._id)
        return;
      if (data.action === "START") {
        setShowSparks(true);
        setChat((prev: any) => {
          const name = prev?.participants?.find(
            (p: any) => p?._id?.toString() !== user?.id
          )?.name || "Friend";
          toast(`🎮 ${name} started ${data.gameType}!`);
          return prev;
        });
      }
    };

    const handleChatEnded = (data: any) => {
      if (data.chatId === chatId) {
        toast("🚫 This listening session has been ended.", { icon: "🔒" });
        getChat(chatId).then((r) => {
          if (r.success) {
            setChat(r.chat);
            setTimeRemaining(r.timeRemaining);
          }
        });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("receive-message", handleMsg);
    socket.on("sparksStateUpdate", handleSparksNotify);
    socket.on("listen-chat-ended-notify", handleChatEnded);

    return () => {
      socket.emit("leave-room", chatId);
      socket.off("connect", handleConnect);
      socket.off("receive-message", handleMsg);
      socket.off("sparksStateUpdate", handleSparksNotify);
      socket.off("listen-chat-ended-notify", handleChatEnded);
    };
  }, [socket, connected, chatId, refreshUnread, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // AI Icebreakers
  useEffect(() => {
    if (chatId) {
      icebreakersLoadedRef.current = false;
      setAiIcebreakers([]);
    }
  }, [chatId]);

  useEffect(() => {
    const load = async () => {
      if (
        icebreakersLoadedRef.current ||
        !chat?.participants ||
        chat.messages.length > 0
      )
        return;
      const other = chat.participants.find(
        (p: any) => p?._id?.toString() !== user?.id
      );
      if (other?._id) {
        icebreakersLoadedRef.current = true;
        setLoadingAI(true);
        try {
          const res = await generateAIIcebreakers(other._id);
          if (res.success && res.icebreakers?.length > 0) {
            setAiIcebreakers(res.icebreakers);
            setActiveIcebreaker(res.icebreakers[0]);
          }
        } catch {
          icebreakersLoadedRef.current = false;
        } finally {
          setLoadingAI(false);
        }
      }
    };
    if (chat && user && !icebreakersLoadedRef.current) load();
  }, [chat, user]);

  const handleSendMessage = async (text?: string) => {
    const msg = text || messageText.trim();
    if (!msg) return;
    setSending(true);
    try {
      const res = await sendMessage(chatId, msg);
      if (res.success) {
        setMessageText("");
        const refresh = await getChat(chatId);
        if (refresh.success) {
          setChat(refresh.chat);
          setTimeRemaining(refresh.timeRemaining);
          refreshUnread();
          const newMsg =
            refresh.chat.messages[refresh.chat.messages.length - 1];
          const other = refresh.chat.participants.find(
            (p: any) =>
              (p?._id?.toString?.() ?? p?.toString?.()) !== user?.id
          );
          if (socket && connected) {
            socket.emit("send-message", {
              chatId,
              message: newMsg,
              receiverId: other?._id?.toString?.() ?? other?.toString?.(),
            });
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      await reportChat(chatId, reason);
      toast.success("Report submitted.");
      setShowReportMenu(false);
      if (chat?.isListenChat) router.push("/listen");
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const handleEndChat = async () => {
    if (!confirm("End this session? This cannot be undone.")) return;
    try {
      const other = chat?.participants?.find(
        (p: any) => (p?._id?.toString?.() ?? p?.toString?.()) !== user?.id
      );

      await endChatInChat(chatId);
      toast.success("Session ended.");

      if (socket && connected) {
        socket.emit("listen-chat-ended", {
          chatId,
          receiverId: other?._id?.toString?.() ?? other?.toString?.()
        });
      }

      if (confirm("Would you like to delete this chat history from your inbox?")) {
        await deleteChat(chatId);
        toast.success("Chat removed from your inbox");
        router.push("/chat");
      } else {
        if (chat?.isListenChat) {
          router.push("/listen");
        } else {
          const r = await getChat(chatId);
          if (r.success) {
            setChat(r.chat);
            setTimeRemaining(r.timeRemaining);
          }
        }
      }
    } catch {
      toast.error("Failed to end session");
    }
  };

  const handleBlock = async () => {
    if (!confirm("Block this user?")) return;
    try {
      await blockUser(chatId);
      toast.success("User blocked");
      router.push(chat?.isListenChat ? "/listen" : "/vibe/discover");
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleFollow = async () => {
    if (followingUser) return;
    setFollowingUser(true);
    try {
      const res = await followUserInChat(chatId);
      if (res.success) {
        setIsFollowing(true);
        toast.success("Following!");
        const r = await getChat(chatId);
        if (r.success) {
          setChat(r.chat);
          setTimeRemaining(r.timeRemaining);
          if (r.chat.isPermanentlyUnlocked)
            toast.success("Chat unlocked permanently!");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to follow");
    } finally {
      setFollowingUser(false);
    }
  };

  const handleDeleteChat = async () => {
    setDeletingChat(true);
    try {
      await deleteChat(chatId);
      toast.success("Chat removed from your inbox");
      router.push("/chat");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete chat");
    } finally {
      setDeletingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-white/40 text-sm">Chat not found</p>
      </div>
    );
  }

  const otherUser = chat.participants.find(
    (p: any) => p?._id?.toString && p._id.toString() !== user?.id
  );
  const isLocked =
    (chat.isLocked || (timeRemaining !== null && timeRemaining <= 0)) &&
    !chat.isPermanentlyUnlocked;
  const canSend = !isLocked && !sending;
  const isUrgent =
    timeRemaining !== null &&
    timeRemaining > 0 &&
    timeRemaining < 3600 * 1000;
  const [g1, g2] = getGradient(otherUser?.name || "U");

  const icebreakersToShow =
    aiIcebreakers.length > 0 ? aiIcebreakers : ICEBREAKER_PROMPTS;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      <style>{`
        @media (min-width: 640px) {
          .chat-with-sparks { margin-right: 420px !important; }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .msg-anim { animation: bubbleIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ib-anim { animation: slideDown 0.3s ease forwards; }
      `}</style>

      {/* ── CONVERSATION HEADER ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.07] bg-[#100c1c]/80 backdrop-blur-xl relative z-50">
        {/* Left: back button + avatar + name */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={() => router.push("/chat")}
            className="md:hidden p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 active:scale-95 transition-all shrink-0"
            title="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => setShowStarterCard(true)}
            className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-all duration-200"
            title="View conversation starters"
          >
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-full overflow-hidden border border-white/10 flex items-center justify-center text-sm font-extrabold"
                style={{
                  background: `linear-gradient(135deg, ${g1}, ${g2})`,
                  color: "#160E22",
                }}
              >
                {otherUser?.profileImage ? (
                  <Image
                    src={otherUser.profileImage}
                    alt={otherUser.name}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{otherUser?.name?.[0] || "U"}</span>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#100c1c] ${
                  connected
                    ? "bg-[#33D6C0] shadow-[0_0_6px_rgba(51,214,192,0.8)]"
                    : "bg-white/20"
                }`}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm leading-tight truncate">
                {otherUser?.name}
              </h2>
              <div className="flex items-center gap-1.5 text-white/35 text-[11px] font-mono mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">@{otherUser?.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: pills + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Session badge */}
          {chat.isListenChat && (
            <div className="hidden sm:flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full">
              <HeartHandshake className="w-3.5 h-3.5 text-[#FF5D73]" />
              <span className="text-[#FF5D73] text-[10px] font-extrabold uppercase tracking-wider">
                Listen
              </span>
            </div>
          )}

          {/* Countdown */}
          {!chat.isPermanentlyUnlocked && timeRemaining !== null && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs font-medium transition-all duration-500 ${
                timeRemaining <= 0
                  ? "bg-red-500/10 border-red-500/25 text-[#FF5D73]"
                  : isUrgent
                  ? "bg-red-500/10 border-red-500/25 text-[#FF5D73] animate-pulse"
                  : "bg-amber-500/10 border-amber-500/20 text-[#FFB25E]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {timeRemaining <= 0
                ? "Expired"
                : formatCountdown(timeRemaining)}
            </div>
          )}

          {/* Permanent badge */}
          {chat.isPermanentlyUnlocked && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#33D6C0] animate-pulse" />
              <span className="text-[#33D6C0] text-[10px] font-bold uppercase tracking-wider font-mono">
                Forever
              </span>
            </div>
          )}

          {/* Locked */}
          {isLocked && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-[#FF5D73]" />
              <span className="text-[#FF5D73] text-[10px] font-bold uppercase tracking-wider">
                Locked
              </span>
            </div>
          )}

          {/* Follow */}
          {canShowFollowButton && !chat.isPermanentlyUnlocked && !isLocked && (
            <button
              onClick={handleFollow}
              disabled={isFollowing || followingUser}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isFollowing
                  ? "bg-emerald-500/10 text-[#33D6C0] border border-[#33D6C0]/25 cursor-default"
                  : "bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white hover:shadow-[0_0_14px_rgba(255,93,115,0.4)] active:scale-95"
              }`}
            >
              {followingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowing ? (
                <UserCheck className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isFollowing ? "Following" : "Follow"}
              </span>
            </button>
          )}

          {/* Sparks */}
          {!isLocked && (
            <button
              onClick={() => setShowSparks(true)}
              className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 transition-all duration-200 hover:scale-[1.04]"
              title="Play a game"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
          )}

          {/* Report menu */}
          <div ref={reportMenuRef} className="relative">
            <button
              ref={flagButtonRef}
              onClick={() => setShowReportMenu((v) => !v)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-red-500/25 transition-all duration-200 group"
              title="Report / Block"
            >
              <Flag className="w-4 h-4 text-white/40 group-hover:text-[#FF5D73] transition-colors" />
            </button>

            {showReportMenu &&
              typeof window !== "undefined" &&
              menuPosition &&
              createPortal(
                <div
                  ref={menuPortalRef}
                  className="fixed bg-[#120d24]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] p-1.5 min-w-[200px] z-[9999] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    "Inappropriate content",
                    "Harassment",
                    "Spam",
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        handleReport(reason);
                        setShowReportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/[0.06] rounded-xl text-white/70 text-sm transition-colors"
                    >
                      Report: {reason}
                    </button>
                  ))}
                  <div className="border-t border-white/5 mt-1 pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        handleBlock();
                        setShowReportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 rounded-xl text-[#FF5D73] text-sm flex items-center gap-2 transition-colors"
                    >
                      <Ban className="w-4 h-4" /> Block User
                    </button>
                    {chat?.isListenChat && !isLocked && (
                      <button
                        onClick={() => {
                          handleEndChat();
                          setShowReportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-orange-500/10 rounded-xl text-[#FFB25E] text-sm flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> End Session
                      </button>
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* ── CONVO STARTER CARD DROPDOWN ── */}
        <ConvoStarterCardDropdown
          isOpen={showStarterCard}
          onClose={() => setShowStarterCard(false)}
          userId={otherUser?._id?.toString() || ""}
        />
      </div>

      {/* ── ICEBREAKER BANNER ── */}
      {!isLocked &&
        chat.messages.length === 0 &&
        icebreakerVisible &&
        !loadingAI && (
          <div className="shrink-0 mx-4 mt-3 ib-anim">
            <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-[#33D6C0] shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <p className="flex-1 text-xs text-white/60 leading-relaxed min-w-0 truncate">
                <span className="text-white/80 font-semibold">Icebreaker:</span>{" "}
                {activeIcebreaker || icebreakersToShow[0]}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    handleSendMessage(activeIcebreaker || icebreakersToShow[0])
                  }
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-white hover:shadow-[0_0_12px_rgba(198,92,255,0.4)] transition-all duration-200"
                >
                  Use it
                </button>
                <button
                  onClick={() => setIcebreakerVisible(false)}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ── MESSAGES ── */}
      <div
        className={`flex-1 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent transition-all duration-300 ${
          showSparks ? "chat-with-sparks" : ""
        }`}
      >
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <p className="text-white/70 font-bold text-base">
              Begin Your Connection
            </p>
            <p className="text-white/30 text-sm max-w-xs leading-relaxed">
              Break the ice! Choose a prompt below or write your own.
            </p>

            {!isLocked && (
              <div className="max-w-sm w-full mt-2">
                {loadingAI ? (
                  <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    Generating icebreakers...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {icebreakersToShow.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(prompt)}
                          className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-purple-500/30 rounded-full text-white/70 hover:text-white text-xs transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                    {aiIcebreakers.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-white/25">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          AI Icebreakers
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Listen card context */}
            {chat.isListenChat && chat.listenCardId && (
              <div className="bg-gradient-to-r from-purple-950/20 via-[#120126]/40 to-black/20 border border-purple-500/15 p-4 rounded-2xl mb-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C65CFF] to-[#FF5D73] rounded-full" />
                <div className="flex items-center justify-between gap-3 mb-1.5 pl-3">
                  <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest font-mono">
                    Session Topic
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                      chat.listenCardId.heaviness === "Light"
                        ? "bg-cyan-500/10 border-cyan-500/20 text-[#33D6C0]"
                        : chat.listenCardId.heaviness === "Moderate"
                        ? "bg-purple-500/10 border-purple-500/20 text-[#C65CFF]"
                        : "bg-red-500/10 border-red-500/20 text-[#FF5D73]"
                    }`}
                  >
                    {chat.listenCardId.heaviness}
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm pl-3 mb-1">
                  {chat.listenCardId.topic}
                </h3>
                <p className="text-white/50 text-xs italic pl-3">
                  &ldquo;{chat.listenCardId.reason}&rdquo;
                </p>
              </div>
            )}

            {/* Day separator */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[10px] font-mono text-white/25 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                Today
              </span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {chat.messages.map((msg: any, idx: number) => {
              const senderId =
                typeof msg.sender === "string"
                  ? msg.sender
                  : msg.sender?._id?.toString() ?? msg.sender?.toString();
              const isOwn = senderId === user?.id;
              const sender = msg.sender;

              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 msg-anim mb-2 ${
                    isOwn ? "flex-row-reverse" : ""
                  }`}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 flex items-center justify-center text-xs font-bold self-end mb-1"
                      style={{
                        background: `linear-gradient(135deg, ${g1}, ${g2})`,
                        color: "#160E22",
                      }}
                    >
                      {sender?.profileImage ? (
                        <Image
                          src={sender.profileImage}
                          alt={sender?.name || "U"}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        sender?.name?.[0] || "U"
                      )}
                    </div>
                  )}

                  <div className={`max-w-[68%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isOwn
                          ? "bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white rounded-tr-md"
                          : "bg-white/[0.06] border border-white/[0.05] text-white rounded-tl-md"
                      }`}
                    >
                      <p className="select-text">{msg.text}</p>
                      {msg.isIcebreaker && (
                        <span className="text-xs opacity-60 ml-1.5" title="Icebreaker">
                          💬
                        </span>
                      )}
                    </div>
                    <span className="text-white/25 text-[9px] font-mono mt-1 px-1 block">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      <div
        className={`shrink-0 border-t border-white/[0.07] px-4 py-3 transition-all duration-300 ${
          showSparks ? "chat-with-sparks" : ""
        }`}
      >
        {isLocked ? (
          <div className="space-y-2">
            {/* Expired / ended banner */}
            <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 rounded-2xl px-4 py-3">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#FF5D73]" />
              </div>
              <p className="flex-1 text-[#FF5D73] text-sm font-semibold leading-snug">
                {chat?.isListenChat
                  ? "This listen session has ended."
                  : chat?.isPermanentlyUnlocked
                  ? "Chat unlocked forever."
                  : "Chat window closed. Follow each other to unlock permanently!"}
              </p>
            </div>

            {/* Action row — only for expired non-permanent chats */}
            {!chat?.isPermanentlyUnlocked && (
              <div className="flex items-center gap-2">
                {/* Follow to unlock CTA */}
                {canShowFollowButton && !isFollowing && (
                  <button
                    onClick={handleFollow}
                    disabled={followingUser}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white text-sm font-semibold hover:shadow-[0_0_18px_rgba(198,92,255,0.4)] active:scale-95 transition-all duration-200 disabled:opacity-50"
                  >
                    {followingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Follow to unlock forever
                  </button>
                )}

                {/* Delete chat button */}
                <button
                  onClick={handleDeleteChat}
                  disabled={deletingChat}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/25 text-white/50 hover:text-[#FF5D73] text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50"
                  title="Remove this chat from your inbox"
                >
                  {deletingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Delete chat</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] focus-within:border-[#C65CFF]/40 focus-within:bg-white/[0.06] rounded-2xl px-4 py-2.5 transition-all duration-200 focus-within:shadow-[0_0_0_2px_rgba(198,92,255,0.08)]">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Send a message..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/25"
                disabled={!canSend}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!canSend || !messageText.trim()}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] flex items-center justify-center text-white shadow-[0_8px_24px_-8px_rgba(198,92,255,0.6)] hover:shadow-[0_12px_30px_-8px_rgba(198,92,255,0.7)] hover:scale-[1.05] active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none"
            >
              {sending ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── SPARKS PANEL ── */}
      {showSparks && (
        <div
          className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] flex flex-col"
          style={{ animation: "sparksSlideIn 260ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          <style>{`
            @keyframes sparksSlideIn {
              from { opacity: 0; transform: translateX(420px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          <SparksPanel
            chatId={chatId}
            currentUser={user}
            otherUser={otherUser}
            onClose={() => setShowSparks(false)}
          />
        </div>
      )}

    </div>
  );
}
