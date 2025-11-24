import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/src/app/lib/gemini";

// Predefined overthinking thoughts for fallback
const OVERTHINKING_THOUGHTS = [
  "They replied 'hmm'... are they losing interest?",
  "I sent a message 10 minutes ago and no reply. Did I say something wrong?",
  "They used a period instead of an exclamation mark. Are they mad?",
  "They left me on read. Did I overshare?",
  "They said 'lol' but is it genuine laughter or awkward laughter?",
  "They're online but haven't opened my message. They must be ignoring me.",
  "I saw they updated their story but didn't reply. They're definitely avoiding me.",
  "They said 'we'll see' - does that mean yes or no?",
  "They didn't react to my message. Am I boring them?",
  "They replied after 2 hours. Are they not interested?",
  "They used 'k' instead of 'okay'. Are they annoyed?",
  "They didn't respond to my question. Did I ask something wrong?",
  "They're posting memes but not replying. They must be busy with someone else.",
  "They said 'maybe later'. Is that a polite no?",
  "They read my message at 2am but replied in the morning. Did they forget?",
  "They removed me from their close friends. What did I do?",
  "They liked someone else's comment but not mine. Are they avoiding me?",
  "They said 'that's cool' - is that enthusiasm or indifference?",
  "They haven't posted in 3 days. Are they okay or just ghosting me?",
  "They replied with a single emoji. Are they not interested in talking?",
];

// Predefined counter-thoughts for fallback
const COUNTER_THOUGHTS = [
  "Or maybe they just typed with one finger.",
  "Or maybe they're actually busy and not everything is about you.",
  "Or maybe they just have a different texting style.",
  "Or maybe they saw it and are crafting the perfect response.",
  "Or maybe they're laughing genuinely and you're overthinking it.",
  "Or maybe they're online but working/studying and will reply later.",
  "Or maybe they posted that story hours ago and haven't checked DMs.",
  "Or maybe 'we'll see' literally means they'll see and decide later.",
  "Or maybe they just didn't feel like reacting - not everything needs a reaction.",
  "Or maybe they were actually busy and replied when they could.",
  "Or maybe 'k' is just their texting style and they're not mad at all.",
  "Or maybe they didn't see that question and are responding to something else.",
  "Or maybe they post memes on autopilot but save conversations for when they have time.",
  "Or maybe 'maybe later' means maybe later - no hidden meaning.",
  "Or maybe they saw it at 2am, thought 'I'll reply properly in morning' and actually did.",
  "Or maybe they're reorganizing their close friends and it's not personal.",
  "Or maybe they liked that comment before seeing yours and haven't been online since.",
  "Or maybe 'that's cool' means that's cool and they genuinely think it's cool.",
  "Or maybe they're taking a social media break (yes, people do that).",
  "Or maybe they're the type who sends emojis as full responses and it's normal for them.",
];

export async function GET(req: NextRequest) {
  try {
    // Try to use Gemini AI for generation
    try {
      const model = getGeminiModel();

      const prompt = `Generate a random, relatable overthinking thought that someone might have in a social/relationship context. Make it funny, relatable, and something an overthinker would genuinely worry about. It should be a single sentence/question.

Then, generate a ridiculous but logical counter-thought that makes the overthinking thought seem silly. Make it funny, realistic, and reassuring.

Examples:
Overthink: "They replied 'hmm'... are they losing interest?"
Counter: "Or maybe they just typed with one finger."

Return ONLY a JSON object in this format: {"overthink": "the overthinking thought", "counter": "the counter thought"}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.overthink && parsed.counter) {
          return NextResponse.json({
            success: true,
            overthink: parsed.overthink,
            counter: parsed.counter,
          });
        }
      }
    } catch (aiError) {
      // If AI fails, use fallback
      console.log("AI generation failed, using fallback:", aiError);
    }

    // Fallback: Use predefined thoughts
    const randomIndex = Math.floor(Math.random() * OVERTHINKING_THOUGHTS.length);
    return NextResponse.json({
      success: true,
      overthink: OVERTHINKING_THOUGHTS[randomIndex],
      counter: COUNTER_THOUGHTS[randomIndex],
    });
  } catch (error: any) {
    console.error("Overthink Game Error:", error);
    
    // Ultimate fallback
    const randomIndex = Math.floor(Math.random() * OVERTHINKING_THOUGHTS.length);
    return NextResponse.json({
      success: true,
      overthink: OVERTHINKING_THOUGHTS[randomIndex],
      counter: COUNTER_THOUGHTS[randomIndex],
    });
  }
}

