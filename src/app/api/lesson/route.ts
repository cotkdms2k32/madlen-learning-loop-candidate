import { NextResponse } from "next/server";
import { generateStructured, ProviderError } from "@/lib/groq";
import { handleApiError, invalidInput, rateLimit } from "@/lib/http";
import { contentLanguageInstruction, detectContentLocale } from "@/lib/language";
import { lessonSystemPrompt } from "@/lib/prompts";
import {
  lessonJsonSchema,
  lessonRequestSchema,
  lessonResponseSchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const input = lessonRequestSchema.safeParse(await request.json());
    if (!input.success) {
      return invalidInput("Add a topic and choose a grade level before generating a lesson.");
    }

    const locale = detectContentLocale(input.data.topic);
    const lesson = await generateStructured({
      name: "lesson_plan",
      schema: lessonJsonSchema,
      validator: lessonResponseSchema,
      maxTokens: 2600,
      messages: [
        { role: "system", content: `${lessonSystemPrompt}\n${contentLanguageInstruction(locale)}` },
        {
          role: "user",
          content: `Topic: ${input.data.topic}\nGrade level: ${input.data.gradeLevel}`,
        },
      ],
    });

    const generatedText = [
      lesson.lessonTitle,
      ...lesson.objectives,
      ...lesson.keyConcepts,
      ...lesson.outline,
      ...lesson.slides.flatMap((slide) => [slide.title, ...slide.bullets, slide.visualSuggestion]),
      ...lesson.discussionQuestions,
    ].join("\n");
    if (detectContentLocale(generatedText) !== locale) {
      throw new ProviderError("The AI response did not match the requested language.", 502, true);
    }

    return NextResponse.json({ lesson, locale });
  } catch (error) {
    return handleApiError(error);
  }
}
