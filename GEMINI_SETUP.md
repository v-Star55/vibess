# Gemini AI Integration Setup

This guide explains how to use Google's Gemini AI in your Vibez application.

## Setup

1. **Add your API key to environment variables:**

   Create a `.env.local` file in the root directory (if it doesn't exist) and add:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your API key from: https://makersuite.google.com/app/apikey

2. **Restart your development server** after adding the environment variable.

## Features Available

### 1. AI-Powered Icebreakers
Generate personalized icebreaker messages based on both users' vibe cards.

**API Endpoint:** `POST /api/ai/icebreakers`

**Usage:**
```typescript
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";

const { icebreakers } = await generateAIIcebreakers(otherUserId);
// Returns: { success: true, icebreakers: ["Message 1", "Message 2", ...] }
```

### 2. Enhanced Vibe Descriptions
Get AI-generated alternative descriptions for your vibe card.

**API Endpoint:** `POST /api/ai/enhance-description`

**Usage:**
```typescript
import { enhanceVibeDescriptionAI } from "@/src/app/lib/vibeApi";

const { suggestions } = await enhanceVibeDescriptionAI({
  emoji: "😊",
  description: "Feeling great and ready to conquer",
  energyLevel: 8,
  currentIntent: ["Get motivated", "Share thoughts"]
});
// Returns: { success: true, suggestions: ["Alt 1", "Alt 2", "Alt 3"] }
```

### 3. Content Moderation
Moderate chat messages for inappropriate content.

**Usage:**
```typescript
import { moderateContent } from "@/src/app/lib/gemini";

const { isSafe, reason } = await moderateContent("User's message text");
if (!isSafe) {
  // Handle unsafe content
  console.log("Reason:", reason);
}
```

### 4. Matching Insights
Generate insights about why two users might be a good match.

**Usage:**
```typescript
import { generateMatchingInsights } from "@/src/app/lib/gemini";

const insight = await generateMatchingInsights(
  userVibe,
  otherUserVibe,
  similarityScore
);
```

## Example: Using AI Icebreakers in Chat

Here's how you can integrate AI icebreakers into your chat page:

```typescript
import { generateAIIcebreakers } from "@/src/app/lib/vibeApi";
import { useState, useEffect } from "react";

function ChatPage() {
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const loadAIIcebreakers = async () => {
      if (otherUserId) {
        setLoadingAI(true);
        try {
          const res = await generateAIIcebreakers(otherUserId);
          if (res.success) {
            setAiIcebreakers(res.icebreakers);
          }
        } catch (error) {
          console.error("Failed to load AI icebreakers");
        } finally {
          setLoadingAI(false);
        }
      }
    };
    loadAIIcebreakers();
  }, [otherUserId]);

  // Display AI icebreakers in your UI
  return (
    <div>
      {aiIcebreakers.map((icebreaker, idx) => (
        <button
          key={idx}
          onClick={() => handleSendMessage(icebreaker)}
        >
          {icebreaker}
        </button>
      ))}
    </div>
  );
}
```

## Example: Using Description Enhancement

Add a "Get AI Suggestions" button in your vibe creation form:

```typescript
import { enhanceVibeDescriptionAI } from "@/src/app/lib/vibeApi";

const handleGetAISuggestions = async () => {
  try {
    const res = await enhanceVibeDescriptionAI({
      emoji,
      description,
      energyLevel,
      currentIntent,
    });
    
    if (res.success && res.suggestions.length > 0) {
      // Show suggestions to user
      setAISuggestions(res.suggestions);
    }
  } catch (error) {
    toast.error("Failed to generate suggestions");
  }
};
```

## Error Handling

All Gemini functions include fallback behavior:
- If AI generation fails, icebreakers fall back to default messages
- If description enhancement fails, it returns an empty array
- Content moderation defaults to safe if it fails

## Model Used

Currently using `gemini-pro` model. You can change this in `src/app/lib/gemini.ts`:

```typescript
export function getGeminiModel(modelName: string = "gemini-pro") {
  return genAI.getGenerativeModel({ model: modelName });
}
```

Available models:
- `gemini-pro` - Best for text generation
- `gemini-pro-vision` - For image analysis (if needed)

## Rate Limits

Be aware of Gemini API rate limits:
- Free tier: 15 requests per minute
- Paid tier: Higher limits

Consider implementing caching or rate limiting for production use.

