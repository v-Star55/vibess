"use client";

import React, { useState } from "react";
import { X, Check, Loader2, Film, Smile, Utensils, Plane, HelpCircle, Code, Award } from "lucide-react";

const PERSONALITY_TRAITS_LIST = [
  "Easy Going",
  "Friendly",
  "Funny",
  "Curious",
  "Creative",
  "Calm",
  "Talkative",
  "Good Listener",
  "Supportive",
  "Energetic",
  "Thoughtful",
  "Socially Awkward"
];

interface ConversationStartersModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftDetails: any;
  setDraftDetails: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  isSaving: boolean;
  hobbiesList: string[];
}

export default function ConversationStartersModal({
  isOpen,
  onClose,
  draftDetails,
  setDraftDetails,
  onSave,
  isSaving,
  hobbiesList,
}: ConversationStartersModalProps) {
  const [activeTab, setActiveTab] = useState("popCulture");

  if (!isOpen) return null;

  const toggleHobby = (hobbyName: string) => {
    const currentHobbies = draftDetails.hobbies || [];
    let newHobbies;
    if (currentHobbies.includes(hobbyName)) {
      newHobbies = currentHobbies.filter((h: string) => h !== hobbyName);
    } else {
      newHobbies = [...currentHobbies, hobbyName];
    }
    setDraftDetails((prev: any) => ({ ...prev, hobbies: newHobbies }));
  };

  const togglePersonality = (trait: string) => {
    const current = draftDetails.personalities || [];
    let newTraits;
    if (current.includes(trait)) {
      newTraits = current.filter((t: string) => t !== trait);
    } else {
      newTraits = [...current, trait];
    }
    setDraftDetails((prev: any) => ({ ...prev, personalities: newTraits }));
  };

  const updateDraftField = (field: string, val: string) => {
    setDraftDetails((prev: any) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1732] border border-white/10 rounded-3xl p-6 md:p-8 max-w-3xl w-full flex flex-col glass-card-strong max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#f3efff]/10">
          <div>
            <h3 className="text-xl font-extrabold font-bricolage text-white">Icebreakers & Starters</h3>
            <p className="text-xs text-[#7C7196] mt-0.5">Fill in your favorites to make breaking the ice seamless!</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7C7196] hover:text-white rounded-full bg-white/5 border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Content (Split Side-by-Side) */}
        <div className="flex-1 md:grid md:grid-cols-[180px_1fr] md:gap-6 overflow-hidden min-h-0">
          
          {/* Left Side: Category Tabs */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 mb-4 md:mb-0 border-b md:border-b-0 border-[#f3efff]/5 pb-2 md:pb-0 shrink-0 select-none">
            {[
              { id: "popCulture", label: "Pop Culture", icon: Film },
              { id: "personality", label: "Personality", icon: Smile },
              { id: "food", label: "Food Options", icon: Utensils },
              { id: "hobbies", label: "Hobbies List", icon: Award },
              { id: "travel", label: "Travel & Trip", icon: Plane },
              { id: "fun", label: "Fun Qs", icon: HelpCircle },
              { id: "dev", label: "Dev Core", icon: Code },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border transition text-left shrink-0 md:w-full ${
                    isActive
                      ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF] shadow-lg"
                      : "text-[#B3A7CE] border-white/5 bg-white/[0.02] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side: Form Inputs */}
          <div className="flex-1 overflow-y-auto px-1 pr-2 space-y-4 max-h-[50vh] md:max-h-[60vh] pb-6">
            
            {/* POP CULTURE TAB */}
            {activeTab === "popCulture" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">🎬 Pop Culture / Entertainment</h4>
                {[
                  { field: "favoriteMovie", label: "Favorite Movie", placeholder: "e.g. Interstellar, Inception" },
                  { field: "favoriteSeries", label: "Favorite Series", placeholder: "e.g. Breaking Bad, Succession" },
                  { field: "lastMovieWatched", label: "Last Movie Watched", placeholder: "What did you watch recently?" },
                  { field: "favoriteAnime", label: "Favorite Anime", placeholder: "e.g. Naruto, Attack on Titan" },
                  { field: "favoriteSuperhero", label: "Favorite Superhero", placeholder: "e.g. Batman, Spider-Man" },
                  { field: "favoriteGame", label: "Favorite Game", placeholder: "e.g. Witcher 3, GTA V, Valorant" },
                  { field: "songOnRepeat", label: "Song on Repeat", placeholder: "What track is looped right now?" },
                  { field: "favoriteArtistBand", label: "Favorite Artist/Band", placeholder: "e.g. Coldplay, Diljit, A.R. Rahman" },
                  { field: "favoriteBook", label: "Favorite Book", placeholder: "e.g. Atomic Habits, Harry Potter" },
                  { field: "favoritePodcast", label: "Favorite Podcast", placeholder: "e.g. Joe Rogan, BeerBiceps" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <input
                      type="text"
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* PERSONALITY TAB */}
            {activeTab === "personality" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">😄 Personality & Vibes</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#B3A7CE]">Three words that describe me</label>
                  <input
                    type="text"
                    value={draftDetails.threeWordsDescribeMe || ""}
                    onChange={(e) => updateDraftField("threeWordsDescribeMe", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                    placeholder="e.g. curious, chill, overthinker"
                  />
                </div>

                {[
                  { field: "nightOwlEarlyBird", label: "Night Owl or Early Bird?", options: ["Night Owl", "Early Bird", "Both"] },
                  { field: "coffeeOrTea", label: "Coffee or Tea?", options: ["Coffee", "Tea", "Both", "Neither"] },
                  { field: "mountainsOrBeach", label: "Mountains or Beach?", options: ["Mountains", "Beach", "Both"] },
                  { field: "catOrDog", label: "Cat or Dog?", options: ["Cat", "Dog", "Both", "Neither"] },
                  { field: "sweetOrSpicy", label: "Sweet or Spicy?", options: ["Sweet", "Spicy", "Both"] },
                  { field: "introvertExtrovertAmbivert", label: "Introvert / Extrovert / Ambivert", options: ["Introvert", "Extrovert", "Ambivert"] },
                ].map(({ field, label, options }) => (
                  <div key={field} className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => {
                        const isSelected = draftDetails[field] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateDraftField(field, opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                              isSelected
                                ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF]"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-xs font-semibold text-[#B3A7CE]">Personality Traits (Select multiple)</label>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALITY_TRAITS_LIST.map((trait) => {
                      const isSelected = draftDetails.personalities?.includes(trait);
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => togglePersonality(trait)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                            isSelected
                              ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF] shadow-md"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {trait}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {[
                  { field: "biggestGreenFlag", label: "Biggest Green Flag", placeholder: "e.g. active listener, kind to waiters" },
                  { field: "biggestRedFlag", label: "Biggest Red Flag", placeholder: "e.g. poor communication, dry texting" },
                  { field: "myToxicTrait", label: "My toxic trait is...", placeholder: "e.g. buying books and not reading them" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <input
                      type="text"
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* FOOD TAB */}
            {activeTab === "food" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">🍜 Food Options</h4>
                {[
                  { field: "favoriteCuisine", label: "Favorite Cuisine", placeholder: "e.g. Italian, Mughlai, South Indian" },
                  { field: "goToMidnightSnack", label: "Go-to Midnight Snack", placeholder: "e.g. Maggie, chips, ice cream" },
                  { field: "favoriteFastFood", label: "Favorite Fast Food", placeholder: "e.g. Pizza, Burger, Momos" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <input
                      type="text"
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* HOBBIES TAB */}
            {activeTab === "hobbies" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">🎨 Hobbies Selection</h4>
                  <p className="text-[11px] text-[#7C7196] mt-0.5">Select multiple categories that define your leisure time.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {hobbiesList.map((hobby) => {
                    const isSelected = draftDetails.hobbies?.includes(hobby);
                    return (
                      <button
                        key={hobby}
                        type="button"
                        onClick={() => toggleHobby(hobby)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF] shadow-md"
                            : "bg-white/5 border-white/10 text-[#B3A7CE] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {hobby}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TRAVEL TAB */}
            {activeTab === "travel" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">✈ Travel & Trips</h4>
                {[
                  { field: "dreamDestination", label: "Dream Destination", placeholder: "e.g. Japan, Iceland, Switzerland" },
                  { field: "mostBeautifulPlaceBeen", label: "Most Beautiful Place I've Been", placeholder: "Where wowed you the most?" },
                  { field: "nextTrip", label: "Next Trip", placeholder: "Where are you heading next?" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <input
                      type="text"
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#B3A7CE]">Window or Aisle seat?</label>
                  <div className="flex gap-2">
                    {["Window", "Aisle", "Middle"].map((seat) => {
                      const isSelected = draftDetails.windowOrAisle === seat;
                      return (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => updateDraftField("windowOrAisle", seat)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                            isSelected
                              ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF]"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {seat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* FUN QUESTIONS TAB */}
            {activeTab === "fun" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">🎤 Fun Conversation Starters</h4>
                {[
                  { field: "ifOneCroreToday", label: "If you had ₹1 Crore today...", placeholder: "How would you spend or invest it?" },
                  { field: "zombieApocalypseRole", label: "Zombie apocalypse role?", placeholder: "Leader, weapon engineer, scavenger, or first to die?" },
                  { field: "fictionalCharacter", label: "Which fictional character are you?", placeholder: "e.g. Iron Man, Ted Mosby, Chandler Bing" },
                  { field: "neverGetTiredOf", label: "One thing you'll never get tired of?", placeholder: "e.g. late night driving, chai, listening to rain" },
                  { field: "lifeTitle", label: "If your life had a title?", placeholder: "What would the book cover say?" },
                  { field: "mostEmbarrassingMoment", label: "Most embarrassing moment?", placeholder: "Keep it brief and fun!" },
                  { field: "lastThingLaugh", label: "Last thing that made you laugh?", placeholder: "What cracked you up?" },
                  { field: "conspiracyTheoryBelieve", label: "One conspiracy theory you kinda believe", placeholder: "e.g. Aliens in Area 51, simulation theory" },
                  { field: "dinnerWithAnyone", label: "If you could have dinner with anyone?", placeholder: "Historical, alive, fictional, anyone!" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <textarea
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full resize-none"
                      placeholder={placeholder}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* DEVELOPERS TAB */}
            {activeTab === "dev" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">👨‍💻 For Developers & Techies</h4>
                {[
                  { field: "favoriteLanguage", label: "Favorite Programming Language", placeholder: "e.g. TypeScript, Rust, Python, Go" },
                  { field: "dreamCompany", label: "Dream Company", placeholder: "e.g. Google, Vercel, Stripe, YC" },
                  { field: "currentSideProject", label: "Current Side Project", placeholder: "What are you hacking on right now?" },
                  { field: "vsCodeTheme", label: "VS Code Theme", placeholder: "e.g. One Dark Pro, Catppuccin, Tokyo Night" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#B3A7CE]">{label}</label>
                    <input
                      type="text"
                      value={draftDetails[field] || ""}
                      onChange={(e) => updateDraftField(field, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#B3A7CE]">Tabs vs Spaces 😈</label>
                  <div className="flex gap-2">
                    {["Tabs", "Spaces", "Both", "Depends"].map((indent) => {
                      const isSelected = draftDetails.tabsVsSpaces === indent;
                      return (
                        <button
                          key={indent}
                          type="button"
                          onClick={() => updateDraftField("tabsVsSpaces", indent)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                            isSelected
                              ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF]"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {indent}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#B3A7CE]">Coffee while coding?</label>
                  <div className="flex gap-2">
                    {["Yes", "No", "Sometimes", "RedBull"].map((c) => {
                      const isSelected = draftDetails.coffeeWhileCoding === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateDraftField("coffeeWhileCoding", c)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                            isSelected
                              ? "bg-[#C65CFF] text-[#100C1C] border-[#C65CFF]"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="mt-5 pt-4 border-t border-[#f3efff]/10 flex gap-3 justify-end shrink-0 select-none">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#33D6C0] to-[#C65CFF] text-[#100C1C] font-extrabold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#100C1C]" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Icebreakers
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-sm transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
