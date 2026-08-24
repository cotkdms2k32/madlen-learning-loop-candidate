import { NextResponse } from "next/server";
import { generateStructured } from "@/lib/groq";
import { handleApiError, invalidInput, rateLimit } from "@/lib/http";
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

    const lesson = await generateStructured({
      name: "lesson_plan",
      schema: lessonJsonSchema,
      validator: lessonResponseSchema,
      maxTokens: 2600,
      messages: [
        { role: "system", content: lessonSystemPrompt },
        {
          role: "user",
          content: `Topic: ${input.data.topic}\nGrade level: ${input.data.gradeLevel}`,
        },
      ],
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error);
  }
}
