import { RefreshCw } from "lucide-react";

interface ConnectFourProps {
  board: string[][];
  winner: string | null;
  turn: "Red" | "Yellow";
  myColor: "Red" | "Yellow";
  onClick: (colIdx: number) => void;
  onReset: () => void;
}

export default function ConnectFour({ board, winner, turn, myColor, onClick, onReset }: ConnectFourProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center space-y-6">
      <div className="text-center">
        <h5 className="text-sm font-extrabold tracking-wide uppercase text-purple-400">Connect Four</h5>
        <p className="text-xs text-white/50 mt-1">
          {winner === "Draw" ? (
            <span className="text-amber-400 font-bold">Draw Game! 🤝</span>
          ) : winner ? (
            <span className="text-emerald-400 font-bold">
              Winner: {winner === myColor ? "You! 🎉" : "Friend 🤖"}
            </span>
          ) : (
            <span>
              Turn: <strong className="text-white font-black">{turn === myColor ? "Your Turn (" + myColor + ")" : "Friend's Turn"}</strong>
            </span>
          )}
        </p>
      </div>

      {/* Connect Four Grid */}
      <div className="flex flex-col bg-[#160f29] border border-white/15 p-3 rounded-2xl shadow-xl w-72 shrink-0">
        <div className="grid grid-cols-7 gap-1">
          {/* Column clickable handles */}
          {Array(7).fill(null).map((_, colIdx) => (
            <button
              key={colIdx}
              onClick={() => onClick(colIdx)}
              disabled={!!winner || turn !== myColor}
              className="h-6 rounded-md bg-white/5 hover:bg-indigo-500/20 active:bg-indigo-500/40 border border-white/5 flex items-center justify-center text-[10px] font-bold cursor-pointer disabled:cursor-not-allowed text-indigo-400 disabled:opacity-30"
            >
              ↓
            </button>
          ))}
        </div>
        {/* Rows */}
        <div className="grid grid-rows-6 gap-1 mt-2">
          {board.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-7 gap-1">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className="aspect-square rounded-full border border-white/10 flex items-center justify-center bg-[#0d071b]"
                >
                  {cell && (
                    <div
                      className={`w-[85%] h-[85%] rounded-full shadow-inner animate-in zoom-in-50 duration-200 ${
                        cell === "Red"
                          ? "bg-gradient-to-br from-rose-500 to-red-600 border border-red-400"
                          : "bg-gradient-to-br from-yellow-400 to-amber-500 border border-yellow-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer shrink-0"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reset Game</span>
      </button>
    </div>
  );
}
