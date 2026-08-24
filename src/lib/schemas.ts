import { z } from "zod";

export const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
] as const;

export const gradeLevelSchema = z.enum(gradeLevels);

export const lessonRequestSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  gradeLevel: gradeLevelSchema,
});

export const lessonResponseSchema = z.object({
  lessonTitle: z.string().min(2).max(140),
  objectives: z.array(z.string().min(3).max(220)).min(2).max(4),
  keyConcepts: z.array(z.string().min(2).max(120)).min(3).max(6),
  outline: z.array(z.string().min(3).max(220)).min(4).max(6),
  slides: z
    .array(
      z.object({
        title: z.string().min(2).max(100),
        bullets: z.array(z.string().min(2).max(180)).min(2).max(4),
        visualSuggestion: z.string().min(3).max(220),
      }),
    )
    .length(5),
  discussionQuestions: z.array(z.string().min(3).max(220)).min(2).max(3),
});

export type LessonResponse = z.infer<typeof lessonResponseSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1200),
});

export const chatRequestSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  gradeLevel: gradeLevelSchema,
  messages: z.array(chatMessageSchema).min(1).max(10),
});

export const chatResponseSchema = z.object({
  reply: z.string().min(2).max(1800),
  mode: z.enum(["explanation", "guided_practice", "safety"]),
  hintLevel: z.number().int().min(0).max(3),
  checkForUnderstanding: z.string().min(2).max(260),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const essayRequestSchema = z.object({
  essay: z.string().trim().min(120).max(8000),
});

const criterionNameSchema = z.enum(["Argument", "Clarity", "Evidence", "Structure"]);

export const essayResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  criteria: z
    .array(
      z.object({
        name: criterionNameSchema,
        score: z.number().int().min(1).max(5),
        rationale: z.string().min(3).max(360),
      }),
    )
    .length(4),
  passageFeedback: z
    .array(
      z.object({
        passage: z.string().min(2).max(240),
        kind: z.enum(["strength", "improvement"]),
        feedback: z.string().min(3).max(420),
      }),
    )
    .min(3)
    .max(5),
  studentSummary: z.string().min(20).max(700),
}).superRefine((value, context) => {
  const names = new Set(value.criteria.map((criterion) => criterion.name));
  if (names.size !== 4) {
    context.addIssue({
      code: "custom",
      path: ["criteria"],
      message: "Each rubric criterion must appear exactly once.",
    });
  }

  const kinds = new Set(value.passageFeedback.map((item) => item.kind));
  if (!kinds.has("strength") || !kinds.has("improvement")) {
    context.addIssue({
      code: "custom",
      path: ["passageFeedback"],
      message: "Passage feedback must include a strength and an improvement.",
    });
  }
});

export type EssayResponse = z.infer<typeof essayResponseSchema>;

export const lessonJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    lessonTitle: { type: "string" },
    objectives: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
    keyConcepts: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    outline: { type: "array", minItems: 4, maxItems: 6, items: { type: "string" } },
    slides: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          bullets: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
          visualSuggestion: { type: "string" },
        },
        required: ["title", "bullets", "visualSuggestion"],
      },
    },
    discussionQuestions: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["lessonTitle", "objectives", "keyConcepts", "outline", "slides", "discussionQuestions"],
} as const;

export const chatJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    mode: { type: "string", enum: ["explanation", "guided_practice", "safety"] },
    hintLevel: { type: "integer", minimum: 0, maximum: 3 },
    checkForUnderstanding: { type: "string" },
  },
  required: ["reply", "mode", "hintLevel", "checkForUnderstanding"],
} as const;

export const essayJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    criteria: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: ["Argument", "Clarity", "Evidence", "Structure"] },
          score: { type: "integer", minimum: 1, maximum: 5 },
          rationale: { type: "string" },
        },
        required: ["name", "score", "rationale"],
      },
    },
    passageFeedback: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          passage: { type: "string" },
          kind: { type: "string", enum: ["strength", "improvement"] },
          feedback: { type: "string" },
        },
        required: ["passage", "kind", "feedback"],
      },
    },
    studentSummary: { type: "string" },
  },
  required: ["overallScore", "criteria", "passageFeedback", "studentSummary"],
} as const;
