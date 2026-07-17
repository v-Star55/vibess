"use client";

import React from "react";

interface Member {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
}

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Member[];
  createdBy?: string;
  moderator?: string;
}

export default function MembersModal({
  isOpen,
  onClose,
  participants,
  createdBy,
  moderator,
}: MembersModalProps) {
  if (!isOpen) return null;

  const creatorId = createdBy?.toString();
  const moderatorId = moderator?.toString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0f0826] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-extrabold text-base">Group Members</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              {participants.length} Members in Room
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xs font-bold px-3 py-1 bg-white/5 rounded-xl border border-white/5 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {participants.map((member, idx) => {
            const memberId = member._id?.toString();
            const isCreator = memberId === creatorId;
            const isModerator = memberId === moderatorId;
            
            return (
              <div key={member._id || idx} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/5 bg-white/5 shrink-0 flex items-center justify-center">
                    {member.profileImage ? (
                      <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {member.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs leading-none">{member.name}</h4>
                    <p className="text-white/30 text-[10px] font-semibold mt-1">@{member.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCreator && (
                    <span className="px-2 py-0.5 bg-pink-500/15 border border-pink-500/30 text-pink-400 text-[8px] font-bold uppercase tracking-wider rounded-md">
                      Creator
                    </span>
                  )}
                  {isModerator && (
                    <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[8px] font-bold uppercase tracking-wider rounded-md">
                      Mod
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/5"
          >
            Done
          </button>
        </div>
        
      </div>
    </div>
  );
}
