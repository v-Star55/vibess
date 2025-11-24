"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Flag, Loader2, Heart, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { createConfession, getConfessionsWall, reportConfession, checkConfessionLimit } from "../lib/api";

interface Confession {
  _id: string;
  text: string;
  createdAt: string;
}

export default function WhisperSpacePage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confessionText, setConfessionText] = useState("");
  const [canPost, setCanPost] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // in minutes
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null); // in seconds
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initialize = async () => {
      await checkLimit();
      await loadConfessions(1);
    };
    initialize();
    
    // Refresh confessions every 30 seconds
    const interval = setInterval(() => loadConfessions(1), 30000);
    return () => clearInterval(interval);
  }, []);


  const loadConfessions = async (pageNum: number = page) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      const res = await getConfessionsWall(pageNum, 20);
      if (res.success) {
        if (pageNum === 1) {
          setConfessions(res.confessions);
        } else {
          setConfessions((prev) => [...prev, ...res.confessions]);
        }
        setHasMore(res.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error loading confessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async () => {
    try {
      const res = await checkConfessionLimit();
      if (res.success) {
        setCanPost(res.canPost);
        if (!res.canPost && res.timeRemaining) {
          // Convert minutes to seconds for more granular countdown
          const totalSeconds = res.timeRemaining * 60;
          setTimeRemaining(res.timeRemaining);
          setSecondsRemaining(totalSeconds);
        } else {
          setTimeRemaining(null);
          setSecondsRemaining(null);
        }
      }
    } catch (error) {
      console.error("Error checking limit:", error);
    }
  };

  // Countdown timer effect - updates every second
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) {
      if (secondsRemaining !== null && secondsRemaining <= 0) {
        setCanPost(true);
        setTimeRemaining(null);
        setSecondsRemaining(null);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setCanPost(true);
          setTimeRemaining(null);
          return 0;
        }
        // Update minutes when seconds cross a minute boundary
        const newSeconds = prev - 1;
        const newMinutes = Math.floor(newSeconds / 60);
        if (newMinutes !== timeRemaining) {
          setTimeRemaining(newMinutes);
        }
        return newSeconds;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [secondsRemaining, timeRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confessionText.trim()) {
      toast.error("Please write something");
      return;
    }

    if (confessionText.length > 300) {
      toast.error("Confession must be 300 characters or less");
      return;
    }

    if (!canPost) {
      toast.error("Your heart already spoke. Come back later 🤍");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createConfession(confessionText.trim());

      if (res.success) {
        toast.success("Your confession has been shared anonymously 🤍");
        setConfessionText("");
        setCanPost(false);
        await checkLimit();
        // Reload confessions to show the new one
        await loadConfessions(1);
        setPage(1); // Reset to first page
      } else {
        toast.error(res.message || "Failed to post confession");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to post confession";
      toast.error(errorMessage);
      if (errorMessage.includes("Come back later")) {
        setCanPost(false);
        checkLimit();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (confessionId: string) => {
    if (reportingId) return;

    setReportingId(confessionId);
    try {
      const res = await reportConfession(confessionId);
      if (res.success) {
        if (res.removed) {
          toast.success("Confession removed");
          setConfessions((prev) =>
            prev.filter((c) => c._id !== confessionId)
          );
        } else {
          toast.success("Report submitted. Thank you for keeping Whisper Space safe.");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to report confession");
    } finally {
      setReportingId(null);
    }
  };

  const formatWaitTime = (seconds: number | null) => {
    if (seconds === null) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      if (mins > 0) return `${hours}h ${mins}m`;
      return `${hours}h`;
    }
    if (mins > 0) {
      if (secs > 0) return `${mins}m ${secs}s`;
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-y-auto h-full">
      <section className="flex-1 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
            <MessageCircle className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Whisper Space</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Where unsaid things feel safe.
            <br />
            <span className="text-white/50">No judgment. Just space.</span>
          </p>
        </div>

        {/* Create Confession Form */}
        <div className="rounded-2xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Share Your Confession
              </label>
              <textarea
                ref={textareaRef}
                value={confessionText}
                onChange={(e) => setConfessionText(e.target.value)}
                placeholder="Type your confession here... (max 300 characters)"
                maxLength={300}
                rows={4}
                disabled={!canPost || submitting}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-white/40">
                  {confessionText.length}/300 characters
                </p>
                {!canPost && secondsRemaining !== null && secondsRemaining > 0 && (
                  <p className="text-xs text-purple-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Come back in {formatWaitTime(secondsRemaining)}
                  </p>
                )}
              </div>
            </div>

            {canPost ? (
              <button
                type="submit"
                disabled={submitting || !confessionText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Share Anonymously</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-center">
                <p className="text-white/70 text-sm flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Your heart already spoke. Come back later 🤍
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Confessions Wall */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Global Wall</h2>
            <p className="text-xs text-white/60">
              All confessions are 100% anonymous
            </p>
          </div>

          {loading && confessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : confessions.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
              <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg mb-2">No confessions yet</p>
              <p className="text-white/40 text-sm">
                Be the first to share something...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {confessions.map((confession, index) => (
                  <div
                    key={confession._id}
                    className="rounded-xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all relative group animate-float"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationDuration: '6s',
                    }}
                  >
                    <p className="text-white leading-relaxed mb-4 whitespace-pre-wrap">
                      {confession.text}
                    </p>
                    <div className="flex items-center justify-end pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleReport(confession._id)}
                        disabled={reportingId === confession._id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all disabled:opacity-50"
                        title="Report this confession"
                      >
                        {reportingId === confession._id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Reporting...</span>
                          </>
                        ) : (
                          <>
                            <Flag className="w-3 h-3" />
                            <span>Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && !loading && (
                <button
                  onClick={async () => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    await loadConfessions(nextPage);
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all"
                >
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

