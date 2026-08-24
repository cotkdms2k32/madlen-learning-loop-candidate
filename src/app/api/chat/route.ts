import { NextResponse } from "next/server";
import { generateStructured, ProviderError } from "@/lib/groq";
import { handleApiError, invalidInput, rateLimit } from "@/lib/http";
import { contentLanguageInstruction, detectContentLocale } from "@/lib/language";
import { studentSystemPrompt } from "@/lib/prompts";
import {
  chatJsonSchema,
  chatRequestSchema,
  chatResponseSchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const input = chatRequestSchema.safeParse(await request.json());
    if (!input.success) {
      return invalidInput("Choose a topic and grade level, then enter a question.");
    }

    const locale = detectContentLocale(
      `${input.data.topic}\n${input.data.messages.map(({ content }) => content).join("\n")}`,
    );
    const answer = await generateStructured({
      name: "student_guidance",
      schema: chatJsonSchema,
      validator: chatResponseSchema,
      maxTokens: 1400,
      messages: [
        {
          role: "system",
          content: `${studentSystemPrompt}\n${contentLanguageInstruction(locale)}\nSelected topic: ${input.data.topic}\nSelected grade: ${input.data.gradeLevel}`,
        },
        ...input.data.messages,
      ],
    });

    if (detectContentLocale(`${answer.reply}\n${answer.checkForUnderstanding}`) !== locale) {
      throw new ProviderError("The AI response did not match the requested language.", 502, true);
    }

    return NextResponse.json({ answer, locale });
  } catch (error) {
    return handleApiError(error);
  }
}
