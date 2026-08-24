import { NextResponse } from "next/server";
import { generateStructured } from "@/lib/groq";
import { handleApiError, invalidInput, rateLimit } from "@/lib/http";
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

    const answer = await generateStructured({
      name: "student_guidance",
      schema: chatJsonSchema,
      validator: chatResponseSchema,
      maxTokens: 1400,
      messages: [
        {
          role: "system",
          content: `${studentSystemPrompt}\nSelected topic: ${input.data.topic}\nSelected grade: ${input.data.gradeLevel}`,
        },
        ...input.data.messages,
      ],
    });

    return NextResponse.json({ answer });
  } catch (error) {
    return handleApiError(error);
  }
}
