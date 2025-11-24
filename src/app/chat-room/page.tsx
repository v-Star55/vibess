"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/src/store/store";
import {
  generateChatRoom,
  getChatRooms,
  getChatRoom,
  sendChatRoomMessage,
} from "../lib/vibeApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Send,
  Users,
  Clock,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

export default function ChatRoomPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Auto-create room function
  const autoCreateRoom = async () => {
    setGenerating(true);
    try {
      const res = await generateChatRoom();
      if (res.success) {
        toast.success("Chat room created!");
        await loadChatRooms();
        if (res.chatRoom) {
          loadChatRoom(res.chatRoom._id);
        }
      }
    } catch (error: any) {
      console.error("Failed to auto-create room:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create chat room"
      );
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadChatRooms();
    
    // Automatically create a room if user doesn't have one
    const checkAndCreateRoom = async () => {
      try {
        const res = await getChatRooms();
        if (res.success && (!res.chatRooms || res.chatRooms.length === 0)) {
          // No active rooms, create one automatically
          await autoCreateRoom();
        }
      } catch (error) {
        console.error("Failed to check/create room:", error);
      }
    };
    
    // Check after loading rooms
    setTimeout(checkAndCreateRoom, 1000);
  }, [user, router]);

  // Poll for room updates every 5 seconds
  useEffect(() => {
    if (selectedRoom) {
      const interval = setInterval(() => {
        loadChatRoom(selectedRoom._id);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  const loadChatRooms = async () => {
    try {
      const res = await getChatRooms();
      if (res.success) {
        setChatRooms(res.chatRooms || []);
        // Auto-select first room if available
        if (res.chatRooms && res.chatRooms.length > 0 && !selectedRoom) {
          loadChatRoom(res.chatRooms[0]._id);
        }
      }
    } catch (error: any) {
      console.error("Failed to load chat rooms", error);
      toast.error("Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  };

  const loadChatRoom = async (roomId: string) => {
    try {
      const res = await getChatRoom(roomId);
      if (res.success) {
        setSelectedRoom(res.chatRoom);
        // Update in rooms list too
        setChatRooms((prev) =>
          prev.map((room) =>
            room._id === roomId ? res.chatRoom : room
          )
        );
      }
    } catch (error: any) {
      console.error("Failed to load chat room", error);
    }
  };

  // Removed manual room generation - rooms are created automatically

  const handleSendMessage = async () => {
    if (!selectedRoom || !messageText.trim()) return;

    setSending(true);
    try {
      const res = await sendChatRoomMessage(selectedRoom._id, messageText);
      if (res.success) {
        setSelectedRoom(res.chatRoom);
        setMessageText("");
        // Update in rooms list
        setChatRooms((prev) =>
          prev.map((room) =>
            room._id === selectedRoom._id ? res.chatRoom : room
          )
        );
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

  const getOtherParticipants = (room: any) => {
    if (!user || !room.participants) return [];
    return room.participants.filter(
      (p: any) => p._id?.toString() !== user.id
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex">
      {/* Chat Rooms List */}
      <div className="w-80 border-r border-white/10 bg-white/5 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-lg">Chat Rooms</h2>
          </div>
          <p className="text-white/60 text-xs">
            Auto-created every 4 hours based on your vibe
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center">
              {generating ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">
                    Creating your chat room...
                  </p>
                </>
              ) : (
                <>
                  <Users className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60 text-sm mb-2">
                    No active chat rooms
                  </p>
                  <p className="text-white/40 text-xs">
                    A new room will be created automatically
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {chatRooms.map((room) => {
                const others = getOtherParticipants(room);
                const isExpired = new Date(room.expiresAt) < new Date();
                const isSelected =
                  selectedRoom && selectedRoom._id === room._id;

                return (
                  <button
                    key={room._id}
                    onClick={() => loadChatRoom(room._id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm font-medium">
                        {others.length + 1} members
                      </span>
                      {isExpired && (
                        <span className="text-red-400 text-xs">Expired</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {others.slice(0, 3).map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold"
                        >
                          {p.profileImage ? (
                            <Image
                              src={p.profileImage}
                              alt={p.name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.name?.[0] || "U"
                          )}
                        </div>
                      ))}
                      {others.length > 3 && (
                        <span className="text-white/60 text-xs">
                          +{others.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-white/60 text-xs">
                        {formatTimeRemaining(room.expiresAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Room Content */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Room Header */}
            <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Chat Room ({selectedRoom.participants?.length || 4})
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    {selectedRoom.participants?.map((p: any) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                          {p.profileImage ? (
                            <Image
                              src={p.profileImage}
                              alt={p.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.name?.[0] || "U"
                          )}
                        </div>
                        <span className="text-white text-sm">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-white text-sm font-mono">
                    {formatTimeRemaining(selectedRoom.expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50">
              {selectedRoom.messages?.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRoom.messages?.map((msg: any, idx: number) => {
                    const isOwn =
                      msg.sender?._id?.toString() === user?.id;
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
                          {!isOwn && (
                            <p className="text-white/60 text-xs mb-1">
                              {sender?.name || "User"}
                            </p>
                          )}
                          <div
                            className={`inline-block px-4 py-2 rounded-2xl ${
                              isOwn
                                ? "bg-linear-to-r from-purple-500 to-pink-500 text-white"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
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
                </div>
              )}
            </div>

            {/* Message Input */}
            {new Date(selectedRoom.expiresAt) < new Date() ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                <p className="text-red-400">
                  This chat room has expired.
                </p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-4 flex gap-3">
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
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {generating ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-white/60 text-lg mb-2">
                    Creating your chat room...
                  </p>
                  <p className="text-white/40 text-sm">
                    Matching you with 3 others based on your vibe
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/60 text-lg mb-2">
                    No active chat rooms
                  </p>
                  <p className="text-white/40 text-sm">
                    A new room will be created automatically based on your vibe
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

