"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useSocket } from "@/src/hooks/useSocket";
import { toast } from "react-hot-toast";
import { getRandomQuickDrawWord } from "./sparks/quickDrawWords";

// Sub-components
import TicTacToe from "./sparks/TicTacToe";
import ConnectFour from "./sparks/ConnectFour";
import TruthOrDare from "./sparks/TruthOrDare";
import QuickDraw from "./sparks/QuickDraw";
import CoinFlip from "./sparks/CoinFlip";

interface SparksPanelProps {
  chatId: string | null;
  currentUser: any;
  otherUser: any;
  onClose: () => void;
}

export default function SparksPanel({
  chatId,
  currentUser,
  otherUser,
  onClose,
}: SparksPanelProps) {
  const { socket, connected } = useSocket();
  const [gameType, setGameType] = useState<null | "tictactoe" | "connectfour" | "truthordare" | "quickdraw" | "coinflip">(null);

  const currentUserId = currentUser?.id || currentUser?._id;
  const otherUserId = otherUser?._id?.toString() ?? otherUser?.toString();
  const otherUserName = otherUser?.name || "Friend";

  // Statically determine Player roles based on alphabetical sorting of User IDs
  const isPlayer1 = currentUserId < (otherUserId || "");
  const p1Role = "X";
  const p2Role = "O";
  const myRole = isPlayer1 ? p1Role : p2Role;
  
  const p1Color = "Red";
  const p2Color = "Yellow";
  const myColor = isPlayer1 ? p1Color : p2Color;

  const isIncomingEvent = useRef(false);

  // Truth or Dare (Spin the Bottle) state hooks
  const [todState, setTodState] = useState<"idle" | "spinning" | "selected" | "chosen" | "promptWritten">("idle");
  const [todSelectedUserId, setTodSelectedUserId] = useState<string | null>(null);
  const [todChoice, setTodChoice] = useState<"truth" | "dare" | null>(null);
  const [todPromptText, setTodPromptText] = useState("");
  const [todSpinAngle, setTodSpinAngle] = useState(0);

  // Tic-Tac-Toe state hooks
  const [tttBoard, setTttBoard] = useState<string[]>(Array(9).fill(""));
  const [tttTurn, setTttTurn] = useState<"X" | "O">("X");
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  // Connect Four state hooks
  const [c4Board, setC4Board] = useState<string[][]>(Array(6).fill(null).map(() => Array(7).fill("")));
  const [c4Turn, setC4Turn] = useState<"Red" | "Yellow">("Red");
  const [c4Winner, setC4Winner] = useState<string | null>(null);

  // Quick Draw state hooks
  const [qdWord, setQdWord] = useState("");
  const [qdStatus, setQdStatus] = useState<"playing" | "won" | "timeout">("playing");
  const [qdPaths, setQdPaths] = useState<Array<{ points: Array<{ x: number; y: number }>; color: string }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const qdCanvasRef = useRef<SVGSVGElement>(null);
  const [qdDrawerId, setQdDrawerId] = useState<string | null>(null);
  const [qdTimeLeft, setQdTimeLeft] = useState<number>(90);
  const [qdScores, setQdScores] = useState<Record<string, number>>({});
  const [qdColor, setQdColor] = useState("#6366f1");

  // Coin Flip state hooks
  const [cfState, setCfState] = useState<"idle" | "flipping" | "flipped">("idle");
  const [cfResult, setCfResult] = useState<"heads" | "tails" | null>(null);
  const [cfChoice, setCfChoice] = useState<"heads" | "tails" | null>(null);
  const [cfGuesserId, setCfGuesserId] = useState<string | null>(null);
  const [cfFlipperId, setCfFlipperId] = useState<string | null>(null);

  // Send a sync request only when chatId or currentUserId changes
  useEffect(() => {
    if (!chatId || !socket || !connected) return;
    socket.emit("sparksSyncRequest", { chatId, requesterId: currentUserId });
  }, [chatId, currentUserId, socket, connected]);

  useEffect(() => {
    if (!chatId || !socket || !connected) return;

    const handleSparksState = (data: any) => {
      if (data.senderId === currentUserId) return;
      isIncomingEvent.current = true;

      if (data.action === "START") {
        setGameType(data.gameType);
        if (data.gameType === "tictactoe") {
          setTttBoard(data.state.board);
          setTttTurn(data.state.turn);
          setTttWinner(data.state.winner);
        } else if (data.gameType === "connectfour") {
          setC4Board(data.state.board);
          setC4Turn(data.state.turn);
          setC4Winner(data.state.winner);
        } else if (data.gameType === "truthordare") {
          setTodState(data.state.todState);
          setTodSelectedUserId(data.state.selectedUserId);
          setTodChoice(data.state.choice);
          setTodPromptText(data.state.promptText);
          setTodSpinAngle(data.state.spinAngle);
        } else if (data.gameType === "quickdraw") {
          setQdWord(data.state.word);
          setQdStatus(data.state.status);
          setQdPaths(data.state.paths);
          setQdDrawerId(data.state.drawerId);
          setQdTimeLeft(data.state.timeLeft);
          setQdScores(data.state.scores || {});
        } else if (data.gameType === "coinflip") {
          setCfState(data.state.cfState);
          setCfResult(data.state.result);
          setCfChoice(data.state.choice);
          setCfGuesserId(data.state.guesserId);
          setCfFlipperId(data.state.flipperId);
        }
      } else if (data.action === "MOVE") {
        if (data.gameType === "tictactoe") {
          setTttBoard(data.state.board);
          setTttTurn(data.state.turn);
          setTttWinner(data.state.winner);
        } else if (data.gameType === "connectfour") {
          setC4Board(data.state.board);
          setC4Turn(data.state.turn);
          setC4Winner(data.state.winner);
        }
      } else if (data.action === "TOD_SPIN") {
        setTodState("spinning");
        setTodSelectedUserId(data.selectedId);
        setTodSpinAngle(data.angle);
        setTimeout(() => {
          setTodState("selected");
        }, 2000);
      } else if (data.action === "TOD_CHOOSE") {
        setTodState("chosen");
        setTodChoice(data.choice);
      } else if (data.action === "TOD_SUBMIT_PROMPT") {
        setTodState("promptWritten");
        setTodPromptText(data.promptText);
      } else if (data.action === "TOD_RESET") {
        setTodState("idle");
        setTodSelectedUserId(null);
        setTodChoice(null);
        setTodPromptText("");
        setTodSpinAngle(0);
      } else if (data.action === "QD_DRAW") {
        setQdPaths(data.paths);
      } else if (data.action === "QD_GUESS_WIN") {
        setQdStatus("won");
        setQdScores(data.scores || {});
        toast.success(`Friend guessed the word correctly: "${data.word}"!`);
      } else if (data.action === "QD_TIMEOUT") {
        setQdStatus("timeout");
        toast.error(`Time's up! The word was "${data.word}".`);
      } else if (data.action === "QD_TICK") {
        setQdTimeLeft(data.timeLeft);
      } else if (data.action === "QD_NEXT_TURN") {
        setQdWord(data.state.word);
        setQdStatus(data.state.status);
        setQdPaths(data.state.paths);
        setQdDrawerId(data.state.drawerId);
        setQdTimeLeft(data.state.timeLeft);
      } else if (data.action === "CF_GUESS") {
        setCfChoice(data.choice);
        setCfGuesserId(data.guesserId);
      } else if (data.action === "CF_FLIP") {
        setCfState("flipping");
        setCfResult(data.result);
        setCfFlipperId(data.flipperId);
      } else if (data.action === "CF_RESET") {
        setCfState("idle");
        setCfResult(null);
        setCfChoice(null);
        setCfGuesserId(null);
        setCfFlipperId(null);
      } else if (data.action === "CLOSE") {
        setGameType(null);
        setQdScores({});
        toast("Friend closed the active game", { icon: "🏁" });
      }
    };

    const handleSyncRequest = (data: any) => {
      if (data.requesterId === currentUserId) return;

      // Respond with active game configurations
      let state: any = {};
      if (gameType === "tictactoe") {
        state = { board: tttBoard, turn: tttTurn, winner: tttWinner };
      } else if (gameType === "connectfour") {
        state = { board: c4Board, turn: c4Turn, winner: c4Winner };
      } else if (gameType === "truthordare") {
        state = { 
          todState, 
          selectedUserId: todSelectedUserId, 
          choice: todChoice, 
          promptText: todPromptText, 
          spinAngle: todSpinAngle 
        };
      } else if (gameType === "quickdraw") {
        state = { 
          word: qdWord, 
          status: qdStatus, 
          paths: qdPaths, 
          drawerId: qdDrawerId, 
          timeLeft: qdTimeLeft, 
          scores: qdScores 
        };
      } else if (gameType === "coinflip") {
        state = {
          cfState,
          result: cfResult,
          choice: cfChoice,
          guesserId: cfGuesserId,
          flipperId: cfFlipperId
        };
      }

      socket.emit("sparksSyncResponse", {
        chatId,
        gameType,
        state,
        responderId: currentUserId,
      });
    };

    const handleSyncResponse = (data: any) => {
      if (data.responderId === currentUserId) return;
      if (!data.gameType) return;

      isIncomingEvent.current = true;
      setGameType(data.gameType);
      if (data.gameType === "tictactoe") {
        setTttBoard(data.state.board);
        setTttTurn(data.state.turn);
        setTttWinner(data.state.winner);
      } else if (data.gameType === "connectfour") {
        setC4Board(data.state.board);
        setC4Turn(data.state.turn);
        setC4Winner(data.state.winner);
      } else if (data.gameType === "truthordare") {
        setTodState(data.state.todState);
        setTodSelectedUserId(data.state.selectedUserId);
        setTodChoice(data.state.choice);
        setTodPromptText(data.state.promptText);
        setTodSpinAngle(data.state.spinAngle);
      } else if (data.gameType === "quickdraw") {
        setQdWord(data.state.word);
        setQdStatus(data.state.status);
        setQdPaths(data.state.paths);
        setQdDrawerId(data.state.drawerId);
        setQdTimeLeft(data.state.timeLeft);
        setQdScores(data.state.scores || {});
      } else if (data.gameType === "coinflip") {
        setCfState(data.state.cfState);
        setCfResult(data.state.result);
        setCfChoice(data.state.choice);
        setCfGuesserId(data.state.guesserId);
        setCfFlipperId(data.state.flipperId);
      }
    };

    socket.on("sparksStateUpdate", handleSparksState);
    socket.on("sparksSyncRequested", handleSyncRequest);
    socket.on("sparksSyncResponded", handleSyncResponse);

    return () => {
      socket.off("sparksStateUpdate", handleSparksState);
      socket.off("sparksSyncRequested", handleSyncRequest);
      socket.off("sparksSyncResponded", handleSyncResponse);
    };
  }, [socket, connected, chatId, currentUserId, gameType, todState, todSelectedUserId, todChoice, todPromptText, todSpinAngle, qdWord, qdStatus, qdPaths, qdDrawerId, qdTimeLeft, qdScores, otherUserId, cfState, cfResult, cfChoice, cfGuesserId, cfFlipperId]);

  const selectGame = (type: typeof gameType) => {
    if (!socket || !connected) return;
    setGameType(type);
    let initialState: any = {};
    if (type === "tictactoe") {
      initialState = { board: Array(9).fill(""), turn: "X", winner: null };
      setTttBoard(initialState.board);
      setTttTurn(initialState.turn);
      setTttWinner(null);
    } else if (type === "connectfour") {
      initialState = { board: Array(6).fill(null).map(() => Array(7).fill("")), turn: "Red", winner: null };
      setC4Board(initialState.board);
      setC4Turn(initialState.turn);
      setC4Winner(null);
    } else if (type === "truthordare") {
      initialState = { 
        todState: "idle", 
        selectedUserId: null, 
        choice: null, 
        promptText: "", 
        spinAngle: 0 
      };
      setTodState("idle");
      setTodSelectedUserId(null);
      setTodChoice(null);
      setTodPromptText("");
      setTodSpinAngle(0);
    } else if (type === "quickdraw") {
      // Pick a random word (Drawer holds the word)
      const rWord = getRandomQuickDrawWord();
      const initialDrawerId = isPlayer1 ? currentUserId : (otherUserId || "");
      initialState = { 
        word: rWord, 
        status: "playing", 
        paths: [],
        drawerId: initialDrawerId,
        timeLeft: 90,
        scores: {},
      };
      setQdWord(rWord);
      setQdStatus("playing");
      setQdPaths([]);
      setQdDrawerId(initialDrawerId);
      setQdTimeLeft(90);
      setQdScores({});
    } else if (type === "coinflip") {
      initialState = {
        cfState: "idle",
        result: null,
        choice: null,
        guesserId: null,
        flipperId: null,
      };
      setCfState("idle");
      setCfResult(null);
      setCfChoice(null);
      setCfGuesserId(null);
      setCfFlipperId(null);
    }

    socket.emit("sparksEvent", {
      chatId,
      action: "START",
      gameType: type,
      state: initialState,
      senderId: currentUserId,
    });
  };

  const closeGame = () => {
    if (!socket || !connected) {
      onClose();
      return;
    }
    setGameType(null);
    setQdScores({});
    setCfState("idle");
    setCfResult(null);
    setCfChoice(null);
    setCfGuesserId(null);
    setCfFlipperId(null);
    socket.emit("sparksEvent", {
      chatId,
      action: "CLOSE",
      senderId: currentUserId,
    });
    onClose();
  };

  // -------------------------------------------------------------
  // COIN FLIP ACTIONS
  // -------------------------------------------------------------
  const handleCfGuess = (choice: "heads" | "tails") => {
    if (!socket || !connected) return;
    setCfChoice(choice);
    setCfGuesserId(currentUserId);
    socket.emit("sparksEvent", {
      chatId,
      action: "CF_GUESS",
      choice,
      guesserId: currentUserId,
      senderId: currentUserId,
    });
  };

  const handleCfFlip = (result: "heads" | "tails") => {
    if (!socket || !connected) return;
    setCfState("flipping");
    setCfResult(result);
    setCfFlipperId(currentUserId);
    socket.emit("sparksEvent", {
      chatId,
      action: "CF_FLIP",
      result,
      flipperId: currentUserId,
      senderId: currentUserId,
    });
  };

  const handleCfReset = () => {
    if (!socket || !connected) return;
    setCfState("idle");
    setCfResult(null);
    setCfChoice(null);
    setCfGuesserId(null);
    setCfFlipperId(null);
    socket.emit("sparksEvent", {
      chatId,
      action: "CF_RESET",
      senderId: currentUserId,
    });
  };

  // -------------------------------------------------------------
  // TIC TAC TOE ACTIONS
  // -------------------------------------------------------------
  const checkTttWinner = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]            // Diag
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== "")) return "Draw";
    return null;
  };

  const handleTttClick = (idx: number) => {
    if (!socket || !connected || tttBoard[idx] || tttWinner || tttTurn !== myRole) return;

    const newBoard = [...tttBoard];
    newBoard[idx] = myRole;
    const winner = checkTttWinner(newBoard);
    const nextTurn = myRole === "X" ? "O" : "X";

    setTttBoard(newBoard);
    setTttTurn(nextTurn);
    setTttWinner(winner);

    socket.emit("sparksEvent", {
      chatId,
      action: "MOVE",
      gameType: "tictactoe",
      state: { board: newBoard, turn: nextTurn, winner },
      senderId: currentUserId,
    });
  };

  // -------------------------------------------------------------
  // CONNECT FOUR ACTIONS
  // -------------------------------------------------------------
  const checkC4Winner = (board: string[][]) => {
    const rows = 6;
    const cols = 7;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 3; c++) {
        const val = board[r][c];
        if (val && val === board[r][c+1] && val === board[r][c+2] && val === board[r][c+3]) return val;
      }
    }
    for (let r = 0; r < rows - 3; r++) {
      for (let c = 0; c < cols; c++) {
        const val = board[r][c];
        if (val && val === board[r+1][c] && val === board[r+2][c] && val === board[r+3][c]) return val;
      }
    }
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c < cols - 3; c++) {
        const val = board[r][c];
        if (val && val === board[r-1][c+1] && val === board[r-2][c+2] && val === board[r-3][c+3]) return val;
      }
    }
    for (let r = 0; r < rows - 3; r++) {
      for (let c = 0; c < cols - 3; c++) {
        const val = board[r][c];
        if (val && val === board[r+1][c+1] && val === board[r+2][c+2] && val === board[r+3][c+3]) return val;
      }
    }
    if (board.every(row => row.every(cell => cell !== ""))) return "Draw";
    return null;
  };

  const handleC4Click = (colIdx: number) => {
    if (!socket || !connected || c4Winner || c4Turn !== myColor) return;

    let rowIdx = -1;
    for (let r = 5; r >= 0; r--) {
      if (c4Board[r][colIdx] === "") {
        rowIdx = r;
        break;
      }
    }

    if (rowIdx === -1) return;

    const newBoard = c4Board.map(row => [...row]);
    newBoard[rowIdx][colIdx] = myColor;
    const winner = checkC4Winner(newBoard);
    const nextTurn = myColor === "Red" ? "Yellow" : "Red";

    setC4Board(newBoard);
    setC4Turn(nextTurn);
    setC4Winner(winner);

    socket.emit("sparksEvent", {
      chatId,
      action: "MOVE",
      gameType: "connectfour",
      state: { board: newBoard, turn: nextTurn, winner },
      senderId: currentUserId,
    });
  };

  // -------------------------------------------------------------
  // TRUTH OR DARE ACTIONS
  // -------------------------------------------------------------
  const handleTodSpin = (selectedId: string, angle: number) => {
    if (!socket || !connected) return;
    setTodState("spinning");
    setTodSelectedUserId(selectedId);
    setTodSpinAngle(angle);

    socket.emit("sparksEvent", {
      chatId,
      action: "TOD_SPIN",
      selectedId,
      angle,
      senderId: currentUserId,
    });

    setTimeout(() => {
      setTodState("selected");
    }, 2000);
  };

  const handleTodChoose = (choice: "truth" | "dare") => {
    if (!socket || !connected) return;
    setTodState("chosen");
    setTodChoice(choice);

    socket.emit("sparksEvent", {
      chatId,
      action: "TOD_CHOOSE",
      choice,
      senderId: currentUserId,
    });
  };

  const handleTodSubmitPrompt = (promptText: string) => {
    if (!socket || !connected) return;
    setTodState("promptWritten");
    setTodPromptText(promptText);

    socket.emit("sparksEvent", {
      chatId,
      action: "TOD_SUBMIT_PROMPT",
      promptText,
      senderId: currentUserId,
    });
  };

  const handleTodReset = () => {
    if (!socket || !connected) return;
    setTodState("idle");
    setTodSelectedUserId(null);
    setTodChoice(null);
    setTodPromptText("");
    setTodSpinAngle(0);

    socket.emit("sparksEvent", {
      chatId,
      action: "TOD_RESET",
      senderId: currentUserId,
    });
  };

  // -------------------------------------------------------------
  // QUICK DRAW ACTIONS
  // -------------------------------------------------------------
  const isDrawer = qdDrawerId ? qdDrawerId === currentUserId : isPlayer1;

  useEffect(() => {
    if (gameType !== "quickdraw" || qdStatus !== "playing" || !socket || !connected) return;
    if (!isDrawer) return;

    const timer = setInterval(() => {
      setQdTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQdStatus("timeout");
          socket.emit("sparksEvent", {
            chatId,
            action: "QD_TIMEOUT",
            word: qdWord,
            senderId: currentUserId,
          });
          toast.error(`Time's up! The word was "${qdWord}".`);
          return 0;
        }
        const nextTime = prev - 1;
        socket.emit("sparksEvent", {
          chatId,
          action: "QD_TICK",
          timeLeft: nextTime,
          senderId: currentUserId,
        });
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameType, qdStatus, isDrawer, qdWord, qdDrawerId, socket, connected, chatId, currentUserId]);

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawer || qdStatus !== "playing") return;
    setIsDrawing(true);
    const rect = qdCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPaths = [...qdPaths, { points: [{ x, y }], color: qdColor }];
    setQdPaths(newPaths);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawer || !isDrawing || qdStatus !== "playing" || qdPaths.length === 0 || !socket || !connected) return;
    const rect = qdCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPaths = [...qdPaths];
    const currentPath = newPaths[newPaths.length - 1];
    currentPath.points.push({ x, y });

    setQdPaths(newPaths);

    socket.emit("sparksEvent", {
      chatId,
      action: "QD_DRAW",
      paths: newPaths,
      senderId: currentUserId,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleQdGuessSubmit = (guess: string) => {
    if (!socket || !connected) return;
    if (guess.trim().toLowerCase() === qdWord.toLowerCase()) {
      const newScores = { ...qdScores };
      newScores[currentUserId] = (newScores[currentUserId] || 0) + 10;
      if (otherUserId) {
        newScores[otherUserId] = (newScores[otherUserId] || 0) + 5;
      }

      setQdScores(newScores);
      setQdStatus("won");
      socket.emit("sparksEvent", {
        chatId,
        action: "QD_GUESS_WIN",
        word: qdWord,
        scores: newScores,
        senderId: currentUserId,
      });
      toast.success("Correct! You guessed the word!");
    } else {
      toast.error("Wrong guess! Try again.");
    }
  };

  const handleQdReset = () => {
    if (!socket || !connected) return;
    const rWord = getRandomQuickDrawWord();
    const nextDrawerId = qdDrawerId === currentUserId ? (otherUserId || "") : currentUserId;

    setQdWord(rWord);
    setQdStatus("playing");
    setQdPaths([]);
    setQdDrawerId(nextDrawerId);
    setQdTimeLeft(90);

    socket.emit("sparksEvent", {
      chatId,
      action: "QD_NEXT_TURN",
      state: { 
        word: rWord, 
        status: "playing", 
        paths: [], 
        drawerId: nextDrawerId, 
        timeLeft: 90 
      },
      senderId: currentUserId,
    });
  };

  const GAME_LABELS: Record<string, string> = {
    tictactoe: "Tic-Tac-Toe",
    connectfour: "Connect Four",
    truthordare: "Truth or Dare",
    quickdraw: "Quick Draw",
    coinflip: "Coin Flip",
  };

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden text-white"
      style={{
        background: "linear-gradient(160deg, #100c20 0%, #0e0b1c 60%, #110d22 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px 0 0 20px",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.10)",
      }}
    >
        
        {/* Ambient glow blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-32 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))", border: "1px solid rgba(99,102,241,0.4)" }}
            >
              ⚡
            </div>
            <div>
              <h3 className="font-black text-sm tracking-widest" style={{ background: "linear-gradient(90deg, #a5b4fc, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SPARKS
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-white/30 font-medium tracking-wide">Live with {otherUserName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Workspace Game Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative z-10 min-h-0 w-full" style={{ padding: "16px 20px 20px" }}>
          {!gameType ? (
            /* Game Selection Hub */
            <div className="w-full flex flex-col gap-4">

              {/* Intro row */}
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎮</div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-tight">Pick a Spark</h4>
                  <p className="text-[10px] text-white/35 mt-0.5">Real-time mini-games with {otherUserName}</p>
                </div>
              </div>

              {/* 2x2 Game Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <GameCard emoji="❌" label="Tic-Tac-Toe" sub="Classic 3-in-a-row"
                  from="rgba(99,102,241,0.18)" to="rgba(139,92,246,0.08)"
                  glow="rgba(99,102,241,0.45)" border="rgba(99,102,241,0.3)"
                  hoverFrom="rgba(99,102,241,0.32)" hoverTo="rgba(139,92,246,0.18)"
                  onClick={() => selectGame("tictactoe")} />

                <GameCard emoji="🔴" label="Connect Four" sub="Drop 4 in a line"
                  from="rgba(168,85,247,0.18)" to="rgba(217,70,239,0.08)"
                  glow="rgba(168,85,247,0.45)" border="rgba(168,85,247,0.3)"
                  hoverFrom="rgba(168,85,247,0.32)" hoverTo="rgba(217,70,239,0.18)"
                  onClick={() => selectGame("connectfour")} />

                <GameCard emoji="🍾" label="Truth or Dare" sub="Spin the bottle"
                  from="rgba(244,63,94,0.18)" to="rgba(251,113,133,0.08)"
                  glow="rgba(244,63,94,0.45)" border="rgba(244,63,94,0.3)"
                  hoverFrom="rgba(244,63,94,0.32)" hoverTo="rgba(251,113,133,0.18)"
                  onClick={() => selectGame("truthordare")} />

                <GameCard emoji="🎨" label="Quick Draw" sub="Draw & guess"
                  from="rgba(245,158,11,0.18)" to="rgba(251,191,36,0.08)"
                  glow="rgba(245,158,11,0.45)" border="rgba(245,158,11,0.3)"
                  hoverFrom="rgba(245,158,11,0.32)" hoverTo="rgba(251,191,36,0.18)"
                  onClick={() => selectGame("quickdraw")} />
              </div>

              {/* Coin Flip — full width */}
              <button
                onClick={() => selectGame("coinflip")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(245,158,11,0.10) 100%)",
                  border: "1px solid rgba(251,146,60,0.3)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(251,146,60,0.30) 0%, rgba(245,158,11,0.18) 100%)")}
                onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(245,158,11,0.10) 100%)")}
              >
                <span className="text-2xl">🪙</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Coin Flip</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Heads or Tails — test your luck</p>
                </div>
                <span className="ml-auto text-white/20 text-sm">→</span>
              </button>

            </div>
          ) : (
            /* Active Game Screen */
            <div className="w-full flex flex-col gap-3">
              {/* Active game sub-header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={closeGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  ← Back
                </button>
                <span className="text-xs font-black text-white/80 tracking-wide">{gameType ? GAME_LABELS[gameType] : ""}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl overflow-y-auto w-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px" }}>
                
                {/* Active Game: Tic-Tac-Toe */}
                {gameType === "tictactoe" && (
                  <TicTacToe
                    board={tttBoard}
                    winner={tttWinner}
                    turn={tttTurn}
                    myRole={myRole}
                    onClick={handleTttClick}
                    onReset={() => selectGame("tictactoe")}
                  />
                )}

                {/* Active Game: Connect Four */}
                {gameType === "connectfour" && (
                  <ConnectFour
                    board={c4Board}
                    winner={c4Winner}
                    turn={c4Turn}
                    myColor={myColor}
                    onClick={handleC4Click}
                    onReset={() => selectGame("connectfour")}
                  />
                )}

                {/* Active Game: Truth or Dare */}
                {gameType === "truthordare" && (
                  <TruthOrDare
                    todState={todState}
                    selectedUserId={todSelectedUserId}
                    choice={todChoice}
                    promptText={todPromptText}
                    spinAngle={todSpinAngle}
                    currentUserId={currentUserId}
                    otherUserId={otherUserId}
                    otherUserName={otherUserName}
                    onSpin={handleTodSpin}
                    onChoose={handleTodChoose}
                    onSubmitPrompt={handleTodSubmitPrompt}
                    onReset={handleTodReset}
                  />
                )}

                {/* Active Game: Quick Draw */}
                {gameType === "quickdraw" && (
                  <QuickDraw
                    word={qdWord}
                    status={qdStatus}
                    paths={qdPaths}
                    isDrawer={isDrawer}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onGuessSubmit={handleQdGuessSubmit}
                    onReset={handleQdReset}
                    canvasRef={qdCanvasRef}
                    timeLeft={qdTimeLeft}
                    scores={qdScores}
                    currentUserId={currentUserId}
                    otherUserId={otherUserId}
                    otherUserName={otherUserName}
                    activeColor={qdColor}
                    onChangeColor={setQdColor}
                  />
                )}

                {/* Active Game: Coin Flip */}
                {gameType === "coinflip" && (
                  <CoinFlip
                    cfState={cfState}
                    cfResult={cfResult}
                    cfChoice={cfChoice}
                    cfGuesserId={cfGuesserId}
                    cfFlipperId={cfFlipperId}
                    currentUserId={currentUserId}
                    otherUserName={otherUserName}
                    onGuess={handleCfGuess}
                    onFlip={handleCfFlip}
                    onReset={handleCfReset}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

function GameCard({
  emoji, label, sub, from, to, glow, border, hoverFrom, hoverTo, onClick
}: {
  emoji: string; label: string; sub: string;
  from: string; to: string; glow: string; border: string;
  hoverFrom: string; hoverTo: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-start gap-1.5 px-4 py-4 rounded-2xl cursor-pointer overflow-hidden transition-all duration-200 w-full active:scale-95"
      style={{
        background: `linear-gradient(145deg, ${hovered ? hoverFrom : from} 0%, ${hovered ? hoverTo : to} 100%)`,
        border: `1px solid ${hovered ? border : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? `0 0 24px ${glow}, 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)` : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Shine top line */}
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)`, opacity: hovered ? 0.8 : 0 }} />

      <span className="text-2xl" style={{ transform: hovered ? "scale(1.15)" : "scale(1)", display: "inline-block", transition: "transform 200ms" }}>{emoji}</span>
      <div>
        <p className="text-xs font-black text-white leading-tight">{label}</p>
        <p className="text-[9px] text-white/35 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}
