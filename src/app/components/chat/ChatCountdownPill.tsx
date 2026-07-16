"use client";

import { Clock } from "lucide-react";

interface ChatCountdownPillProps {
  timeRemaining: number | null; // ms
  isPermanent?: boolean;
  className?: string;
}

function formatTime(ms: number) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTimeShort(ms: number) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h left`;
  return `${m}m left`;
}

export default function ChatCountdownPill({
  timeRemaining,
  isPermanent,
  className = "",
}: ChatCountdownPillProps) {
  if (isPermanent) {
    return (
      <div
        className={`flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#33D6C0] animate-pulse" />
        <span className="text-[#33D6C0] text-xs font-bold uppercase tracking-wider font-mono">
          Forever
        </span>
      </div>
    );
  }

  if (timeRemaining === null) return null;

  const isUrgent = timeRemaining < 3600 * 1000;
  const isExpired = timeRemaining <= 0;

  return (
    <div
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-mono transition-all duration-500 ${
        isExpired
          ? "bg-red-500/10 border-red-500/30 text-[#FF5D73]"
          : isUrgent
          ? "bg-red-500/10 border-red-500/25 text-[#FF5D73] animate-pulse"
          : "bg-amber-500/10 border-amber-500/20 text-[#FFB25E]"
      } ${className}`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">
        {isExpired ? "Expired" : formatTime(timeRemaining)}
      </span>
    </div>
  );
}
