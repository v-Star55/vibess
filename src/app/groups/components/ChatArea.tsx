"use client";

import React, { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  Clock, BellOff, Bell, LogOut, Lock, MessageCircle, 
  Sparkles, Trophy, Award, Plus, Paperclip, Send, Loader2, ArrowRight, CheckCircle2, ChevronDown, ChevronUp,
  Trash2, Ghost
} from "lucide-react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/src/components/ui/drawer";

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

interface ChatRoom {
  _id: string;
  gpName?: string;
  category: string;
  subType: string;
  specificName?: string;
  startedAt: string;
  expiresAt: string;
  isPermanent: boolean;
  createdBy: any;
  moderator?: any;
  participants: Member[];
  messages: Message[];
  permanentConversionVotes?: any[];
}

interface ChatAreaProps {
  selectedRoom: ChatRoom;
  user: any;
  sending: boolean;
  messageText: string;
  setMessageText: (val: string) => void;
  handleSendMessage: (isAnonymous?: boolean) => void;
  anonRemaining?: number;
  leavingId: string | null;
  handleLeave: (gpId: string) => void;
  voteStatus: any;
  handleVote: (vote: "yes" | "no") => void;
  requestingConversion: boolean;
  handleRequestConversion: () => void;
  isMuted: boolean;
  toggleMuteRoom: (gpId: string) => void;
  getThemeColors: (category: string) => any;
  getCategoryIcon: (category: string) => string;
  getShortCategoryName: (category: string) => string;
  formatTimeRemaining: (expiresAt: string) => string;
  getHoursActiveText: (startedAt: string) => string;
  getVotesSummary: () => { yesVotes: number; totalVotes: number; percentage: number };
  hasUserVoted: () => "yes" | "no" | null;
  polls: any[];
  challenges: any[];
  newPollQuestion: string;
  setNewPollQuestion: (val: string) => void;
  newPollOptions: string[];
  setNewPollOptions: (val: string[]) => void;
  newChallengeText: string;
  setNewChallengeText: (val: string) => void;
  hasSubmittedChallengeToday: boolean;
  handleVotePoll: (pollId: string, optionIdx: number) => void;
  handleCreatePoll: () => void;
  handleCreateChallenge: () => void;
  handleToggleCompleteChallenge: (chalId: string) => void;
  handleDeletePoll: (pollId: string) => void;
  handleDeleteChallenge: (chalId: string) => void;
}

export default function ChatArea({
  selectedRoom,
  user,
  sending,
  messageText,
  setMessageText,
  handleSendMessage,
  anonRemaining = 3,
  leavingId,
  handleLeave,
  voteStatus,
  handleVote,
  requestingConversion,
  handleRequestConversion,
  isMuted,
  toggleMuteRoom,
  getThemeColors,
  getCategoryIcon,
  getShortCategoryName,
  formatTimeRemaining,
  getHoursActiveText,
  getVotesSummary,
  hasUserVoted,
  polls,
  challenges,
  newPollQuestion,
  setNewPollQuestion,
  newPollOptions,
  setNewPollOptions,
  newChallengeText,
  setNewChallengeText,
  hasSubmittedChallengeToday,
  handleVotePoll,
  handleCreatePoll,
  handleCreateChallenge,
  handleToggleCompleteChallenge,
  handleDeletePoll,
  handleDeleteChallenge,
}: ChatAreaProps) {
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [loungeExpanded, setLoungeExpanded] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState<"none" | "poll" | "challenge">("none");
  const isMobile = useIsMobile();
  const swipeDirection = isMobile ? "down" : "right";
  const [pollsOpen, setPollsOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const onSend = async () => {
    if (!messageText.trim() || sending) return;
    const wasAnonymous = isAnonymous;
    await handleSendMessage(wasAnonymous);
    setIsAnonymous(false);
  };

  useEffect(() => {
    setPollsOpen(false);
    setChallengesOpen(false);
    setShowCreateForm("none");
    setIsAnonymous(false);
  }, [selectedRoom?._id]);

  const handlePollsOpenChange = (open: boolean) => {
    setPollsOpen(open);
    if (!open) {
      setChallengesOpen(false);
    }
  };



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedRoom.messages]);

  const activeTheme = getThemeColors(selectedRoom.category);
  const isPermanent = selectedRoom.isPermanent;
  const voteResult = getVotesSummary();
  const userVote = hasUserVoted();

  return (
    <div className={`flex flex-col h-full w-full ${activeTheme.bg} relative transition-colors duration-300`}>
      
      {/* Soft themed gradient glow circles */}
      <div className={`absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none -z-10 bg-gradient-to-br ${activeTheme.glow} opacity-30`} />
      <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10 bg-gradient-to-br ${activeTheme.glow} opacity-20`} />

      {/* Chat Workspace Header */}
      <header className="bg-white/[0.01] backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Header Icon squircle */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-md border ${activeTheme.iconBg}`}>
            {getCategoryIcon(selectedRoom.category)}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-extrabold text-base tracking-tight truncate">
                @{selectedRoom.gpName || "gp-handle"}
              </h2>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/50 tracking-wider">
                {getShortCategoryName(selectedRoom.category)}
              </span>
            </div>
            {/* Specific Room Title */}
            <p className="text-purple-300/80 font-bold text-xs mt-0.5 truncate leading-none">
              {selectedRoom.specificName || `${selectedRoom.subType} Room`}
            </p>
            
            {/* Facepile + Members online text */}
            <div className="flex items-center gap-2 mt-2 relative">
              <div className="flex -space-x-1.5">
                {selectedRoom.participants?.slice(0, 4).map((p, idx) => (
                  <div
                    key={p._id || idx}
                    className="w-5 h-5 rounded-full ring-2 ring-[#0c021a] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 border border-white/10 shrink-0"
                    title={p.name}
                  >
                    {p.profileImage ? (
                      <img src={p.profileImage} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold">
                        {p.name?.[0] || "U"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-white/40 font-semibold relative">
                {selectedRoom.participants?.length || 0} members • <span onClick={() => setShowMembersDropdown(!showMembersDropdown)} className="hover:text-purple-300 cursor-pointer select-none">view all</span>
                
                {/* Members Dropdown Overlay */}
                {showMembersDropdown && (
                  <div className={`absolute top-6 left-0 mt-1 ${activeTheme.bg || "bg-[#110928]"} bg-opacity-95 border border-white/10 rounded-2xl p-3 shadow-2xl z-40 w-64 text-left max-h-64 overflow-y-auto scrollbar-thin backdrop-blur-xl`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Group Members</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowMembersDropdown(false); }}
                        className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-white/70 font-semibold cursor-pointer border border-white/5"
                      >
                        Close
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedRoom.participants?.map((member, idx) => {
                        const isCreator = member._id?.toString() === selectedRoom.createdBy?.toString() || member._id?.toString() === selectedRoom.createdBy?._id?.toString();
                        const isModerator = member._id?.toString() === selectedRoom.moderator?.toString() || member._id?.toString() === selectedRoom.moderator?._id?.toString();
                        return (
                          <div key={member._id || idx} className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-xl transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6.5 h-6.5 rounded-lg overflow-hidden border border-white/5 bg-white/5 shrink-0 flex items-center justify-center">
                                {member.profileImage ? (
                                  <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white font-bold text-[8px] uppercase">
                                    {member.name?.[0]}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-bold text-[10px] truncate leading-tight">{member.name}</p>
                                <p className="text-white/30 text-[8px] font-semibold truncate leading-none mt-0.5">@{member.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-1">
                              {isCreator && (
                                <span className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[6px] font-extrabold uppercase rounded">
                                  Creator
                                </span>
                              )}
                              {isModerator && (
                                <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[6px] font-extrabold uppercase rounded">
                                  Mod
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Permanent status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 text-[10px] font-bold uppercase tracking-wider ${
            isPermanent
              ? "bg-emerald-500/10 border-emerald-500/20 text-[#33D6C0] shadow-inner"
              : "bg-purple-500/10 border-purple-500/20 text-purple-300"
          }`}>
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {isPermanent ? "Permanent" : formatTimeRemaining(selectedRoom.expiresAt)}
            </span>
          </div>

          {/* Mute bell icon */}
          {/* Interactive Lounge Drawer Trigger in Chat Header */}
          <Drawer showSwipeHandle={isMobile} swipeDirection={swipeDirection} modal={false} open={pollsOpen} onOpenChange={handlePollsOpenChange}>
            <DrawerTrigger render={
              <button
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer text-[10px] font-extrabold uppercase tracking-wider relative select-none ${
                  polls.length > 0 || challenges.length > 0
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/15"
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                }`}
                title="Open Interactive Lounge"
              >
                <Sparkles className={`w-3.5 h-3.5 ${polls.length > 0 || challenges.length > 0 ? "text-purple-400 animate-pulse" : "text-white/40"}`} />
                <span>Lounge</span>
                {(polls.length > 0 || challenges.length > 0) && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/35 text-[8px] font-extrabold font-mono">
                    {polls.length + challenges.length}
                  </span>
                )}
              </button>
            } />

            <DrawerContent className={`w-[450px] max-w-full ${activeTheme.bg}`}>
              <DrawerHeader>
                <DrawerTitle>Group Polls</DrawerTitle>
                <DrawerDescription>
                  {polls.length} active polls in this room
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {/* Launch Poll Trigger and Form */}
                <div className="space-y-3">
                  {showCreateForm === "poll" ? (
                    <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                      <h4 className="text-white font-extrabold text-[10px] uppercase tracking-wider text-purple-400">Launch New Poll</h4>
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          placeholder="What is your question?"
                          value={newPollQuestion}
                          onChange={(e) => setNewPollQuestion(e.target.value)}
                          className="w-full bg-black/25 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 font-semibold"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          {newPollOptions.map((opt, idx) => (
                            <input
                              key={idx}
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...newPollOptions];
                                newOpts[idx] = e.target.value;
                                setNewPollOptions(newOpts);
                              }}
                              className="w-full bg-black/25 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 font-semibold"
                            />
                          ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setShowCreateForm("none")}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/55 font-bold text-[10px] uppercase tracking-wider border border-white/5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleCreatePoll();
                              setShowCreateForm("none");
                            }}
                            disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim() !== "").length < 2}
                            className={`px-4 py-1.5 rounded-lg bg-gradient-to-r ${activeTheme.btn} text-white font-extrabold text-[10px] uppercase tracking-wider disabled:opacity-40`}
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateForm("poll")}
                      className="w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/15 hover:text-purple-300 font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Launch New Poll</span>
                    </button>
                  )}
                </div>

                {/* Polls List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">Active Polls</span>
                  <div className="space-y-3">
                    {polls.length === 0 ? (
                      <p className="text-white/30 text-[10px] py-6 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                        No active polls
                      </p>
                    ) : (
                      polls.map((p) => {
                        const totalPollVotes = p.options.reduce((sum: number, o: any) => sum + o.votes, 0);
                        const pollIdStr = p._id || p.id;
                        return (
                          <div key={pollIdStr} className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-2xl space-y-3 group/poll">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-white/95 font-bold text-[12px] leading-snug">{p.question}</p>
                              {(p.createdBy?._id === user?.id || p.createdBy === user?.id || !p.createdBy || selectedRoom.createdBy?._id === user?.id || selectedRoom.createdBy === user?.id) && (
                                <button
                                  onClick={() => handleDeletePoll(pollIdStr)}
                                  className="text-white/30 hover:text-red-400 transition-colors p-1 rounded cursor-pointer opacity-0 group-hover/poll:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                                  title="Remove Poll"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {p.options.map((opt: any, idx: number) => {
                                const percentage = totalPollVotes > 0 ? (opt.votes / totalPollVotes) * 100 : 0;
                                const userHasVotedOption = opt.voters.includes(user?.id);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleVotePoll(pollIdStr, idx)}
                                    className="w-full text-left relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-2.5 hover:bg-white/[0.02] transition-all flex items-center justify-between group cursor-pointer"
                                  >
                                    <div 
                                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${activeTheme.bubble} opacity-15 transition-all duration-500`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="text-[11px] text-white/80 font-bold relative z-10 select-none flex items-center gap-1.5">
                                      {userHasVotedOption && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 stroke-[3px]" />}
                                      <span>{opt.text}</span>
                                    </span>
                                    <span className="text-[10px] text-white/30 font-bold relative z-10">
                                      {opt.votes} votes ({Math.round(percentage)}%)
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <DrawerFooter className="flex flex-col gap-2">
                {/* Nested Drawer for Challenges */}
                <Drawer showSwipeHandle={isMobile} swipeDirection={swipeDirection} modal={false} open={challengesOpen} onOpenChange={setChallengesOpen}>
                  <DrawerTrigger render={
                    <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-purple-500/10">
                      <Trophy className="w-3.5 h-3.5 animate-bounce" />
                      <span>Open Challenges Drawer</span>
                    </button>
                  } />
                  <DrawerContent className={`w-[450px] max-w-full z-[60] ${activeTheme.bg}`}>
                    <DrawerHeader>
                      <DrawerTitle>Daily Challenges</DrawerTitle>
                      <DrawerDescription>
                        Complete room challenges or publish one
                      </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                      {/* Launch Challenge Trigger and Form */}
                      <div className="space-y-3">
                        {showCreateForm === "challenge" ? (
                          <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-extrabold text-[10px] uppercase tracking-wider text-purple-400">Launch Daily Challenge</h4>
                              <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                1 per day limit
                              </span>
                            </div>
                            {hasSubmittedChallengeToday ? (
                              <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-center space-y-1">
                                <p className="text-purple-300 text-xs font-bold">You've already submitted a challenge today!</p>
                                <p className="text-white/40 text-[9px] font-semibold">Resets at midnight. Complete other challenges below!</p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <textarea
                                  placeholder="Challenge the room! E.g. 'Solve a programming puzzle and reply!'"
                                  value={newChallengeText}
                                  onChange={(e) => setNewChallengeText(e.target.value)}
                                  rows={2}
                                  className="w-full bg-black/25 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 font-semibold resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setShowCreateForm("none")}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white/55 font-bold text-[10px] uppercase tracking-wider border border-white/5"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCreateChallenge();
                                      setShowCreateForm("none");
                                    }}
                                    disabled={!newChallengeText.trim()}
                                    className={`px-4 py-1.5 rounded-lg bg-gradient-to-r ${activeTheme.btn} text-white font-extrabold text-[10px] uppercase tracking-wider disabled:opacity-40`}
                                  >
                                    Publish
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCreateForm("challenge")}
                            className="w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/15 hover:text-purple-300 font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Launch Daily Challenge</span>
                          </button>
                        )}
                      </div>

                      {/* Challenges List */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">Active Challenges</span>
                        <div className="space-y-3">
                          {challenges.length === 0 ? (
                            <p className="text-white/30 text-[10px] py-6 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                              No challenges submitted today
                            </p>
                          ) : (
                            challenges.map((c) => {
                              const isCompletedByMe = c.completedBy.includes(user?.id);
                              const challengeIdStr = c._id || c.id;
                              return (
                                <div key={challengeIdStr} className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex items-center justify-between gap-3 group/chal">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-white/95 font-bold text-[12px] leading-snug break-words">{c.text}</p>
                                      {(c.userId === user?.id || c.userId?._id === user?.id || !c.userId || selectedRoom.createdBy?._id === user?.id || selectedRoom.createdBy === user?.id) && (
                                        <button
                                          onClick={() => handleDeleteChallenge(challengeIdStr)}
                                          className="text-white/30 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer opacity-0 group-hover/chal:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                                          title="Remove Challenge"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-white/30 text-[8px] font-semibold uppercase tracking-wider">
                                      By <span className="text-purple-400 font-bold">{c.user}</span> • {c.completedBy.length} completions
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleToggleCompleteChallenge(challengeIdStr)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                      isCompletedByMe
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                        : "bg-white/5 border border-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
                                    <span>{isCompletedByMe ? "Done" : "I did it!"}</span>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <DrawerFooter>
                      <DrawerClose render={
                        <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all font-extrabold text-[10px] uppercase tracking-wider cursor-pointer text-center">
                          Back to Polls
                        </button>
                      } />
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <DrawerClose render={
                  <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all font-extrabold text-[10px] uppercase tracking-wider cursor-pointer text-center">
                    Close Lounge
                  </button>
                } />
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <button
            onClick={() => toggleMuteRoom(selectedRoom._id)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted 
                ? "bg-red-500/10 border-red-500/20 text-[#FF5D73]" 
                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
            title={isMuted ? "Unmute room" : "Mute notifications"}
          >
            {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>

          {/* Leave Group Action */}
          <button
            onClick={() => handleLeave(selectedRoom._id)}
            disabled={leavingId === selectedRoom._id}
            className="p-2 bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Leave GP Room"
          >
            {leavingId === selectedRoom._id ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Voting / Permanent eligibility card banner */}
      {!isPermanent && voteStatus && (
        <div className="px-6 pt-4 shrink-0">
          {voteStatus.isConversionEligible ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 border ${activeTheme.borderAccent}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-sm tracking-tight">Eligible to become permanent</h3>
                    <p className="text-white/40 text-[10px] font-semibold mt-0.5 leading-relaxed">
                      {getHoursActiveText(selectedRoom.startedAt)}, {selectedRoom.participants?.length} members. Needs 70% approval to stick around forever.
                    </p>
                  </div>
                </div>

                {/* Vote Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full bg-gradient-to-r ${activeTheme.barColor} transition-all duration-500`}
                      style={{ width: `${voteResult.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40 font-bold uppercase tracking-wider">
                    <span>{voteResult.yesVotes} of {voteResult.totalVotes} voted yes</span>
                    <span>{Math.round(voteResult.percentage)}% of 70% needed</span>
                  </div>
                </div>
              </div>

              {/* Voting CTAs */}
              <div className="shrink-0 flex items-center gap-2">
                {userVote ? (
                  <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Voted {userVote === "yes" ? "Keep" : "No"}</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleVote("yes")}
                      className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${activeTheme.btn} text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer`}
                    >
                      Vote to Keep
                    </button>
                    <button
                      onClick={() => handleVote("no")}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      No
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Eligible to start but conversion not requested yet
            voteStatus.isEligible ? (
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 backdrop-blur-xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">Conversion voting is available</h3>
                  <p className="text-white/40 text-[10px] font-semibold mt-0.5 leading-relaxed">
                    This group is active and matches all engagement goals. Open the voting room to let members convert this to a permanent chat.
                  </p>
                </div>
                <button
                  onClick={handleRequestConversion}
                  disabled={requestingConversion}
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${activeTheme.btn} text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer disabled:opacity-50`}
                >
                  {requestingConversion ? "Opening..." : "Start Voting"}
                </button>
              </div>
            ) : null
          )}
        </div>
      )}


      {/* Chat Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
        {selectedRoom.messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-4 ${activeTheme.iconBg}`}>
              <MessageCircle className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <h3 className="text-white/80 font-bold text-base mb-1">No Messages Yet</h3>
            <p className="text-white/40 text-xs max-w-sm font-medium">
              Break the ice! Say hello and kick off the conversation in the group.
            </p>
          </div>
        ) : (
          selectedRoom.messages?.map((msg, idx) => {
            const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id?.toString() ?? msg.sender?.toString();
            const isOwn = senderId === user?.id && !msg.isAnonymous;
            const sender = msg.sender;
            const senderName = sender?.name || "User";

            // Dynamic display color mapping for user names to keep it interesting
            const colorClasses = [
              "text-pink-400", "text-blue-400", "text-orange-400", 
              "text-amber-400", "text-emerald-400", "text-sky-400", 
              "text-fuchsia-400", "text-teal-400", "text-purple-400"
            ];
            const nameColor = msg.isAnonymous ? "text-orange-400" : colorClasses[senderName.length % colorClasses.length];

            return (
              <div
                key={msg._id || idx}
                className={`flex gap-3 group-message-anim ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {!isOwn && (
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/5 shadow-md bg-white/5">
                    {msg.isAnonymous ? (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                        <Ghost className="w-4.5 h-4.5" />
                      </div>
                    ) : sender?.profileImage ? (
                      <img src={sender.profileImage} alt={senderName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        {senderName[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                  {!isOwn && (
                    <span className={`text-[10px] font-extrabold tracking-wide mb-1 px-1.5 block ${nameColor}`}>
                      {senderName}
                    </span>
                  )}
                  
                  <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm select-text text-left ${
                    isOwn 
                      ? `bg-gradient-to-r ${activeTheme.bubble} text-white rounded-tr-sm` 
                      : "bg-white/[0.05] border border-white/5 text-white/90 rounded-tl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  
                  <span className="text-white/20 text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 block">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <footer className="bg-white/[0.01] backdrop-blur-xl border-t border-white/5 p-4 z-10 shrink-0 shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
        {(!isPermanent && new Date(selectedRoom.expiresAt) < new Date()) ? (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-[#FF5D73] text-sm font-bold uppercase tracking-wider">This temporal group has expired.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Anonymous Chat Toggle Button */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-3 border transition-all cursor-pointer shadow-sm rounded-xl flex items-center justify-center gap-1.5 ${
                  isAnonymous 
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)] animate-pulse" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:text-white text-white/40"
                }`}
                title={isAnonymous ? `Anonymous Mode Active (${anonRemaining} left today)` : `Send Anonymously (${anonRemaining} left today)`}
              >
                <Ghost className="w-4.5 h-4.5" />
              </button>
              <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[7px] font-extrabold select-none pointer-events-none border leading-none ${
                anonRemaining === 0 
                  ? "bg-red-500/20 border-red-500/30 text-red-400" 
                  : "bg-orange-500/20 border-orange-500/30 text-orange-400 animate-pulse"
              }`}>
                {anonRemaining}
              </span>
            </div>

            {/* Message Input Box */}
            <div className="flex-1 flex gap-2.5">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Message the group..."
                className="flex-1 bg-black/20 border border-white/5 focus:border-purple-500/40 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/10 transition-all font-semibold"
                disabled={sending}
              />
              <button
                onClick={onSend}
                disabled={sending || !messageText.trim()}
                className={`px-5 py-3 rounded-xl bg-gradient-to-r ${activeTheme.btn} text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-102 active:scale-97 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer`}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </footer>


    </div>
  );
}
