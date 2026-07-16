"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { formatTimeShort } from "./ChatCountdownPill";
import Image from "next/image";

type ChatPreview = {
  _id: string;
  otherParticipant?: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  lastMessage?: {
    text: string;
    createdAt: string;
    sender: any;
  };
  hasUnread?: boolean;
  unreadMessages?: number;
  timeRemaining?: number | null;
  isLocked?: boolean;
  isPermanentlyUnlocked?: boolean;
};

interface ChatListSidebarProps {
  chats: ChatPreview[];
  activeChatId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onDelete?: (chatId: string) => Promise<void>;
}

function formatRelativeTime(timestamp?: string) {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const gradients = [
  ["#FF5D73", "#C65CFF"],
  ["#C65CFF", "#33D6C0"],
  ["#33D6C0", "#FFB25E"],
  ["#FFB25E", "#FF5D73"],
];
function getGradient(name: string) {
  const idx = (name?.charCodeAt(0) || 0) % gradients.length;
  return gradients[idx];
}

export default function ChatListSidebar({
  chats,
  activeChatId,
  search,
  onSearchChange,
  loading,
  refreshing,
  onRefresh,
  onDelete,
}: ChatListSidebarProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!onDelete || deletingId) return;
    setDeletingId(chatId);
    try {
      await onDelete(chatId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#100c1c] border-r border-white/[0.07]">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            Chats
          </h1>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 active:scale-95"
            aria-label="Refresh"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-white/50" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#C65CFF] transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] focus:border-[#C65CFF]/40 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#C65CFF]/10 transition-all duration-200"
          />
        </div>
      </div>

      {/* Chat Items */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-4 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-white/50 text-sm">No chats yet</p>
            <button
              onClick={() => router.push("/vibe/discover")}
              className="text-xs text-[#C65CFF] hover:text-[#FF5D73] transition-colors font-semibold"
            >
              Discover Vibes →
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            const p = chat.otherParticipant;
            const isActive = chat._id === activeChatId;
            const lastTime = chat.lastMessage?.createdAt
              ? formatRelativeTime(chat.lastMessage.createdAt)
              : "";
            const [g1, g2] = getGradient(p?.name || "U");
            const isUrgent =
              chat.timeRemaining !== null &&
              chat.timeRemaining !== undefined &&
              chat.timeRemaining > 0 &&
              chat.timeRemaining < 3600000;

            // A chat is expired if it's locked and not permanently unlocked and timeRemaining is 0
            const isExpired =
              chat.isLocked &&
              !chat.isPermanentlyUnlocked;

            const isDeleting = deletingId === chat._id;

            return (
              <div key={chat._id} className="relative group/item">
                <button
                  onClick={() => router.push(`/chat/${chat._id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.09] border border-white/[0.12]"
                      : "hover:bg-white/[0.04] border border-transparent"
                  } ${isExpired ? "opacity-60" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 rounded-full overflow-hidden border border-white/10 flex items-center justify-center text-sm font-extrabold"
                      style={{
                        background: `linear-gradient(135deg, ${g1}, ${g2})`,
                        color: "#160E22",
                      }}
                    >
                      {p?.profileImage ? (
                        <Image
                          src={p.profileImage}
                          alt={p.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{p?.name?.[0] || "U"}</span>
                      )}
                    </div>
                    {/* Expired indicator OR online dot */}
                    {isExpired ? (
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#FF5D73]/80 border-2 border-[#100c1c]"
                        title="Expired"
                      />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#33D6C0] border-2 border-[#100c1c]" />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm font-bold truncate ${
                          isActive ? "text-white" : "text-white/90"
                        }`}
                      >
                        {p?.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-white/30 font-mono shrink-0 ml-2">
                        {lastTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs truncate ${
                          chat.hasUnread
                            ? "text-white/70 font-semibold"
                            : "text-white/35"
                        }`}
                      >
                        {isExpired
                          ? "Chat ended"
                          : chat.lastMessage?.text || "No messages yet"}
                      </span>
                      {isExpired ? (
                        <span className="shrink-0 text-[9px] text-[#FF5D73]/70 font-mono font-bold border border-[#FF5D73]/20 rounded-full px-1.5 py-0.5">
                          Ended
                        </span>
                      ) : chat.unreadMessages && chat.unreadMessages > 0 ? (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-[10px] font-extrabold text-white">
                          {chat.unreadMessages}
                        </span>
                      ) : chat.timeRemaining !== null &&
                        chat.timeRemaining !== undefined &&
                        chat.timeRemaining > 0 ? (
                        <span
                          className={`shrink-0 text-[9px] font-mono font-bold flex items-center gap-1 ${
                            isUrgent ? "text-[#FF5D73]" : "text-white/25"
                          }`}
                        >
                          {formatTimeShort(chat.timeRemaining)}
                        </span>
                      ) : chat.timeRemaining === null ? (
                        <span className="shrink-0 text-[9px] text-[#33D6C0] font-mono font-bold">
                          ∞
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>

                {/* Delete button — visible on hover for expired chats */}
                {isExpired && onDelete && (
                  <button
                    onClick={(e) => handleDelete(e, chat._id)}
                    disabled={isDeleting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[#FF5D73] transition-all duration-200"
                    title="Remove from inbox"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={() => router.push("/vibe/discover")}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#C65CFF] to-[#FF5D73] text-[#160E22] font-bold text-sm hover:shadow-[0_0_20px_rgba(198,92,255,0.35)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
        >
          + Discover Vibes
        </button>
      </div>
    </div>
  );
}
