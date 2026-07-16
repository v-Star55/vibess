import { useState } from "react";
import { Trophy, Clock } from "lucide-react";

interface QuickDrawProps {
  word: string;
  status: "playing" | "won" | "timeout";
  paths: Array<{ points: Array<{ x: number; y: number }>; color: string }>;
  isDrawer: boolean;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
  onGuessSubmit: (guess: string) => void;
  onReset: () => void;
  canvasRef: React.RefObject<SVGSVGElement | null>;
  timeLeft: number;
  scores: Record<string, number>;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  activeColor: string;
  onChangeColor: (color: string) => void;
}

const COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Black", value: "#000000" },
];

export default function QuickDraw({
  word,
  status,
  paths,
  isDrawer,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onGuessSubmit,
  onReset,
  canvasRef,
  timeLeft,
  scores,
  currentUserId,
  otherUserId,
  otherUserName,
  activeColor,
  onChangeColor,
}: QuickDrawProps) {
  const [guess, setGuess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    onGuessSubmit(guess);
    setGuess("");
  };

  const myScore = scores[currentUserId] || 0;
  const otherScore = scores[otherUserId] || 0;
  const isTimeCritical = timeLeft <= 15;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5 w-full">
      {/* Top Header Card */}
      <div className="flex flex-col bg-[#150e24] p-3 border border-white/10 rounded-xl shrink-0 gap-2 w-full">
        {/* Row 1: Quick Draw Info & Timer */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Quick Draw</h5>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-medium">
              {isDrawer ? "Drawing Turn" : "Guessing Turn"}
            </span>
          </div>

          {/* Timer pill */}
          <div className="flex items-center">
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-black transition-all duration-300 ${
                isTimeCritical 
                  ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]" 
                  : "bg-white/5 border-white/10 text-white"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? "text-rose-400 animate-spin" : "text-white/40"}`} />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Row 2: Word display / guessing blanks */}
        <div className="text-xs font-black text-white/90 mt-0.5 w-full">
          {isDrawer ? (
            <span>Draw: <strong className="text-amber-300 underline font-black text-sm ml-0.5">{word}</strong></span>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <span className="text-white/60 font-medium">Guess:</span>
              <span className="font-mono text-sm tracking-[0.25em] text-amber-300 font-black bg-black/40 px-2.5 py-0.5 rounded border border-white/5 inline-block">
                {word.split("").map((c) => (c === " " ? "\u00a0\u00a0" : "_")).join(" ")}
              </span>
              <span className="text-[10px] text-white/40 font-medium font-sans tracking-normal">
                ({word.replace(/\s+/g, "").length} letters)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scoreboard line */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 shrink-0 w-full">
        <div>Scoreboard:</div>
        <div className="flex gap-4">
          <div>
            <span className="text-white/30 mr-1">You:</span>
            <span className="text-indigo-400 font-extrabold">{myScore} pts</span>
          </div>
          <div>
            <span className="text-white/30 mr-1">{otherUserName}:</span>
            <span className="text-purple-400 font-extrabold">{otherScore} pts</span>
          </div>
        </div>
      </div>

      {/* SVG Drawing Canvas */}
      <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[220px] w-full" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
        {/* White drawing surface */}
        <div className="absolute inset-0 rounded-2xl" style={{ background: "#ffffff" }} />
        <svg
          ref={canvasRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className={`absolute inset-0 w-full h-full ${isDrawer && status === "playing" ? "cursor-crosshair" : "cursor-default"}`}
          style={{ touchAction: "none" }}
        >
          {/* Render paths */}
          {paths.map((path, idx) => {
            if (path.points.length === 0) return null;
            const d = path.points
              .map((p, pIdx) => `${pIdx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
              .join(" ");
            return (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke={path.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Color Palette Selector Toolbar */}
        {isDrawer && status === "playing" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 flex gap-3 items-center z-20 shadow-xl transition-all duration-300">
            {COLORS.map((c) => {
              const selected = activeColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChangeColor(c.value)}
                  className={`w-6.5 h-6.5 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150 border-2 ${
                    selected ? "border-white scale-110 shadow-md shadow-white/20" : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              );
            })}
          </div>
        )}

        {/* Won Overlay Screen */}
        {status === "won" && (
          <div className="absolute inset-0 bg-[#0c051bcc]/90 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-1">
              <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>
            <h4 className="text-base font-black text-white tracking-tight">Correctly Guessed!</h4>
            <p className="text-xs text-white/50 mt-1">The word was: <strong className="text-amber-300 font-extrabold">"{word}"</strong></p>
            <button
              onClick={onReset}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs cursor-pointer active:scale-95 transition-all"
            >
              Next Turn →
            </button>
          </div>
        )}

        {/* Timeout Overlay Screen */}
        {status === "timeout" && (
          <div className="absolute inset-0 bg-[#1e0a13cc]/90 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-1">
              <Clock className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>
            <h4 className="text-base font-black text-white tracking-tight">Time's Up!</h4>
            <p className="text-xs text-white/50 mt-1">The word was: <strong className="text-rose-300 font-extrabold">"{word}"</strong></p>
            <button
              onClick={onReset}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-rose-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-rose-500/20 text-xs cursor-pointer active:scale-95 transition-all"
            >
              Next Turn →
            </button>
          </div>
        )}
      </div>

      {/* Guess Input Bar */}
      {!isDrawer && status === "playing" && (
        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0 w-full">
          <input
            type="text"
            placeholder="Type your guess here..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 p-2.5 px-4 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/40 placeholder:text-white/30"
          />
          <button
            type="submit"
            className="px-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer hover:shadow-lg active:scale-95 transition-all"
          >
            Guess
          </button>
        </form>
      )}
    </div>
  );
}
