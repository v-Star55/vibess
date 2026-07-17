"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

interface ChatPlaceholderProps {
  onBrowse: () => void;
}

export default function ChatPlaceholder({ onBrowse }: ChatPlaceholderProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#07011d] relative">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none -z-10 bg-purple-500/5 opacity-40" />
      
      <div className="text-center max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto shadow-inner text-purple-400">
          <MessageSquare className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-white font-black text-xl tracking-tight">No Active GP Selected</h3>
          <p className="text-white/40 text-xs font-semibold leading-relaxed max-w-xs mx-auto">
            Choose a group chat from the left sidebar to start messaging, or browse home to find nearby active conversations.
          </p>
        </div>
        <button
          onClick={onBrowse}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:scale-102 transition-all font-extrabold text-xs uppercase tracking-wider active:scale-97 cursor-pointer"
        >
          Browse GPs Feed
        </button>
      </div>
    </div>
  );
}
