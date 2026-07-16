"use client";

import { MessageCircle } from "lucide-react";

/**
 * /chat — index page.
 * The 2-column shell (ChatShell) is rendered by layout.tsx.
 * This page is the right-column content when no chat is selected.
 */
export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full p-8">
      <div className="text-center flex flex-col items-center gap-4 max-w-xs animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-white/20 animate-pulse" />
        </div>
        <p
          className="text-white/60 text-xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
        >
          Select a chat
        </p>
        <p className="text-white/30 text-sm leading-relaxed">
          Pick a conversation from the list, or discover new vibes to connect with people near you.
        </p>
      </div>
    </div>
  );
}
