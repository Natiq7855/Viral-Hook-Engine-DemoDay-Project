import { buildGenerationResult } from "../src/lib/generateHooks";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { textInput, urlInput, niche, tone, useMock } = body ?? {};

    if (!textInput || String(textInput).trim().length === 0) {
      return Response.json({ error: "Input text is required" }, { status: 400 });
    }

    const result = await buildGenerationResult({
      textInput: String(textInput),
      urlInput: typeof urlInput === "string" ? urlInput : "",
      niche: typeof niche === "string" ? niche : "general",
      tone: typeof tone === "string" ? tone : "bold",
      useMock: Boolean(useMock),
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        success: false,
        errorDetails: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}