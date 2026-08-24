export class AppApiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AppApiError";
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppApiError("We could not connect. Check your internet connection and try again.", true);
  }

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: { message?: string; retryable?: boolean } }
    | null;

  if (!response.ok) {
    const apiError =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : undefined;
    throw new AppApiError(
      apiError?.message || "Something went wrong. Please try again.",
      apiError?.retryable ?? true,
    );
  }

  return payload as T;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
