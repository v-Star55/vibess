"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useUserStore } from "@/src/store/store";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { getChat, sendMessage, reportChat, blockUser, getUnreadChatCount, generateAIIcebreakers, followUserInChat } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { Loader2, Send, Flag, Ban, Clock, Lock, Sparkles, UserPlus, UserCheck } from "lucide-react";
import Image from "next/image";

const ICEBREAKER_PROMPTS = [
  "What made you choose that song?",
  "Your vibe feels relatable :) What's up?",
  "Love your energy! How's your day?",
  "That song is a mood! What's the story?",
  "Feeling the same way! Want to chat?",
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUserStore();
  const { setUnreadCount } = useChatNotificationStore();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [canShowFollowButton, setCanShowFollowButton] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingUser, setFollowingUser] = useState(false);
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const icebreakersLoadedRef = useRef<boolean>(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const flagButtonRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  // Update menu position
  useEffect(() => {
    if (showReportMenu && flagButtonRef.current) {
      const updatePosition = () => {
        if (flagButtonRef.current) {
          const rect = flagButtonRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showReportMenu]);

  // Handle click outside to close menu
  useEffect(() => {
    if (!showReportMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both the button container and the portal menu
      if (
        reportMenuRef.current &&
        !reportMenuRef.current.contains(target) &&
        menuPortalRef.current &&
        !menuPortalRef.current.contains(target)
      ) {
        setShowReportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showReportMenu]);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getUnreadChatCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to refresh unread chats", error);
    }
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
      } catch (error: any) {
        toast.error("Failed to load chat");
        router.push("/vibe/discover");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    refreshUnread();

    // Poll for updates every 5 seconds
    const pollInterval = setInterval(() => {
      fetchChat();
    }, 5000);

    // Update countdown every second
    intervalRef.current = setInterval(() => {
      if (timeRemaining !== null && timeRemaining > 0) {
        setTimeRemaining((prev) => (prev !== null ? Math.max(0, prev - 1000) : null));
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatId, user, router, refreshUnread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Load AI icebreakers when chat loads (only once per chat)
  useEffect(() => {
    // Reset icebreakers when chatId changes
    if (chatId) {
      icebreakersLoadedRef.current = false;
      setAiIcebreakers([]);
    }
  }, [chatId]);

  useEffect(() => {
    const loadAIIcebreakers = async () => {
      // Skip if already loaded, if chat has messages, or if participants don't exist
      if (icebreakersLoadedRef.current || !chat?.participants || chat.messages.length > 0) {
        return;
      }
      
      const otherUser = chat.participants.find(
        (p: any) => p?._id?.toString() !== user?.id
      );
      
      if (otherUser?._id) {
        icebreakersLoadedRef.current = true; // Mark as loading to prevent duplicates
        setLoadingAI(true);
        try {
          const res = await generateAIIcebreakers(otherUser._id);
          if (res.success && res.icebreakers && res.icebreakers.length > 0) {
            setAiIcebreakers(res.icebreakers);
          }
        } catch (error) {
          // Silently fail - will use default icebreakers
          console.error("AI icebreakers failed, using defaults");
          icebreakersLoadedRef.current = false; // Reset on error so it can retry later
        } finally {
          setLoadingAI(false);
        }
      }
    };

    if (chat && user && !icebreakersLoadedRef.current) {
      loadAIIcebreakers();
    }
  }, [chat, user]);

  const handleSendMessage = async (text?: string) => {
    const message = text || messageText.trim();
    if (!message) return;

    setSending(true);
    try {
      const res = await sendMessage(chatId, message);
      if (res.success) {
        setChat(res.chat);
        setMessageText("");
        // Refresh chat to get updated data
        const refreshRes = await getChat(chatId);
        if (refreshRes.success) {
          setChat(refreshRes.chat);
          setTimeRemaining(refreshRes.timeRemaining);
          refreshUnread();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      await reportChat(chatId, reason);
      toast.success("Report submitted. Thank you for keeping our community safe.");
      setShowReportMenu(false);
    } catch (error: any) {
      toast.error("Failed to submit report");
    }
  };

  const handleBlock = async () => {
    if (!confirm("Are you sure you want to block this user?")) return;

    try {
      await blockUser(chatId);
      toast.success("User blocked successfully");
      router.push("/vibe/discover");
    } catch (error: any) {
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
        toast.success("User followed successfully!");
        // Refresh chat to check if permanent unlock happened
        const refreshRes = await getChat(chatId);
        if (refreshRes.success) {
          setChat(refreshRes.chat);
          setTimeRemaining(refreshRes.timeRemaining);
          if (refreshRes.chat.isPermanentlyUnlocked) {
            toast.success("Chat unlocked permanently! You both follow each other.");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to follow user");
    } finally {
      setFollowingUser(false);
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-white/60">Chat not found</p>
        </div>
      </div>
    );
  }

  const otherUser = chat.participants.find(
    (p: any) => p?._id?.toString && p._id.toString() !== user?.id
  );
  const isLocked = chat.isLocked && !chat.isPermanentlyUnlocked;
  const canSend = !isLocked && !sending;

  return (
    <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex flex-col">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-6 min-h-0">
        {/* Chat Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-4 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-4">
            {otherUser?.profileImage ? (
              <Image
                src={otherUser.profileImage}
                alt={otherUser.name}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {otherUser?.name?.[0] || "U"}
              </div>
            )}
            <div>
              <h2 className="text-white font-bold">{otherUser?.name}</h2>
              <p className="text-white/60 text-sm">@{otherUser?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            {!chat.isPermanentlyUnlocked && timeRemaining !== null && (
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-white/60" />
                <span className="text-white text-sm font-mono">
                  {timeRemaining > 0 ? formatTime(timeRemaining) : "Expired"}
                </span>
              </div>
            )}

            {chat.isPermanentlyUnlocked && (
              <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
                <span className="text-green-400 text-sm font-medium">Unlocked Forever</span>
              </div>
            )}

            {isLocked && (
              <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full">
                <Lock className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Locked</span>
              </div>
            )}

            {/* Follow Button - Show after 2 hours of chatting */}
            {canShowFollowButton && !chat.isPermanentlyUnlocked && !isLocked && (
              <button
                onClick={handleFollow}
                disabled={isFollowing || followingUser}
                className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                  isFollowing
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed"
                    : "bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                }`}
              >
                {followingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Following...</span>
                  </>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            {/* Actions Menu */}
            <div ref={reportMenuRef} className="relative">
              <button
                ref={flagButtonRef}
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative z-50"
              >
                <Flag className="w-5 h-5 text-white/60" />
              </button>

              {showReportMenu && typeof window !== 'undefined' && menuPosition && createPortal(
                <div 
                  ref={menuPortalRef}
                  className="fixed bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-2 min-w-[200px] z-[9999] shadow-2xl"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      handleReport("Inappropriate content");
                      setShowReportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-white text-sm"
                  >
                    Report: Inappropriate
                  </button>
                  <button
                    onClick={() => {
                      handleReport("Harassment");
                      setShowReportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-white text-sm"
                  >
                    Report: Harassment
                  </button>
                  <button
                    onClick={() => {
                      handleReport("Spam");
                      setShowReportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-white text-sm"
                  >
                    Report: Spam
                  </button>
                  <button
                    onClick={() => {
                      handleBlock();
                      setShowReportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Block User
                  </button>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent hover:scrollbar-thumb-purple-500/70 relative z-10">
          {chat.messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">No messages yet. Start the conversation!</p>
              {!isLocked && (
                <div className="space-y-4">
                  {loadingAI ? (
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating AI icebreakers...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {(aiIcebreakers.length > 0 ? aiIcebreakers : ICEBREAKER_PROMPTS).map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(prompt)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-all"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      {aiIcebreakers.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-white/40">AI Generated</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {chat.messages.map((msg: any, idx: number) => {
                const isOwn = msg.sender?._id?.toString() === user?.id;
                const sender = msg.sender;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {!isOwn && (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        {sender?.profileImage ? (
                          <Image
                            src={sender.profileImage}
                            alt={sender?.name || "User"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            {sender?.name?.[0] || "U"}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                      <div
                        className={`inline-block px-4 py-2 rounded-2xl ${
                      isOwn
                        ? "bg-linear-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white/10 text-white"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        {msg.isIcebreaker && (
                          <span className="text-xs opacity-70 ml-2">💬</span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-1 px-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        {isLocked ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <p className="text-red-400">
              This chat has expired and is locked. Follow each other to unlock permanently!
            </p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!canSend}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!canSend || !messageText.trim()}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

