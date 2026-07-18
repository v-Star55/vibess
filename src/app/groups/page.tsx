"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/store/store";
import { useSocket } from "@/src/hooks/useSocket";
import { Loader2, Sparkles, Trophy, Award, Lock, CheckCircle2 } from "lucide-react";
import { 
  getMyGPs, getGPDetails, sendGPMessage, leaveGP, 
  voteGPToKeep, checkGPConversionStatus, requestGPConversion,
  createGPIntervalPoll, voteGPIntervalPoll, deleteGPIntervalPoll,
  createGPChallenge, toggleGPChallengeCompletion, deleteGPChallenge
} from "../lib/api";

import GroupSidebar from "./components/GroupSidebar";
import ChatArea from "./components/ChatArea";
import ChatPlaceholder from "./components/ChatPlaceholder";

interface Member {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
}

interface Message {
  _id?: string;
  sender: any;
  text: string;
  isAnonymous?: boolean;
  createdAt: string;
}

interface GP {
  _id: string;
  gpName?: string;
  category: string;
  subType: string;
  specificName?: string;
  genre?: string;
  talkTopics: string[];
  description?: string;
  lookingFor?: string[];
  whoIsItFor?: string[];
  members: Member[];
  memberCount: number;
  maxMembers: number;
  expiresAt: string;
  timeLeft: number | null;
  status: string;
  isPermanent: boolean;
  messages?: Message[];
  permanentConversionVotes?: any[];
}

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { socket, connected } = useSocket();
  
  const [gps, setGps] = useState<GP[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [mutedRooms, setMutedRooms] = useState<string[]>([]);
  const [requestingConversion, setRequestingConversion] = useState(false);

  // Polls & Challenges States
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", "", ""]);

  const [challenges, setChallenges] = useState<any[]>([]);
  const [newChallengeText, setNewChallengeText] = useState("");
  const [hasSubmittedChallengeToday, setHasSubmittedChallengeToday] = useState(false);
  const [anonRemaining, setAnonRemaining] = useState(3);

  // Check challenge lock on mount/load
  useEffect(() => {
    if (!user?.id) return;
    const lastChallengeTime = localStorage.getItem(`lastChallengeTime_${user.id}`);
    if (lastChallengeTime) {
      const lastDate = new Date(lastChallengeTime);
      const today = new Date();
      if (lastDate.toDateString() === today.toDateString()) {
        setHasSubmittedChallengeToday(true);
      }
    }
  }, [user?.id]);

  const handleVotePoll = async (pollId: string, optionIdx: number) => {
    if (!user?.id || !selectedRoom?._id) return;
    try {
      const res = await voteGPIntervalPoll(selectedRoom._id, pollId, optionIdx);
      if (res.success) {
        setPolls(res.polls);
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            polls: res.polls
          });
        }
        toast.success("Vote recorded!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record vote");
    }
  };

  const handleCreatePoll = async () => {
    if (!newPollQuestion.trim() || !selectedRoom?._id) return;
    const validOptions = newPollOptions.filter(o => o.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }
    try {
      const res = await createGPIntervalPoll(selectedRoom._id, newPollQuestion, validOptions);
      if (res.success) {
        setPolls(res.polls);
        setNewPollQuestion("");
        setNewPollOptions(["", "", ""]);
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            polls: res.polls
          });
        }
        toast.success("Poll created successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!selectedRoom?._id) return;
    try {
      const res = await deleteGPIntervalPoll(selectedRoom._id, pollId);
      if (res.success) {
        setPolls(res.polls);
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            polls: res.polls
          });
        }
        toast.success("Poll removed successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete poll");
    }
  };

  const handleCreateChallenge = async () => {
    if (!newChallengeText.trim() || !selectedRoom?._id) return;
    if (hasSubmittedChallengeToday) {
      toast.error("You can only submit 1 challenge per day!");
      return;
    }
    try {
      const res = await createGPChallenge(selectedRoom._id, newChallengeText);
      if (res.success) {
        setChallenges(res.challenges);
        setNewChallengeText("");
        setHasSubmittedChallengeToday(true);
        if (user?.id) {
          localStorage.setItem(`lastChallengeTime_${user.id}`, new Date().toISOString());
        }
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            challenges: res.challenges
          });
        }
        toast.success("Challenge submitted for today!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit challenge");
    }
  };

  const handleToggleCompleteChallenge = async (chalId: string) => {
    if (!user?.id || !selectedRoom?._id) return;
    try {
      const res = await toggleGPChallengeCompletion(selectedRoom._id, chalId);
      if (res.success) {
        setChallenges(res.challenges);
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            challenges: res.challenges
          });
        }
        toast.success("Challenge status updated!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update challenge");
    }
  };

  const handleDeleteChallenge = async (chalId: string) => {
    if (!selectedRoom?._id) return;
    try {
      const res = await deleteGPChallenge(selectedRoom._id, chalId);
      if (res.success) {
        setChallenges(res.challenges);
        // Emit Socket event for real-time updates
        if (socket && connected) {
          socket.emit("polls-challenges-update", {
            chatId: selectedRoom._id,
            challenges: res.challenges
          });
        }
        toast.success("Challenge removed successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete challenge");
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const groupsRes = await getMyGPs();
        const groupsList = groupsRes.success ? (groupsRes.gps || []) : [];
        setGps(groupsList);

        // Retrieve muted list
        const savedMuted = localStorage.getItem("mutedGPIds");
        if (savedMuted) {
          setMutedRooms(JSON.parse(savedMuted));
        }

        // Auto-select first room or check params
        const params = new URLSearchParams(window.location.search);
        const gpId = params.get("gpId");

        if (gpId) {
          await loadGP(gpId);
        } else if (groupsList.length > 0) {
          await loadGP(groupsList[0]._id);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, router]);

  // Handle Socket.io events
  useEffect(() => {
    if (!socket || !connected || !selectedRoom?._id) return;

    const roomId = selectedRoom._id;
    socket.emit("join-room", roomId);

    const handleReceiveMessage = (data: any) => {
      if (data.chatId === roomId) {
        setSelectedRoom((prev: any) => {
          if (!prev) return prev;
          
          const messageId = data.message?._id?.toString() ?? data.message?.toString();
          const msgExists = prev.messages?.some((m: any) => {
            const mId = m._id?.toString() ?? m.toString();
            return mId === messageId;
          });
          if (msgExists) return prev;
          
          const updatedMessages = [...(prev.messages || []), data.message];
          
          setGps((prevGps) =>
            prevGps.map((g) => (g._id === roomId ? { ...g, messages: updatedMessages } : g))
          );

          return { ...prev, messages: updatedMessages };
        });
      }
    };

    const handleReceivePollsChallenges = (data: any) => {
      if (data.chatId === roomId) {
        if (data.polls) setPolls(data.polls);
        if (data.challenges) setChallenges(data.challenges);
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("polls-challenges-update", handleReceivePollsChallenges);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("polls-challenges-update", handleReceivePollsChallenges);
    };
  }, [socket, connected, selectedRoom?._id]);

  const loadGP = async (gpId: string) => {
    try {
      const res = await getGPDetails(gpId);
      if (res.success && res.gp) {
        const gpWithParticipants = {
          ...res.gp,
          participants: res.gp.members,
        };
        setSelectedRoom(gpWithParticipants);
        setPolls(res.gp.polls || []);
        setChallenges(res.gp.challenges || []);
        if (res.anonRemaining !== undefined) {
          setAnonRemaining(res.anonRemaining);
        }
        await loadConversionStatus(gpId);

        setGps((prev) =>
          prev.map((g) => (g._id === gpId ? { ...g, ...res.gp } : g))
        );
      }
    } catch (error: any) {
      console.error("Failed to load GP details", error);
      toast.error("Failed to load conversation details");
    }
  };

  const loadConversionStatus = async (gpId: string) => {
    try {
      const res = await checkGPConversionStatus(gpId);
      if (res.success) {
        setVoteStatus({
          isEligible: res.isEligible,
          isConversionEligible: res.isConversionEligible,
          voteResult: res.voteResult,
          userVote: res.userVote,
          isPermanent: res.isPermanent,
        });
      }
    } catch (err) {
      console.error("Error loading conversion status:", err);
    }
  };

  const handleSendMessage = async (isAnonymous?: boolean) => {
    if (!selectedRoom || !messageText.trim()) return;

    setSending(true);
    const originalText = messageText;
    try {
      const res = await sendGPMessage(selectedRoom._id, originalText, isAnonymous);
      if (res.success) {
        const gpWithParticipants = {
          ...res.gp,
          participants: res.gp.members,
        };
        setSelectedRoom(gpWithParticipants);
        setMessageText("");
        if (res.anonRemaining !== undefined) {
          setAnonRemaining(res.anonRemaining);
        }
        
        setGps((prev) =>
          prev.map((g) => (g._id === selectedRoom._id ? res.gp : g))
        );

        const newMsg = res.gp.messages[res.gp.messages.length - 1];
        if (socket && connected) {
          socket.emit("send-message", {
            chatId: selectedRoom._id,
            message: newMsg,
          });
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (vote: "yes" | "no") => {
    if (!selectedRoom) return;
    try {
      const res = await voteGPToKeep(selectedRoom._id, vote);
      if (res.success) {
        toast.success(`Recorded vote: ${vote === "yes" ? "Keep Room" : "Discard"}`);
        await loadConversionStatus(selectedRoom._id);
        if (res.converted) {
          toast.success("Hooray! This GP is now a Permanent room!");
          await loadGP(selectedRoom._id);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Voting failed");
    }
  };

  const handleRequestConversion = async () => {
    if (!selectedRoom) return;
    setRequestingConversion(true);
    try {
      const res = await requestGPConversion(selectedRoom._id);
      if (res.success) {
        toast.success("Conversion voting is now open to all members!");
        await loadConversionStatus(selectedRoom._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to open voting");
    } finally {
      setRequestingConversion(false);
    }
  };

  const handleLeave = async (gpId: string) => {
    if (leavingId) return;
    const confirmLeave = confirm("Are you sure you want to leave this GP? You will not receive any further messages.");
    if (!confirmLeave) return;

    setLeavingId(gpId);
    try {
      const res = await leaveGP(gpId);
      if (res.success) {
        toast.success("Successfully left the group");
        setGps((prev) => prev.filter((gp) => gp._id !== gpId));
        setSelectedRoom(null);
        setVoteStatus(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    } finally {
      setLeavingId(null);
    }
  };

  const toggleMuteRoom = (gpId: string) => {
    let updated;
    if (mutedRooms.includes(gpId)) {
      updated = mutedRooms.filter((id) => id !== gpId);
      toast.success("Notifications enabled");
    } else {
      updated = [...mutedRooms, gpId];
      toast.success("Notifications muted");
    }
    setMutedRooms(updated);
    localStorage.setItem("mutedGPIds", JSON.stringify(updated));
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Vibe GP": return "✨";
      case "Movie GP": return "🎬";
      case "Anime GP": return "🎌";
      case "Food & Cafe GP": return "☕";
      case "Fitness & Sports GP": return "💪";
      case "Travel GP": return "✈️";
      case "Hobbies & Creativity GP": return "🎨";
      case "Developer GP": return "💻";
      case "Study GP": return "📚";
      case "Relationship GP": return "❤️";
      default: return "💬";
    }
  };

  const getShortCategoryName = (category: string) => {
    switch (category) {
      case "Vibe GP": return "Vibe";
      case "Movie GP": return "Movie";
      case "Anime GP": return "Anime";
      case "Food & Cafe GP": return "Food";
      case "Fitness & Sports GP": return "Sports";
      case "Travel GP": return "Travel";
      case "Hobbies & Creativity GP": return "Creativity";
      case "Developer GP": return "Dev";
      case "Study GP": return "Study";
      case "Relationship GP": return "Hearts";
      case "Other GP": return "Other";
      default: return category;
    }
  };

  const getThemeColors = (category: string) => {
    switch (category) {
      case "Vibe GP":
        return {
          bg: "bg-[#0c021a]",
          accent: "from-pink-500/10 via-purple-600/10 to-indigo-500/10 border-pink-500/20",
          glow: "bg-pink-500/5",
          bubble: "bg-gradient-to-r from-pink-500 to-purple-600",
          textAccent: "text-pink-400",
          iconBg: "bg-pink-500/15 border-pink-500/20",
          borderAccent: "border-pink-500/20",
          btn: "from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-pink-500/15",
          barColor: "from-pink-500 to-purple-500",
        };
      case "Movie GP":
        return {
          bg: "bg-[#020d1a]",
          accent: "from-blue-500/10 via-cyan-600/10 to-teal-500/10 border-blue-500/20",
          glow: "bg-blue-500/5",
          bubble: "bg-gradient-to-r from-blue-500 to-cyan-600",
          textAccent: "text-blue-400",
          iconBg: "bg-blue-500/15 border-blue-500/20",
          borderAccent: "border-blue-500/20",
          btn: "from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-blue-500/15",
          barColor: "from-blue-500 to-cyan-500",
        };
      case "Anime GP":
        return {
          bg: "bg-[#140602]",
          accent: "from-orange-500/10 via-red-600/10 to-pink-500/10 border-orange-500/20",
          glow: "bg-orange-500/5",
          bubble: "bg-gradient-to-r from-orange-500 to-red-600",
          textAccent: "text-orange-400",
          iconBg: "bg-orange-500/15 border-orange-500/20",
          borderAccent: "border-orange-500/20",
          btn: "from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/15",
          barColor: "from-orange-500 to-red-550",
        };
      case "Food & Cafe GP":
        return {
          bg: "bg-[#120902]",
          accent: "from-amber-500/10 via-orange-600/10 to-red-500/10 border-amber-500/20",
          glow: "bg-amber-500/5",
          bubble: "bg-gradient-to-r from-amber-500 to-orange-600",
          textAccent: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/20",
          borderAccent: "border-amber-500/20",
          btn: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/15",
          barColor: "from-amber-500 to-orange-500",
        };
      case "Fitness & Sports GP":
        return {
          bg: "bg-[#02120b]",
          accent: "from-emerald-500/10 via-lime-600/10 to-green-500/10 border-emerald-500/20",
          glow: "bg-emerald-500/5",
          bubble: "bg-gradient-to-r from-emerald-500 to-green-600",
          textAccent: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/20",
          borderAccent: "border-emerald-500/20",
          btn: "from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/15",
          barColor: "from-emerald-500 to-green-500",
        };
      case "Travel GP":
        return {
          bg: "bg-[#020e18]",
          accent: "from-sky-500/10 via-blue-600/10 to-indigo-500/10 border-sky-500/20",
          glow: "bg-sky-500/5",
          bubble: "bg-gradient-to-r from-sky-500 to-blue-600",
          textAccent: "text-sky-400",
          iconBg: "bg-sky-500/15 border-sky-500/20",
          borderAccent: "border-sky-500/20",
          btn: "from-sky-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sky-500/15",
          barColor: "from-sky-500 to-blue-500",
        };
      case "Hobbies & Creativity GP":
        return {
          bg: "bg-[#120216]",
          accent: "from-fuchsia-500/10 via-purple-600/10 to-pink-500/10 border-fuchsia-500/20",
          glow: "bg-fuchsia-500/5",
          bubble: "bg-gradient-to-r from-fuchsia-500 to-pink-600",
          textAccent: "text-fuchsia-400",
          iconBg: "bg-fuchsia-500/15 border-fuchsia-500/20",
          borderAccent: "border-fuchsia-500/20",
          btn: "from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 shadow-fuchsia-500/15",
          barColor: "from-fuchsia-500 to-pink-500",
        };
      case "Developer GP":
        return {
          bg: "bg-[#021014]",
          accent: "from-teal-500/10 via-cyan-600/10 to-blue-500/10 border-teal-500/20",
          glow: "bg-teal-500/5",
          bubble: "bg-gradient-to-r from-teal-500 to-blue-600",
          textAccent: "text-teal-400",
          iconBg: "bg-teal-500/15 border-teal-500/20",
          borderAccent: "border-teal-500/20",
          btn: "from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-teal-500/15",
          barColor: "from-teal-500 to-blue-550",
        };
      case "Study GP":
        return {
          bg: "bg-[#08021c]",
          accent: "from-indigo-500/10 via-violet-600/10 to-purple-500/10 border-indigo-500/20",
          glow: "bg-indigo-500/5",
          bubble: "bg-gradient-to-r from-indigo-500 to-violet-600",
          textAccent: "text-indigo-400",
          iconBg: "bg-indigo-500/15 border-indigo-500/20",
          borderAccent: "border-indigo-500/20",
          btn: "from-indigo-500 to-violet-600 hover:from-indigo-650 hover:to-violet-750 shadow-indigo-500/15",
          barColor: "from-indigo-500 to-violet-500",
        };
      case "Relationship GP":
        return {
          bg: "bg-[#16020c]",
          accent: "from-rose-500/10 via-red-600/10 to-pink-500/10 border-rose-500/20",
          glow: "bg-rose-500/5",
          bubble: "bg-gradient-to-r from-rose-500 to-pink-600",
          textAccent: "text-rose-400",
          iconBg: "bg-rose-500/15 border-rose-500/20",
          borderAccent: "border-rose-500/20",
          btn: "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/15",
          barColor: "from-rose-500 to-pink-500",
        };
      default:
        return {
          bg: "bg-[#0b021c]",
          accent: "from-purple-500/10 via-pink-600/10 to-indigo-500/10 border-purple-500/20",
          glow: "bg-purple-500/5",
          bubble: "bg-gradient-to-r from-purple-500 to-pink-600",
          textAccent: "text-purple-400",
          iconBg: "bg-purple-500/15 border-purple-500/20",
          borderAccent: "border-purple-500/20",
          btn: "from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-purple-500/15",
          barColor: "from-purple-500 to-pink-500",
        };
    }
  };

  const getLastMessageText = (group: GP) => {
    if (!group.messages || group.messages.length === 0) {
      return group.description || "No messages yet";
    }
    const lastMsg = group.messages[group.messages.length - 1];
    const sender = lastMsg.sender;
    const senderName = sender?.name || (sender === user?.id ? "You" : "Member");
    return `${senderName}: ${lastMsg.text}`;
  };

  const getLastMessageTime = (group: GP) => {
    if (!group.messages || group.messages.length === 0) {
      return "";
    }
    const lastMsg = group.messages[group.messages.length - 1];
    return new Date(lastMsg.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasUserVoted = () => {
    if (voteStatus?.userVote) return voteStatus.userVote;
    if (!selectedRoom || !selectedRoom.permanentConversionVotes) return null;
    const voteObj = selectedRoom.permanentConversionVotes.find(
      (v: any) => (v.user?._id || v.user)?.toString() === user?.id
    );
    return voteObj ? voteObj.vote : null;
  };

  const getVotesSummary = () => {
    if (voteStatus?.voteResult) return voteStatus.voteResult;
    if (!selectedRoom || !selectedRoom.permanentConversionVotes) return { yesVotes: 0, totalVotes: 0, percentage: 0 };
    const yesVotes = selectedRoom.permanentConversionVotes.filter((v: any) => v.vote === "yes").length;
    const totalVotes = selectedRoom.permanentConversionVotes.length;
    const percentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
    return { yesVotes, totalVotes, percentage };
  };

  const getHoursActiveText = (startedAt: string) => {
    const now = new Date();
    const start = new Date(startedAt);
    const diff = now.getTime() - start.getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Active ${hrs}h ${mins}m`;
  };

  const activeTheme = selectedRoom ? getThemeColors(selectedRoom.category) : null;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#07011d]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#07011d] text-white">
      
      {/* Sidebar Panel */}
      <div className={`${selectedRoom ? "hidden md:flex" : "flex"} shrink-0 h-full w-full md:w-auto`}>
        <GroupSidebar
          gps={gps}
          selectedRoomId={selectedRoom?._id}
          onSelectRoom={loadGP}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          user={user}
          onBrowse={() => router.push("/app-home")}
          getCategoryIcon={getCategoryIcon}
          getShortCategoryName={getShortCategoryName}
          getThemeColors={getThemeColors}
          getLastMessageText={getLastMessageText}
          getLastMessageTime={getLastMessageTime}
          formatTimeRemaining={formatTimeRemaining}
          activeThemeBg={activeTheme ? activeTheme.bg : undefined}
        />
      </div>

      {/* Main Chat Workspace */}
      <main className={`${selectedRoom ? "flex" : "hidden md:flex"} flex-1 flex flex-col min-w-0 h-full relative z-10`}>
        {selectedRoom ? (
          <ChatArea
            selectedRoom={selectedRoom}
            user={user}
            sending={sending}
            messageText={messageText}
            setMessageText={setMessageText}
            handleSendMessage={handleSendMessage}
            anonRemaining={anonRemaining}
            leavingId={leavingId}
            handleLeave={handleLeave}
            voteStatus={voteStatus}
            handleVote={handleVote}
            requestingConversion={requestingConversion}
            handleRequestConversion={handleRequestConversion}
            isMuted={mutedRooms.includes(selectedRoom._id)}
            toggleMuteRoom={toggleMuteRoom}
            getThemeColors={getThemeColors}
            getCategoryIcon={getCategoryIcon}
            getShortCategoryName={getShortCategoryName}
            formatTimeRemaining={formatTimeRemaining}
            getHoursActiveText={getHoursActiveText}
            getVotesSummary={getVotesSummary}
            hasUserVoted={hasUserVoted}
            polls={polls}
            challenges={challenges}
            newPollQuestion={newPollQuestion}
            setNewPollQuestion={setNewPollQuestion}
            newPollOptions={newPollOptions}
            setNewPollOptions={setNewPollOptions}
            newChallengeText={newChallengeText}
            setNewChallengeText={setNewChallengeText}
            hasSubmittedChallengeToday={hasSubmittedChallengeToday}
            handleVotePoll={handleVotePoll}
            handleCreatePoll={handleCreatePoll}
            handleCreateChallenge={handleCreateChallenge}
            handleToggleCompleteChallenge={handleToggleCompleteChallenge}
            handleDeletePoll={handleDeletePoll}
            handleDeleteChallenge={handleDeleteChallenge}
            onBack={() => setSelectedRoom(null)}
          />
        ) : (
          <ChatPlaceholder onBrowse={() => router.push("/app-home")} />
        )}
      </main>

    </div>
  );
}
