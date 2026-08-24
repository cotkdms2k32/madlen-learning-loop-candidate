import "server-only";
import type { ZodType } from "zod";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type StructuredRequest<T> = {
  name: string;
  schema: Record<string, unknown>;
  validator: ZodType<T>;
  messages: ProviderMessage[];
  maxTokens?: number;
};

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export async function generateStructured<T>({
  name,
  schema,
  validator,
  messages,
  maxTokens = 2200,
}: StructuredRequest<T>): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ProviderError("AI service is not configured.", 503, false);
  }

  let response: Response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages,
        temperature: 0.35,
        max_completion_tokens: maxTokens,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name,
            strict: true,
            schema,
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(28_000),
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    throw new ProviderError(
      isTimeout ? "The AI service took too long to respond." : "The AI service could not be reached.",
      503,
      true,
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ProviderError("The free AI quota is busy right now.", 429, true);
    }
    if (response.status >= 500) {
      throw new ProviderError("The AI service is temporarily unavailable.", 503, true);
    }
    if (response.status === 401 || response.status === 403) {
      throw new ProviderError("The AI service is not configured correctly.", 503, false);
    }
    throw new ProviderError("The AI service could not complete this request.", 502, true);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError("The AI service returned an empty response.", 502, true);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ProviderError("The AI response could not be read.", 502, true);
  }

  const result = validator.safeParse(parsed);
  if (!result.success) {
    throw new ProviderError("The AI response did not pass quality checks.", 502, true);
  }
  return result.data;
}
