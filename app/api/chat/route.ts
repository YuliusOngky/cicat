import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { ChatApiRequest } from "@/lib/types";
import { getTopicById } from "@/lib/topics";

const client = new Anthropic();

function buildSystemPrompt(topicName: string): string {
  return `You are Cam, a friendly and natural native English speaker from California. You're having a genuine conversation with someone who wants to build confidence speaking English. They're intermediate to advanced level — they know English well but sometimes struggle with naturalness and confidence.

Your role:
- Have a real, engaging conversation about ${topicName}
- Be warm, curious, and encouraging — like a good friend
- Ask follow-up questions to keep the conversation flowing
- Keep responses to 2–4 sentences unless the topic warrants more
- Match the energy: casual for daily life, thoughtful for debates, excited for travel

After your conversational response, check if the user made any grammar, phrasing, or word-choice mistakes. If you find something to improve:
- Add it as: [CORRECTION: "their phrase" → "better version" | brief explanation]
- Only correct real errors or unnatural phrasing — not minor stylistic choices
- Be gentle and framing it as a tip, not a mistake
- Skip this entirely if their English was fine

If you used or the conversation touched on an interesting vocabulary word or expression worth noting:
- Add it as: [VOCAB: word/phrase | definition or usage note]
- Maximum 1 vocab item per turn, only if genuinely useful

Format example:
Your conversational reply goes here as normal prose.

[CORRECTION: "I am agree with you" → "I agree with you" | "agree" is already a verb, no "am" needed]
[VOCAB: "to weigh in" | to give your opinion on something, e.g. "She weighed in on the debate"]

Important: If there's no correction needed, don't include the [CORRECTION] tag at all. Same for vocab.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatApiRequest = await req.json();
    const { messages, topicId, topicName } = body;

    const topic = getTopicById(topicId);
    const systemPrompt = buildSystemPrompt(topicName || topic?.name || "general topics");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse correction
    const correctionMatch = rawText.match(
      /\[CORRECTION:\s*"([^"]+)"\s*→\s*"([^"]+)"\s*\|\s*([^\]]+)\]/
    );
    const vocabMatch = rawText.match(/\[VOCAB:\s*"?([^"|]+)"?\s*\|\s*([^\]]+)\]/);

    // Strip tags from message
    const message = rawText
      .replace(/\[CORRECTION:[^\]]+\]/g, "")
      .replace(/\[VOCAB:[^\]]+\]/g, "")
      .trim();

    const result = {
      message,
      correction: correctionMatch
        ? {
            original: correctionMatch[1].trim(),
            corrected: correctionMatch[2].trim(),
            explanation: correctionMatch[3].trim(),
          }
        : undefined,
      vocab: vocabMatch
        ? [{ word: vocabMatch[1].trim(), definition: vocabMatch[2].trim() }]
        : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
