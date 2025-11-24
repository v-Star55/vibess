"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  shouldShowRefreshReminder,
  markReminderShown,
  getTimeUntilNextReminder,
  formatTimeUntilReminder,
} from "../lib/vibeRefresh";
import { Sparkles, X } from "lucide-react";

export default function VibeRefreshReminder() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [timeUntil, setTimeUntil] = useState<string>("");

  useEffect(() => {
    const checkReminder = () => {
      if (shouldShowRefreshReminder()) {
        setShow(true);
      } else {
        const time = getTimeUntilNextReminder();
        if (time > 0) {
          setTimeUntil(formatTimeUntilReminder(time));
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    markReminderShown();
    setShow(false);
  };

  const handleUpdate = () => {
    markReminderShown();
    setShow(false);
    router.push("/vibe/create");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-2xl border-2 border-white/20">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-full p-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">Time to Refresh Your Vibe!</h3>
            <p className="text-white/90 text-sm mb-4">
              It's been 12 hours since you last updated your vibe card. Keep your energy fresh!
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all text-sm"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all text-sm"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

