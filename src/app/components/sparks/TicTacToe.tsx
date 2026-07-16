import { RefreshCw } from "lucide-react";

interface TicTacToeProps {
  board: string[];
  winner: string | null;
  turn: "X" | "O";
  myRole: "X" | "O";
  onClick: (idx: number) => void;
  onReset: () => void;
}

export default function TicTacToe({ board, winner, turn, myRole, onClick, onReset }: TicTacToeProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center space-y-6">
      <div className="text-center">
        <h5 className="text-sm font-extrabold tracking-wide uppercase text-indigo-400">Tic-Tac-Toe</h5>
        <p className="text-xs text-white/50 mt-1">
          {winner === "Draw" ? (
            <span className="text-amber-400 font-bold">It's a draw! 🤝</span>
          ) : winner ? (
            <span className="text-emerald-400 font-bold">
              Winner: {winner === myRole ? "You! 🎉" : "Friend 🤖"}
            </span>
          ) : (
            <span>
              Turn: <strong className="text-white font-black">{turn === myRole ? "Your Turn ( " + myRole + " )" : "Friend's Turn"}</strong>
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 w-64 h-64 shrink-0 bg-white/5 p-2 rounded-2xl border border-white/10">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => onClick(idx)}
            disabled={!!cell || !!winner || turn !== myRole}
            className={`text-3xl font-black rounded-xl border border-white/10 transition-all flex items-center justify-center select-none ${
              cell === "X"
                ? "text-indigo-400 bg-indigo-500/5"
                : cell === "O"
                ? "text-rose-400 bg-rose-500/5"
                : "bg-white/5 hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed"
            }`}
          >
            {cell}
          </button>
        ))}
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
