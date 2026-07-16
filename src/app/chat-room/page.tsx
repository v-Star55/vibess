"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import { useSocket } from "@/src/hooks/useSocket";
import { getMyGPs, getGPDetails, sendGPMessage } from "../lib/api";
import toast from "react-hot-toast";
import {
  Loader2,
  Send,
  Users,
  Clock,
  MessageCircle,
} from "lucide-react";

export default function ChatRoomPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const groupsRes = await getMyGPs();
        const groupsList = groupsRes.success ? (groupsRes.gps || []) : [];
        setGroups(groupsList);

        // Check if gpId is in URL query parameters safely
        const params = new URLSearchParams(window.location.search);
        const gpId = params.get("gpId");

        if (gpId) {
          await loadGP(gpId);
        } else if (groupsList.length > 0) {
          await loadGP(groupsList[0]._id);
        } else {
          setSelectedRoom(null);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, router]);

  // Handle Socket.io events for the GP Chat Room
  useEffect(() => {
    if (!socket || !connected || !selectedRoom?._id) return;

    const roomId = selectedRoom._id;
    socket.emit("join-room", roomId);

    const handleReceiveMessage = (data: any) => {
      console.log("GP Group message received via socket:", data);
      if (data.chatId === roomId) {
        setSelectedRoom((prev: any) => {
          if (!prev) return prev;
          // Avoid duplicate messages
          const messageId = data.message?._id?.toString() ?? data.message?.toString();
          const msgExists = prev.messages?.some((m: any) => {
            const mId = m._id?.toString() ?? m.toString();
            return mId === messageId;
          });
          if (msgExists) return prev;
          
          const updatedMessages = [...(prev.messages || []), data.message];
          const updated = { ...prev, messages: updatedMessages };

          // Update in groups list too
          setGroups((prevGroups) =>
            prevGroups.map((g) => (g._id === roomId ? { ...g, messages: updatedMessages } : g))
          );

          return updated;
        });
      }
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [socket, connected, selectedRoom?._id]);

  const loadGP = async (gpId: string) => {
    try {
      const res = await getGPDetails(gpId);
      if (res.success && res.gp) {
        const gpWithParticipants = {
          ...res.gp,
          participants: res.gp.members,
        };
        setSelectedRoom(gpWithParticipants);
        // Update in groups list too
        setGroups((prev) =>
          prev.map((g) => (g._id === gpId ? res.gp : g))
        );
      }
    } catch (error: any) {
      console.error("Failed to load GP chat", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRoom || !messageText.trim()) return;

    setSending(true);
    try {
      const res = await sendGPMessage(selectedRoom._id, messageText);
      if (res.success) {
        const gpWithParticipants = {
          ...res.gp,
          participants: res.gp.members,
        };
        setSelectedRoom(gpWithParticipants);
        setMessageText("");
        setGroups((prev) =>
          prev.map((g) =>
            g._id === selectedRoom._id ? res.gp : g
          )
        );

        // Emit new message to socket server
        const newMsg = res.gp.messages[res.gp.messages.length - 1];
        if (socket && connected) {
          socket.emit("send-message", {
            chatId: selectedRoom._id,
            message: newMsg,
          });
        }
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-linear-to-br from-[#0c021a] via-[#15072e] to-[#0c021a] flex overflow-hidden">
      <style>{`
        @keyframes groupBubbleIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .group-message-anim {
          animation: groupBubbleIn 0.22s ease-out forwards;
        }
      `}</style>

      {/* Group Chats Sidebar */}
      <div className="w-80 border-r border-white/[0.06] bg-[#130b24]/40 backdrop-blur-xl flex flex-col shrink-0">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-extrabold text-lg tracking-tight">Group Chats</h2>
          </div>
          <p className="text-white/40 text-xs">
            Joined active and permanent groups
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 p-3.5 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
          <div>
            <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-2.5 mb-3">
              Joined Groups
            </h3>
            {groups.length === 0 ? (
              <div className="px-3 py-6 text-center bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                <p className="text-white/40 text-xs">No groups joined yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const isSelected = selectedRoom && selectedRoom._id === group._id;
                  const isPermanent = group.isPermanent;
                  const expired = !isPermanent && new Date(group.expiresAt) < new Date();

                  return (
                    <button
                      key={group._id}
                      onClick={() => loadGP(group._id)}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] border ${
                        isSelected
                          ? "bg-white/[0.06] border-purple-500/40 shadow-[0_4px_20px_rgba(198,92,255,0.05)]"
                          : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm shrink-0">
                          {group.category === "Vibe GP"
                            ? "✨"
                            : group.category === "Movie GP"
                            ? "🎬"
                            : group.category === "Anime GP"
                            ? "🎌"
                            : "💬"}
                        </span>
                        <span className="text-white text-sm font-bold truncate flex-1 leading-none">
                          {group.category} - {group.subType}
                        </span>
                      </div>
                      {group.specificName && (
                        <p className="text-white/50 text-xs mb-3 truncate px-6">
                          {group.specificName}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 px-6">
                        <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-medium">
                          <Users className="w-3 h-3 text-purple-400/80" />
                          <span>{group.members?.length || group.memberCount || 1} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isPermanent
                              ? "bg-emerald-500/10 border-emerald-500/20 text-[#33D6C0]"
                              : expired
                              ? "bg-red-500/10 border-red-500/20 text-[#FF5D73]"
                              : "bg-amber-500/10 border-amber-500/20 text-[#FFB25E]"
                          }`}>
                            {isPermanent ? "Permanent" : expired ? "Expired" : formatTimeRemaining(group.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GP Chat Room Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0118]/40">
        {selectedRoom ? (
          <>
            {/* Room Header */}
            <div className="bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.08] p-5 z-10 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-white font-extrabold text-lg flex items-center gap-2 tracking-tight">
                  <Users className="w-5.5 h-5.5 text-purple-400" />
                  <span>
                    {selectedRoom.category} - {selectedRoom.subType}
                    {selectedRoom.specificName ? ` (${selectedRoom.specificName})` : ""}
                  </span>
                </h3>
                
                {/* Overlapping Avatars Facepile */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {selectedRoom.participants?.slice(0, 5).map((p: any) => (
                      <div
                        key={p._id}
                        className="inline-block w-8 h-8 rounded-xl ring-2 ring-[#0c021a] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 border border-white/10 shrink-0"
                        title={p.name}
                      >
                        {p.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.profileImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                            {p.name?.[0] || "U"}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedRoom.participants?.length > 5 && (
                      <div className="inline-block w-8 h-8 rounded-xl ring-2 ring-[#0c021a] bg-white/[0.08] border border-white/10 flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                        +{selectedRoom.participants.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-white/50 font-medium">
                    {selectedRoom.participants?.length || 0} online members
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shrink-0 ${
                  selectedRoom.isPermanent
                    ? "bg-emerald-500/10 border-emerald-500/20 text-[#33D6C0]"
                    : "bg-amber-500/10 border-amber-500/20 text-[#FFB25E]"
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono font-medium leading-none">
                    {selectedRoom.isPermanent
                      ? "Permanent"
                      : formatTimeRemaining(selectedRoom.expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white/[0.01] backdrop-blur-md p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30">
              {selectedRoom.messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-purple-400 animate-pulse" />
                  </div>
                  <p className="text-white/80 font-bold text-base mb-1">No Messages Yet</p>
                  <p className="text-white/40 text-xs max-w-sm">
                    Introduce yourself and say hello to the group!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRoom.messages?.map((msg: any, idx: number) => {
                    const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id?.toString() ?? msg.sender?.toString();
                    const isOwn = senderId === user?.id;
                    const sender = msg.sender;
                    const senderName = sender?.name || "User";
                    
                    // Dynamic color for different names
                    const colors = ["text-[#C65CFF]", "text-[#FF5D73]", "text-[#33D6C0]", "text-[#FFB25E]"];
                    const colorClass = colors[senderName.length % colors.length];

                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 group-message-anim ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        {!isOwn && (
                          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                            {sender?.profileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sender.profileImage}
                                alt={sender?.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                {sender?.name?.[0] || "U"}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                          {!isOwn && (
                            <p className={`text-xs font-bold mb-1 px-1.5 ${colorClass}`}>
                              {senderName}
                            </p>
                          )}
                          <div
                            className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isOwn
                                ? "bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white rounded-tr-sm"
                                : "bg-white/[0.06] border border-white/[0.05] text-white rounded-tl-sm"
                            }`}
                          >
                            <p className="select-text">{msg.text}</p>
                          </div>
                          <span className="text-white/30 text-[10px] font-mono mt-1 px-1.5 block">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            {(!selectedRoom.isPermanent && new Date(selectedRoom.expiresAt) < new Date()) ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center backdrop-blur-md">
                <p className="text-[#FF5D73] text-sm font-semibold">
                  This group chat has expired.
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.08] p-4 flex gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
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
                  placeholder="Type a message to the group..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] focus:border-purple-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none flex items-center justify-center shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-purple-400 animate-pulse" />
              </div>
              <p className="text-white/80 font-bold text-lg mb-2">
                No Active Group Selected
              </p>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                Choose a group chat from the sidebar, or discover new groups and spark a conversation!
              </p>
              <button
                onClick={() => router.push("/groups")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-white rounded-xl hover:shadow-[0_0_20px_rgba(255,93,115,0.3)] hover:scale-[1.02] transition-all font-semibold text-sm active:scale-[0.98]"
              >
                Browse Groups
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
