"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, Users, MessageCircle, Heart, MapPin, Lightbulb, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  // Animated floating emojis
  const [emojis] = useState([
    "😌", "🤪", "😴", "🤯", "😎", "🤗", "😊", "🤔"
  ]);

  const vibeCardExamples = [
    { emoji: "😴", description: "Just existing today", tag: "low battery" },
    { emoji: "🤪", description: "Talk nonsense", tag: "chaotic squirrel" },
    { emoji: "😌", description: "Soft & quiet", tag: "cozy cat" },
    { emoji: "🤯", description: "Brain dump", tag: "overwhelmed" },
    { emoji: "😎", description: "Let's laugh", tag: "meme-ready" },
    { emoji: "🤗", description: "Need comfort", tag: "gentle presence" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] text-white overflow-x-hidden">
      {/* Floating Emojis Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {emojis.map((emoji, idx) => (
          <div
            key={idx}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${(idx * 12) % 100}%`,
              top: `${(idx * 15) % 100}%`,
              animationDelay: `${idx * 0.5}s`,
              animationDuration: `${3 + (idx % 3)}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Find people who match your vibe.
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            Mood-based chats, real connections, zero pressure. Vibess is where your energy finds its people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              Create Your Vibe Card
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-lg transition-all border border-white/20"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: Sparkles,
                title: "Create your Vibe Card",
                description: "Set your mood emoji, vibe line, energy level, intention, comfort topic.",
              },
              {
                step: "2",
                icon: Users,
                title: "Match with People",
                description: "See users with similar vibes, energy, or needs on your wavelength.",
              },
              {
                step: "3",
                icon: MessageCircle,
                title: "24-Hour Chat Window",
                description: "You match → you chat → no pressure to continue forever.",
              },
              {
                step: "4",
                icon: Heart,
                title: "Have Fun or Feel Heard",
                description: "Laugh. Vent. Share nonsense. Make a friend.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-purple-400 font-bold text-sm mb-2">Step {item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="relative z-10 py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Why Vibess?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "⭐",
                title: "Vibe Matching",
                description: "Find people who feel the same — not based on looks.",
              },
              {
                emoji: "👂",
                title: "Ready to Listen",
                description: "When you need a calm, supportive person.",
              },
              {
                emoji: "💬",
                title: "Chat Rooms",
                description: "Small 4-person spaces for diverse conversations.",
              },
              {
                emoji: "🎨",
                title: "Vibe Card Customization",
                description: "Mini Personality, Comfort Topic, Energy Levels, Mood Lines.",
              },
              {
                emoji: "🗺️",
                title: "Vibe Heatmap",
                description: "See the mood of your city in real time.",
              },
              {
                emoji: "💡",
                title: "AI Icebreakers",
                description: "Smart, friendly conversation starters.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-3">{feature.emoji}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vibe Cards Preview */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Share Your Vibe
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {vibeCardExamples.map((card, idx) => (
              <div
                key={idx}
                className="min-w-[280px] bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl p-6 border border-purple-500/30 backdrop-blur-xl"
              >
                <div className="text-6xl mb-4">{card.emoji}</div>
                <h3 className="text-2xl font-bold mb-2">{card.description}</h3>
                <p className="text-white/60 text-sm">#{card.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Vibess Message */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl md:text-3xl text-white/90 mb-8 leading-relaxed">
            Not a dating app. Not a stress zone. Just a place to feel heard, have fun, and make real friends — based on vibes, not photos.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-purple-400" />
              <span className="text-lg">Feel understood</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-purple-400" />
              <span className="text-lg">Express your mood</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-purple-400" />
              <span className="text-lg">Meet people on your wavelength</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to share your vibe?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Create your Vibe Card and join the mood-first social space.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Create Vibe Card
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-white/60 text-sm">
          <div className="text-white font-bold text-lg">Vibess</div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

