"use client";

import React from "react";
import { Plus, Search, Compass } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface Member {
  _id: string;
  name: string;
  username: string;
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
  messages?: any[];
}

interface GroupSidebarProps {
  gps: GP[];
  selectedRoomId?: string;
  onSelectRoom: (gpId: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  user: any;
  onBrowse: () => void;
  getCategoryIcon: (category: string) => string;
  getShortCategoryName: (category: string) => string;
  getThemeColors: (category: string) => any;
  getLastMessageText: (group: GP) => string;
  getLastMessageTime: (group: GP) => string;
  formatTimeRemaining: (expiresAt: string) => string;
  activeThemeBg?: string;
}

export default function GroupSidebar({
  gps,
  selectedRoomId,
  onSelectRoom,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  user,
  onBrowse,
  getCategoryIcon,
  getShortCategoryName,
  getThemeColors,
  getLastMessageText,
  getLastMessageTime,
  formatTimeRemaining,
  activeThemeBg,
}: GroupSidebarProps) {
  
  const categories = [
    "All", "Vibe GP", "Movie GP", "Anime GP", "Food & Cafe GP", 
    "Fitness & Sports GP", "Travel GP", "Hobbies & Creativity GP", 
    "Developer GP", "Study GP", "Relationship GP", "Other GP"
  ];

  const filteredGps = gps.filter((gp) => {
    const matchesCategory = selectedCategory === "All" || gp.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      gp.specificName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gp.gpName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gp.subType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <aside className={`w-80 shrink-0 border-r border-white/5 backdrop-blur-xl flex flex-col h-full z-20 transition-all duration-300 ${
      activeThemeBg || "bg-[#07011d]"
    }`}>
      
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">My GPs</h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Active Chat Rooms</p>
        </div>
        <button 
          onClick={onBrowse}
          className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center text-white shadow-md active:scale-90 transition-all cursor-pointer"
          title="Browse more groups"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3 shrink-0">
        <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-xl px-3.5 py-2.5 focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-purple-500/10 transition-all">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your GPs..."
            className="bg-transparent outline-none text-xs text-white placeholder-white/30 w-full font-semibold"
          />
        </div>
      </div>

      {/* Category Filter Dropdown */}
      <div className="px-4 mb-3 shrink-0">
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full bg-black/20 border-white/5 text-white/80 font-semibold h-10 px-3.5 rounded-xl cursor-pointer focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/10">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className={`${activeThemeBg || "bg-[#0f0724]"} bg-opacity-90 border-white/10 text-white rounded-2xl backdrop-blur-xl`}>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === "All" ? "🌍 All Categories" : `${getCategoryIcon(cat)} ${getShortCategoryName(cat)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups Listing */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 scrollbar-thin">
        {filteredGps.length === 0 ? (
          <div className="text-center py-10 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
            <Compass className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-xs font-semibold">No active groups found</p>
          </div>
        ) : (
          filteredGps.map((group) => {
            const isSelected = selectedRoomId === group._id;
            const isPermanent = group.isPermanent;
            const expired = !isPermanent && new Date(group.expiresAt) < new Date();
            const theme = getThemeColors(group.category);

            return (
              <button
                key={group._id}
                onClick={() => onSelectRoom(group._id)}
                className={`w-full p-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] border flex gap-3 relative overflow-hidden group/item cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-br ${theme.accent} shadow-lg`
                    : "bg-white/[0.01] border-transparent hover:bg-white/[0.04]"
                }`}
              >
                {/* Category icon with gradient squircle */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-inner bg-gradient-to-br ${theme.accent}`}>
                  {getCategoryIcon(group.category)}
                </div>
                
                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-xs truncate group-hover/item:text-purple-300 transition-colors">
                      @{group.gpName || "gp-handle"}
                    </span>
                    <span className="text-white/30 text-[9px] font-medium shrink-0 ml-1">
                      {getLastMessageTime(group)}
                    </span>
                  </div>
                  
                  {/* Specific Room Title */}
                  <p className="text-purple-300/80 font-bold text-[10px] truncate mt-0.5">
                    {group.specificName || `${group.subType} Room`}
                  </p>
                  
                  <p className="text-white/40 text-[10px] truncate pr-4 font-semibold leading-relaxed mt-0.5">
                    {getLastMessageText(group)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider">
                      {group.memberCount} active
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      isPermanent
                        ? "bg-emerald-500/10 border-emerald-500/20 text-[#33D6C0]"
                        : expired
                        ? "bg-red-500/10 border-red-500/20 text-[#FF5D73]"
                        : "bg-purple-500/10 border-purple-500/20 text-purple-300"
                    }`}>
                      {isPermanent ? "Permanent" : expired ? "Expired" : formatTimeRemaining(group.expiresAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
