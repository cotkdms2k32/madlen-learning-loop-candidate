import { NextResponse } from "next/server";
import { ProviderError } from "@/lib/groq";

export type ApiErrorBody = {
  error: {
    message: string;
    retryable: boolean;
  };
};

export function invalidInput(message: string) {
  return NextResponse.json<ApiErrorBody>(
    { error: { message, retryable: false } },
    { status: 400 },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ProviderError) {
    return NextResponse.json<ApiErrorBody>(
      { error: { message: error.message, retryable: error.retryable } },
      { status: error.status },
    );
  }

  console.error("Unexpected API error", error);
  return NextResponse.json<ApiErrorBody>(
    {
      error: {
        message: "Something went wrong. Please try again.",
        retryable: true,
      },
    },
    { status: 500 },
  );
}

const buckets = new Map<string, { count: number; resetsAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 18;

export function rateLimit(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const key = forwarded?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + WINDOW_MS });
    return null;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          message: "You have made several requests. Please pause for a few minutes and try again.",
          retryable: true,
        },
      },
      { status: 429 },
    );
  }

  bucket.count += 1;
  return null;
}
