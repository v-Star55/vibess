import { useState } from "react";

interface TruthOrDareProps {
  todState: "idle" | "spinning" | "selected" | "chosen" | "promptWritten";
  selectedUserId: string | null;
  choice: "truth" | "dare" | null;
  promptText: string;
  spinAngle: number;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  onSpin: (selectedId: string, angle: number) => void;
  onChoose: (choice: "truth" | "dare") => void;
  onSubmitPrompt: (text: string) => void;
  onReset: () => void;
}

export default function TruthOrDare({
  todState,
  selectedUserId,
  choice,
  promptText,
  spinAngle,
  currentUserId,
  otherUserId,
  otherUserName,
  onSpin,
  onChoose,
  onSubmitPrompt,
  onReset,
}: TruthOrDareProps) {
  const [customPrompt, setCustomPrompt] = useState("");

  const isMeSelected = selectedUserId === currentUserId;
  const selectedName = isMeSelected ? "You" : otherUserName;

  const handleSpinClick = () => {
    if (todState !== "idle") return;

    // Randomly select who the bottle points to
    const randomUser = Math.random() < 0.5 ? currentUserId : otherUserId;
    const spins = 5; // number of full rotations
    // Top is otherUser (0 deg), Bottom is currentUser (180 deg)
    const baseTarget = randomUser === otherUserId ? 0 : 180;
    // Add random slight offset (+/- 15 deg) so it doesn't look mathematically perfect
    const offset = Math.floor(Math.random() * 30) - 15;
    const finalAngle = (spins * 360) + baseTarget + offset;

    onSpin(randomUser, finalAngle);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onSubmitPrompt(customPrompt);
    setCustomPrompt("");
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center space-y-6">
      <div className="text-center">
        <h5 className="text-sm font-extrabold tracking-wide uppercase text-rose-400">Spin the Bottle</h5>
        <p className="text-xs text-white/50 mt-1">Spin to pick a player, choose Truth or Dare, and write custom challenges!</p>
      </div>

      {/* Spin Area Container */}
      <div className="relative w-64 h-64 rounded-full border border-white/10 bg-slate-950/40 flex items-center justify-center shadow-inner">
        {/* Top Player Label (Friend) */}
        <div className={`absolute top-3 px-3 py-1 rounded-full text-xs font-bold transition-all ${
          todState !== "idle" && todState !== "spinning" && !isMeSelected
            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 scale-110 shadow-lg"
            : "text-white/60"
        }`}>
          {otherUserName}
        </div>

        {/* Spinning Bottle SVG */}
        <div 
          className="w-16 h-32 flex items-center justify-center transition-transform duration-[2000ms] ease-out select-none"
          style={{ transform: `rotate(${spinAngle}deg)` }}
        >
          <svg viewBox="0 0 100 200" className="w-full h-full text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">
            {/* Glass Bottle Outline */}
            <path
              d="M 42 15 
                 C 42 12, 58 12, 58 15 
                 L 58 35 
                 C 58 45, 68 55, 68 70 
                 L 68 175 
                 C 68 185, 32 185, 32 175 
                 L 32 70 
                 C 32 55, 42 45, 42 35 
                 Z"
              fill="#1e1538"
              stroke="#818cf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Label wrapper on bottle */}
            <rect x="36" y="90" width="28" height="40" rx="3" fill="#818cf8" opacity="0.8" />
            {/* Point arrow tip on bottle top */}
            <polygon points="50,2 45,10 55,10" fill="#f43f5e" />
          </svg>
        </div>

        {/* Bottom Player Label (Me) */}
        <div className={`absolute bottom-3 px-3 py-1 rounded-full text-xs font-bold transition-all ${
          todState !== "idle" && todState !== "spinning" && isMeSelected
            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 scale-110 shadow-lg"
            : "text-white/60"
        }`}>
          You
        </div>
      </div>

      {/* Control Status Console */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {todState === "idle" && (
          <button
            onClick={handleSpinClick}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-white"
          >
            Spin Bottle 🍾
          </button>
        )}

        {todState === "spinning" && (
          <div className="text-xs text-indigo-400 font-bold animate-pulse">
            Bottle is spinning... 🌀
          </div>
        )}

        {todState === "selected" && (
          <div className="flex flex-col items-center space-y-3 w-full">
            <span className="text-xs text-white/60">
              Bottle landed on: <strong className="text-rose-400">{selectedName}</strong>
            </span>
            
            {isMeSelected ? (
              <div className="flex gap-3 w-64">
                <button
                  onClick={() => onChoose("truth")}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/45 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Choose Truth 🤔
                </button>
                <button
                  onClick={() => onChoose("dare")}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 border border-rose-500/45 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Choose Dare ⚡
                </button>
              </div>
            ) : (
              <div className="text-xs text-white/40 italic">
                Waiting for {otherUserName} to choose Truth or Dare...
              </div>
            )}
          </div>
        )}

        {todState === "chosen" && (
          <div className="w-full px-2 flex flex-col items-center">
            {isMeSelected ? (
              <div className="text-xs text-white/60 text-center leading-relaxed">
                You chose <strong className="text-rose-400 uppercase">{choice}</strong>!<br />
                <span className="text-white/40 italic">Waiting for {otherUserName} to write your challenge...</span>
              </div>
            ) : (
              <form onSubmit={handlePromptSubmit} className="w-full flex flex-col space-y-2 items-center">
                <span className="text-xs text-white/70">
                  {otherUserName} chose <strong className="text-rose-400 uppercase">{choice}</strong>! Write a challenge:
                </span>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    required
                    placeholder={`Write a ${choice} challenge...`}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 p-2 px-3 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400/40 placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-95"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {todState === "promptWritten" && (
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="w-64 p-5 rounded-2xl bg-[#1e1333] border border-rose-500/20 shadow-2xl flex flex-col items-center text-center space-y-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                choice === "truth" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/35" : "bg-rose-500/20 text-rose-300 border border-rose-500/35"
              }`}>
                {selectedName}'s {choice}
              </span>
              <p className="text-xs leading-relaxed font-semibold italic text-white/90">
                "{promptText}"
              </p>
            </div>

            {isMeSelected ? (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <span>Done / Next Round</span>
              </button>
            ) : (
              <div className="text-xs text-white/40 italic">
                Waiting for {otherUserName} to complete the challenge...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
