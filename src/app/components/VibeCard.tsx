"use client";

import Image from "next/image";

export type VibeCardProps = {
  name?: string;
  imageSrc?: string;
  imageAlt?: string;
  moodTitle?: string;
  energyLevel?: number;
  currentIntent?: string[];
  contextTag?: string;
  interactionBoundary?: string;
  accentHex?: string;
  borderGlowHex?: string;
  bgFromHex?: string;
  bgToHex?: string;
  className?: string;
  emojis?: string[];
  onReact?: (emoji: string) => void;
  feelingOptions?: string[];
  vibeAvailability?: string;
  personalityPrompt?: string;
};

const defaultProps = {
  name: "Maya",
  imageSrc: "/maya.jpg",
  imageAlt: "Maya",
  moodTitle: "FEELING\nGOOD",
  energyLevel: 5,
  currentIntent: ["Chill conversation"],
  interactionBoundary: "Fast replies",
  accentHex: "#29d8fa",
  borderGlowHex: "#ec49da",
  bgFromHex: "#1c103a",
  bgToHex: "#190024",
};

export default function VibeCard(props: VibeCardProps) {
  const {
    name = defaultProps.name,
    imageSrc = defaultProps.imageSrc,
    imageAlt = defaultProps.imageAlt,
    moodTitle = defaultProps.moodTitle,
    energyLevel = defaultProps.energyLevel,
    currentIntent = defaultProps.currentIntent,
    contextTag,
    interactionBoundary = defaultProps.interactionBoundary,
    accentHex = defaultProps.accentHex,
    borderGlowHex = defaultProps.borderGlowHex,
    bgFromHex = defaultProps.bgFromHex,
    bgToHex = defaultProps.bgToHex,
    className = "",
    emojis = ["🔥", "😎", "❤️", "😂"],
    onReact,
    feelingOptions = [],
    vibeAvailability,
    personalityPrompt,
  } = props;

  const lines = moodTitle.split("\n");

  return (
    <div
      className={`w-80 p-6 rounded-3xl border-2 relative text-white flex flex-col gap-6 ${className}`}
      style={{
        borderColor: borderGlowHex,
        backgroundImage: `linear-gradient(to bottom, ${bgFromHex}, ${bgToHex})`,
        boxShadow: `0 0 20px ${borderGlowHex}, 0 0 40px ${borderGlowHex}`,
      }}
    >
      {/* Profile */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full border-4 p-[2px]"
          style={{ borderColor: borderGlowHex }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={56}
            height={56}
            className="rounded-full"
          />
        </div>
        <h2 className="text-white text-xl font-bold">{name}</h2>
      </div>

      {/* Mood Title */}
      <h1
        className="text-6xl font-extrabold leading-tight"
        style={{
          color: accentHex,
          textShadow: `0 0 15px ${accentHex}, 0 0 25px ${accentHex}`,
        }}
      >
        {lines.map((line, idx) => (
          <span key={idx}>
            {line}
            {idx < lines.length - 1 && <br />}
          </span>
        ))}
      </h1>

      {/* Energy Level */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2" style={{ color: accentHex }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accentHex}
            strokeWidth="2"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-semibold">Energy: {energyLevel}/10</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${(energyLevel / 10) * 100}%`,
              backgroundColor: accentHex,
            }}
          />
        </div>
      </div>

      {/* Intent & Context */}
      <div className="flex flex-col gap-2">
        {currentIntent && currentIntent.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentIntent.map((intent, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white"
              >
                {intent}
              </span>
            ))}
          </div>
        )}
        {contextTag && (
          <span className="text-gray-300 text-sm">#{contextTag}</span>
        )}
        <span className="text-gray-400 text-xs">{interactionBoundary}</span>
      </div>

      {/* Divider */}
      {(feelingOptions?.length > 0 || vibeAvailability || personalityPrompt) && (
        <div className="h-px bg-white/10 my-1"></div>
      )}

      {/* What I'm Feeling Like Today */}
      {feelingOptions && feelingOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span style={{ color: accentHex }}>✨</span>
            What I'm Feeling Like Today
          </span>
          <div className="flex flex-wrap gap-1.5">
            {feelingOptions.map((feeling, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors"
                style={{ boxShadow: `0 0 8px ${accentHex}30` }}
              >
                {feeling}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Availability */}
      {vibeAvailability && (
        <div className="flex flex-col gap-1.5">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span style={{ color: accentHex }}>⚡</span>
            Availability
          </span>
          <span
            className="px-3 py-2 rounded-lg text-sm font-medium bg-white/20 text-white border border-white/30 inline-block w-fit"
            style={{ boxShadow: `0 0 10px ${accentHex}40` }}
          >
            {vibeAvailability}
          </span>
        </div>
      )}

      {/* Mini Personality Prompt */}
      {personalityPrompt && (
        <div className="flex flex-col gap-1.5">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span style={{ color: accentHex }}>💭</span>
            Today I feel like...
          </span>
          <span
            className="px-3 py-2 rounded-lg text-sm font-medium italic bg-white/20 text-white border border-white/30"
            style={{ boxShadow: `0 0 10px ${accentHex}40` }}
          >
            {personalityPrompt}
          </span>
        </div>
      )}

      {/* Emoji reactions */}
      <div className="flex justify-between w-full text-3xl mt-4 px-2">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onReact && onReact(e)}
            className="hover:scale-110 active:scale-95 transition-transform"
            aria-label={`React ${e}`}
          >
            <span role="img" aria-hidden="true">
              {e}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
