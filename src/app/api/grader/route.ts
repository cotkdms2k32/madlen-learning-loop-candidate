import { NextResponse } from "next/server";
import { generateStructured, ProviderError } from "@/lib/groq";
import { handleApiError, invalidInput, rateLimit } from "@/lib/http";
import { contentLanguageInstruction, detectContentLocale } from "@/lib/language";
import { essaySystemPrompt } from "@/lib/prompts";
import {
  essayJsonSchema,
  essayRequestSchema,
  essayResponseSchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const input = essayRequestSchema.safeParse(await request.json());
    if (!input.success) {
      return invalidInput("Paste an essay between 120 and 8,000 characters to receive feedback.");
    }

    const locale = detectContentLocale(input.data.essay);
    const result = await generateStructured({
      name: "essay_feedback",
      schema: essayJsonSchema,
      validator: essayResponseSchema,
      maxTokens: 2400,
      messages: [
        { role: "system", content: `${essaySystemPrompt}\n${contentLanguageInstruction(locale)}` },
        { role: "user", content: `Student essay:\n\n${input.data.essay}` },
      ],
    });

    const hasInventedPassage = result.passageFeedback.some(
      ({ passage }) => !input.data.essay.includes(passage),
    );
    if (hasInventedPassage) {
      throw new ProviderError(
        "The AI response did not pass passage checks.",
        502,
        true,
      );
    }

    const feedbackText = [
      ...result.criteria.map(({ rationale }) => rationale),
      ...result.passageFeedback.map(({ feedback }) => feedback),
      result.studentSummary,
    ].join("\n");
    if (detectContentLocale(feedbackText) !== locale) {
      throw new ProviderError("The AI response did not match the requested language.", 502, true);
    }

    return NextResponse.json({ result, locale });
  } catch (error) {
    return handleApiError(error);
  }
}
