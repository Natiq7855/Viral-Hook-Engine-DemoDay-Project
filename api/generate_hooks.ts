import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildGenerationResult } from "../src/lib/generateHooks";

export const config = {
  runtime: "nodejs",
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const { textInput, urlInput, niche, tone, useMock } = body ?? {};

    if (!textInput || String(textInput).trim().length === 0) {
      response.status(400).json({ error: "Input text is required" });
      return;
    }

    const result = await buildGenerationResult({
      textInput: String(textInput),
      urlInput: typeof urlInput === "string" ? urlInput : "",
      niche: typeof niche === "string" ? niche : "general",
      tone: typeof tone === "string" ? tone : "bold",
      useMock: Boolean(useMock),
    });

    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({
      success: false,
      errorDetails: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}