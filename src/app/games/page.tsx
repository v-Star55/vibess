"use client";

import { useState } from "react";
import { Brain, Loader2, RefreshCw, Coins } from "lucide-react";
import toast from "react-hot-toast";

export default function GamesPage() {
  const [overthink, setOverthink] = useState<string | null>(null);
  const [counter, setCounter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Make Your Decision game state
  const [decisionResult, setDecisionResult] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const handleOverthink = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/games/overthink", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setOverthink(data.overthink);
        setCounter(data.counter);
      } else {
        toast.error("Failed to generate overthink. Please try again.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOverthink(null);
    setCounter(null);
  };

  const handleMakeDecision = () => {
    setDecisionLoading(true);
    setDecisionResult(null);
    
    // Wait 2-3 seconds for suspense, then show result
    const delay = Math.random() * 1000 + 2000; // 2-3 seconds
    
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      setDecisionResult(result);
      setDecisionLoading(false);
    }, delay);
  };

  const handleResetDecision = () => {
    setDecisionResult(null);
    setDecisionLoading(false);
  };

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-y-auto h-full">
      <section className="flex-1 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Games</h1>
          <p className="text-white/60 text-sm">Fun games to pass time and have a laugh</p>
        </div>

        {/* The Overthink Button Game */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-purple-500/30 p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">The Overthink Button</h2>
                <p className="text-white/60 text-sm">Press to get a random overthinking thought and its ridiculous counter</p>
              </div>
            </div>

            {!overthink ? (
              <div className="space-y-6">
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-white/60 text-sm mb-6">
                    Ready to overthink? Press the button below!
                  </p>
                  <button
                    onClick={handleOverthink}
                    disabled={loading}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        <span>Press to Overthink</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overthink Thought */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-2xl">🤔</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Overthink:</p>
                      <p className="text-white text-lg leading-relaxed">{overthink}</p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-2xl">⬇️</span>
                  </div>
                </div>

                {/* Counter Thought */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">Counter:</p>
                      <p className="text-white text-lg leading-relaxed font-medium">{counter}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleOverthink}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Overthink Again</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Make Your Decision Game */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-purple-500/30 p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Make Your Decision</h2>
                <p className="text-white/60 text-sm">Can't decide? Let fate choose for you with a coin flip</p>
              </div>
            </div>

            {!decisionResult ? (
              <div className="space-y-6">
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                  {decisionLoading ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-6xl animate-spin" style={{ animationDuration: '0.3s' }}>
                          🪙
                        </div>
                      </div>
                      <p className="text-white/80 text-lg font-semibold">The coin is flipping...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/60 text-sm mb-6">
                        Press the button to flip the coin!
                      </p>
                      <button
                        onClick={handleMakeDecision}
                        disabled={decisionLoading}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                      >
                        <Coins className="w-5 h-5" />
                        <span>Make Your Decision</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Result Display */}
                <div className={`rounded-2xl p-8 text-center ${
                  decisionResult === "Heads" 
                    ? "bg-yellow-500/20 border border-yellow-500/30" 
                    : "bg-gray-500/20 border border-gray-500/30"
                }`}>
                  <div className="mb-4">
                    <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold ${
                      decisionResult === "Heads"
                        ? "bg-yellow-500/30 text-yellow-300"
                        : "bg-gray-500/30 text-gray-300"
                    }`}>
                      {decisionResult === "Heads" ? "🪙" : "🪙"}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{decisionResult}</p>
                  <p className="text-white/60 text-sm">
                    {decisionResult === "Heads" 
                      ? "The coin landed on Heads!" 
                      : "The coin landed on Tails!"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleMakeDecision}
                    disabled={decisionLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {decisionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Flipping...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Flip Again</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleResetDecision}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

