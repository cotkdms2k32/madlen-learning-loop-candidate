import { describe, expect, it } from "vitest";
import {
  chatRequestSchema,
  chatResponseSchema,
  essayRequestSchema,
  essayResponseSchema,
  lessonRequestSchema,
  lessonResponseSchema,
} from "@/lib/schemas";

describe("Lesson Prep validation", () => {
  const validSlide = {
    title: "A slide title",
    bullets: ["First useful point", "Second useful point"],
    visualSuggestion: "A simple labelled diagram",
  };

  it("accepts a classroom-ready plan with exactly five slides", () => {
    const result = lessonResponseSchema.safeParse({
      lessonTitle: "Balanced ecosystems",
      objectives: ["Explain how organisms depend on one another", "Predict the effect of one change"],
      keyConcepts: ["Food web", "Population", "Balance"],
      outline: ["Connect to prior knowledge", "Model the concept", "Guided practice", "Exit check"],
      slides: Array.from({ length: 5 }, (_, index) => ({ ...validSlide, title: `Slide ${index + 1}` })),
      discussionQuestions: ["What could disrupt this system?", "How might it recover?"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects plans with any number other than five slides", () => {
    const result = lessonResponseSchema.safeParse({
      lessonTitle: "Balanced ecosystems",
      objectives: ["Explain a relationship", "Predict a change"],
      keyConcepts: ["Food web", "Population", "Balance"],
      outline: ["Open", "Model", "Practice", "Check"],
      slides: Array.from({ length: 4 }, () => validSlide),
      discussionQuestions: ["What changes?", "Why does it matter?"],
    });

    expect(result.success).toBe(false);
  });
});

describe("Student Chat validation", () => {
  it("accepts a first progressive hint without a final-answer field", () => {
    const result = chatResponseSchema.safeParse({
      reply: "First, find a common denominator for 4 and 8.",
      mode: "guided_practice",
      hintLevel: 1,
      checkForUnderstanding: "What could you rename 3/4 as using eighths?",
    });

    expect(result.success).toBe(true);
  });

  it("limits conversation size and message length", () => {
    expect(chatRequestSchema.safeParse({
      topic: "Fractions",
      gradeLevel: "Grade 5",
      messages: Array.from({ length: 11 }, () => ({ role: "user", content: "Help me." })),
    }).success).toBe(false);
  });
});

describe("Essay Grader validation", () => {
  const criteria = ["Argument", "Clarity", "Evidence", "Structure"].map((name) => ({
    name,
    score: 4,
    rationale: "The essay demonstrates this criterion with room to improve.",
  }));

  it("accepts four criteria, passage feedback, and a shareable summary", () => {
    const result = essayResponseSchema.safeParse({
      overallScore: 80,
      criteria,
      passageFeedback: [
        { passage: "School gardens should be part", kind: "strength", feedback: "This states a clear position." },
        { passage: "Some people argue", kind: "strength", feedback: "This acknowledges a counterargument." },
        { passage: "benefits the whole community", kind: "improvement", feedback: "Add a concrete example of this benefit." },
      ],
      studentSummary: "You present a clear claim and respond to another viewpoint. Add one specific source or example next.",
    });

    expect(result.success).toBe(true);
  });

  it("enforces sensible essay and topic input limits", () => {
    expect(essayRequestSchema.safeParse({ essay: "Too short" }).success).toBe(false);
    expect(lessonRequestSchema.safeParse({ topic: "", gradeLevel: "Grade 7" }).success).toBe(false);
  });

  it("rejects duplicate rubric criteria", () => {
    const duplicateCriteria = criteria.map((criterion, index) => (
      index === 1 ? { ...criterion, name: "Argument" } : criterion
    ));

    const result = essayResponseSchema.safeParse({
      overallScore: 75,
      criteria: duplicateCriteria,
      passageFeedback: [
        { passage: "First quote", kind: "strength", feedback: "Works well." },
        { passage: "Second quote", kind: "improvement", feedback: "Needs support." },
        { passage: "Third quote", kind: "improvement", feedback: "Clarify this." },
      ],
      studentSummary: "Your central idea is clear; add stronger evidence next.",
    });

    expect(result.success).toBe(false);
  });
});
