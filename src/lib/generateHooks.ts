import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

function seedFromString(value: string) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function rngFromSeed(seed: number) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, values: T[]) {
  return values[Math.floor(rng() * values.length)];
}

export function generateAdaptiveMockData(textInput: string, tone = "bold", niche = "general", urlInput = "") {
  const base = `${textInput || ""}|${urlInput || ""}|${niche}|${tone}`;
  const rng = rngFromSeed(seedFromString(base));
  const stopwords = new Set(["the", "and", "for", "with", "that", "this", "from", "about", "are", "you", "your", "it's", "its", "have"]);
  const tokens = (textInput || "").toLowerCase().split(/\W+/).filter(Boolean);
  const candidates = tokens.filter((token) => token.length > 3 && !stopwords.has(token));
  const keyword = candidates.length ? candidates.sort((a, b) => b.length - a.length)[0] : niche;

  const hooks = [
    {
      type: "Negative Constraint",
      text: `Stop doing ${pick(rng, [keyword, `mastering ${keyword} fast`, "that old approach"])} — it's costing you progress.`,
      explanation: "Use an explicit 'stop' to trigger loss aversion and attention.",
      exampleVariation: `Don't start ${keyword} until you try this opposite approach.`,
    },
    {
      type: "Gatekeeper",
      text: `${pick(rng, ["Top creators", "Insiders"])} use this ${pick(rng, ["hidden step", "shortcut", "loop"])} to win at ${keyword}.`,
      explanation: "Creates exclusivity and a desire to learn the secret.",
      exampleVariation: `This tiny trick separates the top 1% from everyone else in ${keyword}.`,
    },
    {
      type: "Numbers-based",
      text: `How I improved ${keyword} by ${Math.floor(rng() * 90) + 10}% in ${pick(rng, [7, 14, 30])} days.`,
      explanation: "Concrete numbers make the payoff believable and digestible.",
      exampleVariation: `A 3-step routine to boost your ${keyword} results in a week.`,
    },
    {
      type: "Hot Take",
      text: `${pick(rng, ["Everything everyone says about", "Most advice on"])} ${keyword} is wrong — here's why.`,
      explanation: "Contrarian framing sparks debate and comments.",
      exampleVariation: `The mainstream ${keyword} playbook is actually slowing you down.`,
    },
    {
      type: "Curiosity Gap",
      text: `I tried a weird ${keyword} test for 48 hours — the outcome changed everything.`,
      explanation: "Opens a narrative loop the viewer must follow to closure.",
      exampleVariation: `There's one invisible trap in ${keyword} nobody mentions...`,
    },
  ];

  const action = pick(rng, ["watch", "learn", "copy", "mirror", "steal"]);

  return {
    hooks,
    script: {
      title: `Quick ${keyword} Growth Script: ${Math.floor(rng() * 1000)}`,
      totalDurationSeconds: 15,
      clips: [
        {
          time: "0-3s",
          visualCue: `[Close-up on phone with ${keyword} metrics, rapid zoom]`,
          audioSpeech: `Stop wasting time on generic ${keyword} advice — try this instead.`,
          textOverlay: `STOP ${keyword.toUpperCase()}`,
        },
        {
          time: "3-7s",
          visualCue: "[Quick demo: show 2 steps highlighted]",
          audioSpeech: `Step one: ${pick(rng, ["strip the fluff", "copy this micro-habit", "focus on this single metric"])}.`,
          textOverlay: `${action.toUpperCase()} THIS`,
        },
        {
          time: "7-11s",
          visualCue: "[Speed montage of results]",
          audioSpeech: `Do this for ${pick(rng, [3, 7, 14])} days and watch the delta.`,
          textOverlay: "RESULTS IN DAYS",
        },
        {
          time: "11-15s",
          visualCue: "[Close with CTA pointing to link or bio]",
          audioSpeech: `I left the exact template in the ${urlInput ? "link below" : "bio"}. Follow for daily experiments.`,
          textOverlay: "TEMPLATE ↓",
        },
      ],
    },
    originalTextSummary: `A compact plan to improve ${keyword} using micro-habits and quick tests.`,
    seedPreview: base.slice(0, 80),
  };
}

export async function buildGenerationResult(input: { textInput: string; urlInput?: string; niche?: string; tone?: string; useMock?: boolean }) {
  const { textInput, urlInput = "", niche = "general", tone = "bold", useMock = false } = input;

  if (useMock || !process.env.GEMINI_API_KEY) {
    return {
      success: true,
      data: generateAdaptiveMockData(textInput, tone, niche, urlInput),
      isMock: true,
      apiKeyAlert: !process.env.GEMINI_API_KEY,
    };
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
You are a elite short-form video creator and viral retention specialist (TikTok, YouTube Shorts, Instagram Reels expert).
Analyze the following source text and extract 5 distinct, highly engaging hook variants and a perfectly syncopated 15-second creator script.

Source Text:
"""
${textInput}
"""

Context Details:
- Target Niche: ${niche}
- Tone Strategy: ${tone}
${urlInput ? `- Source URL (for context reference): ${urlInput}` : ""}

Please generate exactly:
1. Five distinct Hook categories.
2. A 15-second short-form video script divided into 4 sequential timeline clips.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a master viral editor. Produce extreme retention hooks. Do not make boring, corporate, or safe announcements. Make them punchy and click-worthy.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                text: { type: Type.STRING },
                explanation: { type: Type.STRING },
                exampleVariation: { type: Type.STRING },
              },
              required: ["type", "text", "explanation", "exampleVariation"],
            },
          },
          script: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              totalDurationSeconds: { type: Type.INTEGER },
              clips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    visualCue: { type: Type.STRING },
                    audioSpeech: { type: Type.STRING },
                    textOverlay: { type: Type.STRING },
                  },
                  required: ["time", "visualCue", "audioSpeech", "textOverlay"],
                },
              },
            },
            required: ["title", "totalDurationSeconds", "clips"],
          },
          originalTextSummary: { type: Type.STRING },
        },
        required: ["hooks", "script", "originalTextSummary"],
      },
    },
  });

    return {
      success: true,
      data: JSON.parse(response.text || "{}"),
      isMock: false,
      apiKeyAlert: false,
    };
  } catch (error) {
    return {
      success: true,
      data: generateAdaptiveMockData(textInput, tone, niche, urlInput),
      isMock: true,
      apiKeyAlert: true,
      errorDetails: error instanceof Error ? error.message : "Gemini unavailable; using fallback content.",
    };
  }
}