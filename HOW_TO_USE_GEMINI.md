# How to Use Gemini Functions - Quick Guide

## Step 1: Add API Key

Create `.env.local` file:
```env
GEMINI_API_KEY=your_key_here
```

## Step 2: Import Functions

```typescript
// For client-side (React components)
import { generateAIIcebreakers, enhanceVibeDescriptionAI } from "@/src/app/lib/vibeApi";

// For server-side (API routes)
import { generateIcebreakers, moderateContent, enhanceVibeDescription } from "@/src/app/lib/gemini";
```

---

## Function 1: Generate AI Icebreakers

**Use Case:** Replace static icebreakers with personalized AI-generated ones

### In Chat Page Component:

```typescript
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";
import { useState, useEffect } from "react";

// Add state
const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
const [loadingAI, setLoadingAI] = useState(false);

// Load when chat loads
useEffect(() => {
  const loadAI = async () => {
    if (chat?.participants) {
      const otherUser = chat.participants.find(
        (p: any) => p?._id?.toString() !== user?.id
      );
      
      if (otherUser?._id) {
        setLoadingAI(true);
        try {
          const res = await generateAIIcebreakers(otherUser._id);
          if (res.success) {
            setAiIcebreakers(res.icebreakers);
          }
        } catch (error) {
          console.error("AI failed");
        } finally {
          setLoadingAI(false);
        }
      }
    }
  };
  loadAI();
}, [chat]);

// Use in JSX
const prompts = aiIcebreakers.length > 0 ? aiIcebreakers : ICEBREAKER_PROMPTS;
```

---

## Function 2: Get AI Description Suggestions

**Use Case:** Help users write better vibe descriptions

### In Vibe Create Page:

```typescript
import { enhanceVibeDescriptionAI } from "@/src/app/lib/vibeApi";

// Add state
const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
const [loadingSuggestions, setLoadingSuggestions] = useState(false);

// Function to get suggestions
const getAISuggestions = async () => {
  setLoadingSuggestions(true);
  try {
    const res = await enhanceVibeDescriptionAI({
      emoji,
      description,
      energyLevel,
      currentIntent,
    });
    if (res.success) {
      setAiSuggestions(res.suggestions);
    }
  } catch (error) {
    toast.error("Failed to generate");
  } finally {
    setLoadingSuggestions(false);
  }
};

// Button in JSX
<button onClick={getAISuggestions} disabled={loadingSuggestions}>
  {loadingSuggestions ? "Generating..." : "✨ Get AI Suggestions"}
</button>

// Show suggestions
{aiSuggestions.map((s, i) => (
  <button key={i} onClick={() => setDescription(s)}>
    {s}
  </button>
))}
```

---

## Function 3: Content Moderation

**Use Case:** Check messages before sending

### In Chat Message Handler:

```typescript
import { moderateContent } from "@/src/app/lib/gemini";

const handleSendMessage = async (text: string) => {
  // Check content first
  try {
    const { isSafe, reason } = await moderateContent(text);
    if (!isSafe) {
      toast.error(`Blocked: ${reason}`);
      return;
    }
  } catch (error) {
    // Allow if check fails
  }
  
  // Send message
  await sendMessage(chatId, text);
};
```

---

## Function 4: Direct Server-Side Usage

**Use Case:** In API routes

```typescript
// In any API route file
import { generateIcebreakers } from "@/src/app/lib/gemini";

export async function POST(req: NextRequest) {
  const icebreakers = await generateIcebreakers(
    { emoji: "😊", description: "...", energyLevel: 8, currentIntent: ["..."] },
    { emoji: "🔥", description: "...", energyLevel: 9, currentIntent: ["..."] }
  );
  
  return NextResponse.json({ icebreakers });
}
```

---

## Complete Working Example

### Chat Page with AI Icebreakers:

```typescript
"use client";
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const load = async () => {
      const otherUser = chat?.participants?.find(
        (p: any) => p?._id?.toString() !== user?.id
      );
      if (otherUser?._id) {
        setLoadingAI(true);
        try {
          const res = await generateAIIcebreakers(otherUser._id);
          setAiIcebreakers(res.icebreakers || []);
        } catch (error) {
          // Use defaults
        } finally {
          setLoadingAI(false);
        }
      }
    };
    if (chat) load();
  }, [chat]);

  const prompts = aiIcebreakers.length > 0 ? aiIcebreakers : [
    "Hey! Your vibe caught my attention 😊",
    "Love your energy! How's your day?",
  ];

  return (
    <div>
      {loadingAI ? (
        <Loader2 className="animate-spin" />
      ) : (
        prompts.map((p, i) => (
          <button key={i} onClick={() => handleSendMessage(p)}>
            {p}
          </button>
        ))
      )}
    </div>
  );
}
```

---

## That's It!

1. Add API key to `.env.local`
2. Import the function you need
3. Call it with the right parameters
4. Handle the response

All functions have fallbacks, so your app won't break if AI fails!

