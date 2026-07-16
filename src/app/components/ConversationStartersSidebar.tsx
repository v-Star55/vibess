"use client";

import React from "react";

interface ConversationStartersSidebarProps {
  profileDetails: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
  startersMapping: Record<string, { label: string; icon: string }>;
  hasAnyDetails: boolean;
}

export default function ConversationStartersSidebar({
  profileDetails,
  isOwnProfile,
  onEditClick,
  startersMapping,
  hasAnyDetails,
}: ConversationStartersSidebarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow-text">Conversation Starters</span>
        {isOwnProfile && (
          <button
            onClick={onEditClick}
            className="text-xs font-bold text-[#C65CFF] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div className="glass-card rounded-3xl p-5 border border-white/5 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
        {hasAnyDetails ? (
          <div className="flex flex-col gap-3 text-xs leading-normal">
            {/* Render answered text questions */}
            {Object.keys(startersMapping).map((field) => {
              const value = profileDetails[field];
              if (value && typeof value === "string" && value.trim() !== "") {
                const mapping = startersMapping[field];
                return (
                  <div key={field} className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <span className="text-[#7C7196] block mb-0.5 text-[10px]">
                      {mapping.icon} {mapping.label}
                    </span>
                    <span className="text-[#F3EFFF] font-semibold">{value}</span>
                  </div>
                );
              }
              return null;
            })}

            {/* Render Hobbies */}
            {profileDetails.hobbies && profileDetails.hobbies.length > 0 && (
              <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                <span className="text-[#7C7196] block mb-1.5 text-[10px]">🎨 Selected Hobbies</span>
                <div className="flex flex-wrap gap-1.5">
                  {profileDetails.hobbies.map((hobby: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#C65CFF]/15 text-[#C65CFF] text-[9.5px] px-2.5 py-0.5 rounded-full font-bold"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Render Personality Traits */}
            {profileDetails.personalities && profileDetails.personalities.length > 0 && (
              <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                <span className="text-[#7C7196] block mb-1.5 text-[10px]">🧠 Personality Traits</span>
                <div className="flex flex-wrap gap-1.5">
                  {profileDetails.personalities.map((trait: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-[#33D6C0]/15 text-[#33D6C0] text-[9.5px] px-2.5 py-0.5 rounded-full font-bold"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-[#7C7196] mb-4 leading-relaxed">
              Answer some fun icebreakers to make it easy for others to start a chat with you!
            </p>
            {isOwnProfile && (
              <button
                onClick={onEditClick}
                className="px-5 py-2 bg-gradient-to-r from-[#33D6C0] to-[#C65CFF] text-[#100C1C] font-extrabold rounded-full text-xs hover:scale-102 transition shadow-lg"
              >
                Add Starters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
