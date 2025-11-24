import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get Gemini model instance
 */
export function getGeminiModel(modelName: string = "gemini-2.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate AI-powered icebreaker messages based on vibe cards
 */
export async function generateIcebreakers(
  userVibe: {
    emoji: string;
    description: string;
    energyLevel: number;
    currentIntent: string[];
    contextTag?: string;
  },
  otherUserVibe: {
    emoji: string;
    description: string;
    energyLevel: number;
    currentIntent: string[];
    contextTag?: string;
  }
): Promise<string[]> {
  try {
    const model = getGeminiModel();

    const prompt = `You are a helpful assistant that generates friendly, engaging icebreaker messages for a social app.

User 1's vibe:
- Emoji: ${userVibe.emoji}
- Description: ${userVibe.description}
- Energy Level: ${userVibe.energyLevel}/10
- Intent: ${userVibe.currentIntent.join(", ")}
${userVibe.contextTag ? `- Context: ${userVibe.contextTag}` : ""}

User 2's vibe:
- Emoji: ${otherUserVibe.emoji}
- Description: ${otherUserVibe.description}
- Energy Level: ${otherUserVibe.energyLevel}/10
- Intent: ${otherUserVibe.currentIntent.join(", ")}
${otherUserVibe.contextTag ? `- Context: ${otherUserVibe.contextTag}` : ""}

Generate 5 short, friendly icebreaker messages (max 50 characters each) that User 1 could send to User 2. 
Make them:
- Personal and relevant to their vibes
- Casual and friendly
- Engaging and conversation-starting
- Appropriate for their energy levels and intents

Return ONLY a JSON array of strings, no other text. Example format: ["Message 1", "Message 2", "Message 3", "Message 4", "Message 5"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const icebreakers = JSON.parse(jsonMatch[0]);
      return Array.isArray(icebreakers) ? icebreakers.slice(0, 5) : [];
    }

    // Fallback: try to extract messages from text
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    return lines.slice(0, 5).map((line) => line.replace(/^[-•\d.]+\s*/, "").trim());
  } catch (error: any) {
    // Handle rate limit errors specifically
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      console.warn("Gemini API rate limit exceeded for icebreakers");
    } else {
      console.error("Error generating icebreakers with Gemini:", error);
    }
    // Return fallback icebreakers
    return [
      "Hey! Your vibe caught my attention 😊",
      "Love your energy! How's your day?",
      "Your vibe feels relatable! What's up?",
      "Feeling the same way! Want to chat?",
      "That's a mood! What's the story?",
    ];
  }
}

/**
 * Enhance vibe description with AI suggestions
 */
export async function enhanceVibeDescription(
  emoji: string,
  currentDescription: string,
  energyLevel: number,
  currentIntent: string[]
): Promise<string[]> {
  try {
    const model = getGeminiModel();

    const prompt = `Generate 3 alternative 6-7 word descriptions for a vibe card based on:
- Emoji: ${emoji}
- Current description: "${currentDescription}"
- Energy level: ${energyLevel}/10
- Intent: ${currentIntent.join(", ")}

Requirements:
- Each description must be 2-8 words
- Keep the same mood and energy as the original
- Make them varied but similar in tone
- Be creative and engaging

Return ONLY a JSON array of 3 strings, no other text. Example: ["Description one here", "Another description here", "Third description option"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const descriptions = JSON.parse(jsonMatch[0]);
      return Array.isArray(descriptions) ? descriptions.slice(0, 3) : [];
    }

    return [];
  } catch (error: any) {
    // Handle rate limit errors specifically
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      console.warn("Gemini API rate limit exceeded for description enhancement");
    } else {
      console.error("Error enhancing description with Gemini:", error);
    }
    return [];
  }
}

/**
 * Generate smart matching insights
 */
export async function generateMatchingInsights(
  userVibe: any,
  otherUserVibe: any,
  similarity: number
): Promise<string> {
  try {
    const model = getGeminiModel();

    const prompt = `Analyze why two users might be a good match based on their vibes:

User 1:
- Emoji: ${userVibe.emoji}
- Description: ${userVibe.description}
- Energy: ${userVibe.energyLevel}/10
- Intent: ${userVibe.currentIntent?.join(", ") || "N/A"}

User 2:
- Emoji: ${otherUserVibe.emoji}
- Description: ${otherUserVibe.description}
- Energy: ${otherUserVibe.energyLevel}/10
- Intent: ${otherUserVibe.currentIntent?.join(", ") || "N/A"}

Similarity Score: ${similarity}%

Generate a short, friendly insight (max 100 characters) explaining why they might connect well. Be specific and positive.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().slice(0, 100);
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return "You both share similar vibes!";
  }
}

/**
 * Content moderation for messages
 */
export async function moderateContent(messageText: string): Promise<{
  isSafe: boolean;
  reason?: string;
}> {
  try {
    const model = getGeminiModel();

    const prompt = `Analyze this message for inappropriate content, harassment, spam, or harmful language:

"${messageText}"

Respond with ONLY a JSON object: {"isSafe": true/false, "reason": "brief explanation if unsafe"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Default to safe if parsing fails
    return { isSafe: true };
  } catch (error) {
    console.error("Error moderating content with Gemini:", error);
    // Default to safe on error
    return { isSafe: true };
  }
}

