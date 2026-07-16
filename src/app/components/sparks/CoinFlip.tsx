import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface CoinFlipProps {
  cfState: "idle" | "flipping" | "flipped";
  cfResult: "heads" | "tails" | null;
  cfChoice: "heads" | "tails" | null;
  cfGuesserId: string | null;
  cfFlipperId: string | null;
  currentUserId: string;
  otherUserName: string;
  onGuess: (choice: "heads" | "tails") => void;
  onFlip: (result: "heads" | "tails") => void;
  onReset: () => void;
}

export default function CoinFlip({
  cfState,
  cfResult,
  cfChoice,
  cfGuesserId,
  cfFlipperId,
  currentUserId,
  otherUserName,
  onGuess,
  onFlip,
  onReset,
}: CoinFlipProps) {
  // Local state to manage the landed display state after the animation finishes
  const [localDisplayState, setLocalDisplayState] = useState<"idle" | "flipping" | "flipped">("idle");

  useEffect(() => {
    if (cfState === "flipping") {
      setLocalDisplayState("flipping");
      // Align local display transition with the 1.8s CSS animation
      const timer = setTimeout(() => {
        setLocalDisplayState("flipped");
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setLocalDisplayState(cfState);
    }
  }, [cfState]);

  const isMeGuesser = cfGuesserId === currentUserId;
  const guesserName = cfGuesserId ? (isMeGuesser ? "You" : otherUserName) : null;
  const isMeFlipper = cfFlipperId === currentUserId;
  const flipperName = cfFlipperId ? (isMeFlipper ? "You" : otherUserName) : null;

  const handleChooseSide = (side: "heads" | "tails") => {
    if (cfState !== "idle") return;
    onGuess(side);
  };

  const handleFlipCoin = () => {
    if (cfState !== "idle") return;
    // Determine result randomly
    const result = Math.random() < 0.5 ? "heads" : "tails";
    onFlip(result);
  };

  // Determine the coin class for animation
  let coinClass = "";
  if (localDisplayState === "flipping") {
    coinClass = cfResult === "heads" ? "animate-flip-heads" : "animate-flip-tails";
  } else if (localDisplayState === "flipped") {
    coinClass = cfResult === "heads" ? "show-heads" : "show-tails";
  } else {
    coinClass = "show-heads"; // Default position
  }

  // Determine game feedback messages
  const getFeedbackMessage = () => {
    if (localDisplayState === "flipping") {
      return (
        <div className="text-xs text-indigo-400 font-bold animate-pulse">
          Coin is spinning in the air... 🪙
        </div>
      );
    }

    if (localDisplayState === "flipped" && cfResult) {
      const formattedResult = cfResult.toUpperCase();
      if (cfChoice && cfGuesserId) {
        const isCorrect = cfChoice === cfResult;
        if (isMeGuesser) {
          return isCorrect ? (
            <div className="text-emerald-400 font-bold animate-bounce text-sm">
              🎉 Correct! You won the flip!
            </div>
          ) : (
            <div className="text-rose-400 font-bold text-sm">
              😢 Unlucky! You guessed wrong.
            </div>
          );
        } else {
          return isCorrect ? (
            <div className="text-emerald-400 font-bold text-sm">
              🎉 {otherUserName} guessed correctly and won!
            </div>
          ) : (
            <div className="text-rose-400 font-bold text-sm">
              😢 {otherUserName} guessed wrong.
            </div>
          );
        }
      }

      return (
        <div className="text-indigo-300 font-extrabold text-sm">
          It landed on: <span className="text-amber-400 font-black">{formattedResult}</span>
        </div>
      );
    }

    if (cfChoice && cfGuesserId) {
      if (isMeGuesser) {
        return (
          <div className="text-xs text-white/70">
            You picked <span className="text-amber-400 font-bold uppercase">{cfChoice}</span>. Ready to flip!
          </div>
        );
      } else {
        return (
          <div className="text-xs text-white/70">
            {otherUserName} picked <span className="text-amber-400 font-bold uppercase">{cfChoice}</span>. Ready to flip!
          </div>
        );
      }
    }

    return (
      <div className="text-xs text-white/50">
        Choose Heads/Tails to make a guess, or just flip!
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center space-y-6">
      {/* CSS Stylesheet Injector for 3D flip animations */}
      <style>{`
        .coin-wrapper {
          perspective: 1000px;
          width: 140px;
          height: 140px;
          position: relative;
        }
        .coin {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          transition: transform 0.5s ease-out;
        }
        .coin-face {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          user-select: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.4);
        }
        .coin-front {
          background: linear-gradient(135deg, #ffe066 0%, #f5a623 50%, #d48300 100%);
          border: 6px double #ffe066;
          color: #4a2f00;
          transform: rotateY(0deg);
        }
        .coin-back {
          background: linear-gradient(135deg, #f5a623 0%, #d48300 50%, #8b5a00 100%);
          border: 6px double #ffd875;
          color: #ffd875;
          transform: rotateY(180deg);
        }
        .show-heads {
          transform: rotateY(0deg);
        }
        .show-tails {
          transform: rotateY(180deg);
        }
        @keyframes flip-heads {
          0% { transform: rotateY(0deg) translateY(0px) scale(1); }
          20% { transform: rotateY(360deg) translateY(-120px) scale(1.15); }
          60% { transform: rotateY(1080deg) translateY(-120px) scale(1.15); }
          85% { transform: rotateY(1800deg) translateY(0px) scale(1); }
          100% { transform: rotateY(2160deg) translateY(0px) scale(1); }
        }
        @keyframes flip-tails {
          0% { transform: rotateY(0deg) translateY(0px) scale(1); }
          20% { transform: rotateY(360deg) translateY(-120px) scale(1.15); }
          60% { transform: rotateY(1080deg) translateY(-120px) scale(1.15); }
          85% { transform: rotateY(1800deg) translateY(0px) scale(1); }
          100% { transform: rotateY(2340deg) translateY(0px) scale(1); }
        }
        .animate-flip-heads {
          animation: flip-heads 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-flip-tails {
          animation: flip-tails 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="text-center">
        <h5 className="text-sm font-extrabold tracking-wide uppercase text-amber-400">Coin Flip</h5>
        <div className="mt-1 h-6 flex items-center justify-center">
          {getFeedbackMessage()}
        </div>
      </div>

      {/* 3D Coin Graphic */}
      <div className="coin-wrapper my-4">
        <div className={`coin ${coinClass}`}>
          {/* Heads Face */}
          <div className="coin-face coin-front">
            <svg viewBox="0 0 100 100" className="w-14 h-14 text-yellow-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <polygon points="50,15 62,38 88,40 68,57 74,83 50,69 26,83 32,57 12,40 38,38" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-black tracking-widest mt-1 opacity-90 uppercase">Heads</span>
          </div>

          {/* Tails Face */}
          <div className="coin-face coin-back">
            <svg viewBox="0 0 100 100" className="w-14 h-14 text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <path d="M20 68 L80 68 L90 35 L65 48 L50 22 L35 48 L10 35 Z" fill="currentColor" />
              <circle cx="50" cy="76" r="4.5" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-black tracking-widest mt-1 opacity-95 uppercase text-yellow-100">Tails</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-4">
        {localDisplayState === "idle" && (
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Choose side buttons */}
            <div className="flex gap-3 w-64">
              <button
                onClick={() => handleChooseSide("heads")}
                disabled={cfChoice !== null}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  cfChoice === "heads"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                }`}
              >
                Heads
              </button>
              <button
                onClick={() => handleChooseSide("tails")}
                disabled={cfChoice !== null}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  cfChoice === "tails"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                }`}
              >
                Tails
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleFlipCoin}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-amber-950"
            >
              Flip Coin 🪙
            </button>
          </div>
        )}

        {localDisplayState === "flipping" && (
          <div className="text-xs text-white/40 italic mt-2">
            Waiting for physics to settle...
          </div>
        )}

        {localDisplayState === "flipped" && (
          <div className="flex flex-col items-center space-y-3">
            <div className="text-[10px] text-white/30 text-center leading-relaxed">
              Flipped by: <strong className="text-white/60 font-semibold">{flipperName}</strong>
              {guesserName && (
                <>
                  {" • "}
                  Guessed: <strong className="text-white/60 font-semibold">{cfChoice?.toUpperCase()}</strong> by <strong className="text-white/60 font-semibold">{guesserName}</strong>
                </>
              )}
            </div>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-5 py-2 bg-white/10 hover:bg-white/15 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
