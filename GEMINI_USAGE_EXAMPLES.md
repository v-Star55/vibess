# Gemini AI Usage Examples

## Quick Start

### 1. Add API Key to Environment

Create `.env.local` in your project root:
```env
GEMINI_API_KEY=your_api_key_here
```

### 2. Restart Your Dev Server
```bash
npm run dev
```

---

## Example 1: AI Icebreakers in Chat Page

Replace static icebreakers with AI-generated ones:

```typescript
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";

// In your ChatPage component:
const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
const [loadingAI, setLoadingAI] = useState(false);

useEffect(() => {
  const loadAIIcebreakers = async () => {
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
          // Falls back to default icebreakers
          console.error("AI icebreakers failed, using defaults");
        } finally {
          setLoadingAI(false);
        }
      }
    }
  };
  
  if (chat) {
    loadAIIcebreakers();
  }
}, [chat, user]);

// Use in your JSX:
{loadingAI ? (
  <Loader2 className="w-4 h-4 animate-spin" />
) : (
  (aiIcebreakers.length > 0 ? aiIcebreakers : ICEBREAKER_PROMPTS).map((prompt, idx) => (
    <button
      key={idx}
      onClick={() => handleSendMessage(prompt)}
      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm"
    >
      {prompt}
    </button>
  ))
)}
```

---

## Example 2: AI Description Suggestions in Vibe Creation

Add a "Get AI Suggestions" button:

```typescript
import { enhanceVibeDescriptionAI } from "@/src/app/lib/vibeApi";

const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
const [loadingSuggestions, setLoadingSuggestions] = useState(false);

const handleGetAISuggestions = async () => {
  if (!description || description.trim().split(/\s+/).length < 3) {
    toast.error("Enter a description first to get suggestions");
    return;
  }

  setLoadingSuggestions(true);
  try {
    const res = await enhanceVibeDescriptionAI({
      emoji,
      description,
      energyLevel,
      currentIntent,
    });
    
    if (res.success && res.suggestions.length > 0) {
      setAiSuggestions(res.suggestions);
      toast.success("AI suggestions generated!");
    } else {
      toast.error("No suggestions available");
    }
  } catch (error) {
    toast.error("Failed to generate suggestions");
  } finally {
    setLoadingSuggestions(false);
  }
};

// In your JSX, add after description input:
<div className="mt-2">
  <button
    type="button"
    onClick={handleGetAISuggestions}
    disabled={loadingSuggestions || !description}
    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm font-medium disabled:opacity-50"
  >
    {loadingSuggestions ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        Generating...
      </>
    ) : (
      "✨ Get AI Suggestions"
    )}
  </button>
  
  {aiSuggestions.length > 0 && (
    <div className="mt-3 space-y-2">
      <p className="text-white/60 text-sm">AI Suggestions:</p>
      {aiSuggestions.map((suggestion, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => {
            setDescription(suggestion);
            setAiSuggestions([]);
          }}
          className="w-full text-left px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm border border-white/10"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )}
</div>
```

---

## Example 3: Direct Function Usage (Server-Side)

Use Gemini functions directly in API routes:

```typescript
// In any API route file
import { generateIcebreakers, moderateContent } from "@/src/app/lib/gemini";

// Generate icebreakers
const icebreakers = await generateIcebreakers(
  {
    emoji: "😊",
    description: "Feeling great today",
    energyLevel: 8,
    currentIntent: ["Make a friend"],
    contextTag: "Work"
  },
  {
    emoji: "🔥",
    description: "Super excited and pumped",
    energyLevel: 9,
    currentIntent: ["Get motivated"],
  }
);
// Returns: ["Message 1", "Message 2", ...]

// Moderate content
const moderation = await moderateContent("User's message here");
if (!moderation.isSafe) {
  // Block the message
  return NextResponse.json(
    { message: "Message contains inappropriate content", reason: moderation.reason },
    { status: 400 }
  );
}
```

---

## Example 4: Content Moderation in Message Sending

Add moderation to your chat message handler:

```typescript
import { moderateContent } from "@/src/app/lib/gemini";

const handleSendMessage = async (text?: string) => {
  const message = text || messageText.trim();
  if (!message) return;

  // Moderate message before sending
  try {
    const moderation = await moderateContent(message);
    if (!moderation.isSafe) {
      toast.error(`Message blocked: ${moderation.reason || "Inappropriate content"}`);
      return;
    }
  } catch (error) {
    // If moderation fails, allow message (fail open)
    console.error("Moderation check failed:", error);
  }

  setSending(true);
  try {
    const res = await sendMessage(chatId, message);
    // ... rest of your code
  } catch (error) {
    // ... error handling
  } finally {
    setSending(false);
  }
};
```

---

## Example 5: Matching Insights in Discovery Page

Show AI insights for matches:

```typescript
import { generateMatchingInsights } from "@/src/app/lib/gemini";

const [insights, setInsights] = useState<Record<string, string>>({});

const loadInsight = async (matchId: string, myVibe: any, otherVibe: any, similarity: number) => {
  try {
    const insight = await generateMatchingInsights(myVibe, otherVibe, similarity);
    setInsights(prev => ({ ...prev, [matchId]: insight }));
  } catch (error) {
    console.error("Failed to generate insight");
  }
};

// In your match card:
{insights[match.vibeCard._id] && (
  <p className="text-white/70 text-xs mt-2">
    💡 {insights[match.vibeCard._id]}
  </p>
)}
```

---

## Complete Integration Example: Chat Page with AI

Here's a complete example updating your chat page:

```typescript
"use client";

import { useState, useEffect } from "react";
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [useAI, setUseAI] = useState(true); // Toggle between AI and default

  // Load AI icebreakers when chat loads
  useEffect(() => {
    const loadAIIcebreakers = async () => {
      if (!chat || !otherUserId) return;
      
      setLoadingAI(true);
      try {
        const res = await generateAIIcebreakers(otherUserId);
        if (res.success && res.icebreakers.length > 0) {
          setAiIcebreakers(res.icebreakers);
        }
      } catch (error) {
        console.error("AI icebreakers failed");
        setUseAI(false); // Fallback to default
      } finally {
        setLoadingAI(false);
      }
    };

    loadAIIcebreakers();
  }, [chat, otherUserId]);

  const icebreakersToShow = useAI && aiIcebreakers.length > 0 
    ? aiIcebreakers 
    : ICEBREAKER_PROMPTS;

  return (
    <div>
      {/* Icebreaker section */}
      {chat.messages.length === 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {loadingAI ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating AI icebreakers...</span>
            </div>
          ) : (
            <>
              {icebreakersToShow.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-all"
                >
                  {prompt}
                </button>
              ))}
              {useAI && aiIcebreakers.length > 0 && (
                <span className="text-xs text-white/40 ml-2">✨ AI Generated</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

All functions have built-in fallbacks:

- **Icebreakers**: Falls back to default prompts if AI fails
- **Description suggestions**: Returns empty array if AI fails
- **Content moderation**: Defaults to safe if check fails
- **Matching insights**: Returns generic message if AI fails

You don't need to handle every error case - the functions are designed to fail gracefully.

---

## Testing

Test the functions one by one:

```typescript
// Test 1: Icebreakers
const test = async () => {
  const res = await generateAIIcebreakers("other_user_id");
  console.log("Icebreakers:", res.icebreakers);
};

// Test 2: Description enhancement
const test2 = async () => {
  const res = await enhanceVibeDescriptionAI({
    emoji: "😊",
    description: "Feeling great and ready",
    energyLevel: 8,
    currentIntent: ["Get motivated"]
  });
  console.log("Suggestions:", res.suggestions);
};
```

---

## Tips

1. **Cache AI responses** - Don't regenerate icebreakers on every render
2. **Show loading states** - Users should know AI is working
3. **Fallback gracefully** - Always have default options
4. **Rate limiting** - Be aware of API limits (15 req/min free tier)
5. **Error messages** - Don't show technical errors to users

