import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper to safely initialize and retrieve the Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Highly adaptive mock response fallback generator based on input key phrases
function generateAdaptiveMockData(textInput: string, tone = "bold", niche = "general", urlInput = ""): any {
  // Create a reproducible RNG from the input so different inputs produce different outputs
  function seedFromString(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rngFromSeed(seed: number) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const base = (textInput || "") + "|" + (urlInput || "") + "|" + niche + "|" + tone;
  const rng = rngFromSeed(seedFromString(base));

  // Pick a focus keyword from the text (longest non-stopword), fallback to niche
  const stopwords = new Set(["the", "and", "for", "with", "that", "this", "from", "about", "are", "you", "your", "it's", "its", "have"]);
  const tokens = (textInput || "").toLowerCase().split(/\W+/).filter(Boolean);
  const candidates = tokens.filter((t) => t.length > 3 && !stopwords.has(t));
  const keyword = candidates.length ? candidates.sort((a, b) => b.length - a.length)[0] : niche;

  const topicTemplates = [
    `mastering ${keyword} fast`,
    `scaling ${keyword} with low effort`,
    `the brutal truth about ${keyword}`,
    `how to get results in ${keyword} in days`,
    `a tiny framework for ${keyword}`,
  ];

  const topic = topicTemplates[Math.floor(rng() * topicTemplates.length)];

  // Helper to choose a template and fill it
  function pick(arr: string[]) {
    return arr[Math.floor(rng() * arr.length)];
  }

  const hooks = [
    {
      type: "Negative Constraint",
      text: `Stop doing ${pick([keyword, topic, "that old approach"]) } — it's costing you progress.`,
      explanation: "Use an explicit 'stop' to trigger loss aversion and attention.",
      exampleVariation: `Don't start ${keyword} until you try this opposite approach.`,
    },
    {
      type: "Gatekeeper",
      text: `${pick(["Top creators","Insiders"]) } use this ${pick(["hidden step","shortcut","loop"]) } to win at ${keyword}.`,
      explanation: "Creates exclusivity and a desire to learn the secret.",
      exampleVariation: `This tiny trick separates the top 1% from everyone else in ${keyword}.`,
    },
    {
      type: "Numbers-based",
      text: `How I improved ${keyword} by ${Math.floor(rng() * 90) + 10}% in ${[7,14,30][Math.floor(rng() * 3)]} days.`,
      explanation: "Concrete numbers make the payoff believable and digestible.",
      exampleVariation: `A 3-step routine to boost your ${keyword} results in a week.`,
    },
    {
      type: "Hot Take",
      text: `${pick(["Everything everyone says about","Most advice on"]) } ${keyword} is wrong — here's why.`,
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

  // Build a short script using deterministic choices
  const verbs = ["watch","learn","copy","mirror","steal"];
  const action = verbs[Math.floor(rng() * verbs.length)];

  const script = {
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
        visualCue: `[Quick demo: show 2 steps highlighted]`,
        audioSpeech: `Step one: ${pick(["strip the fluff","copy this micro-habit","focus on this single metric"]) }.`,
        textOverlay: `${action.toUpperCase()} THIS`,
      },
      {
        time: "7-11s",
        visualCue: `[Speed montage of results]`,
        audioSpeech: `Do this for ${[3,7,14][Math.floor(rng() * 3)]} days and watch the delta.`,
        textOverlay: `RESULTS IN DAYS`,
      },
      {
        time: "11-15s",
        visualCue: `[Close with CTA pointing to link or bio]`,
        audioSpeech: `I left the exact template in the ${urlInput ? "link below" : "bio"}. Follow for daily experiments.`,
        textOverlay: `TEMPLATE ↓`,
      },
    ],
  };

  return {
    hooks,
    script,
    originalTextSummary: `A compact plan to improve ${keyword} using micro-habits and quick tests.`,
    seedPreview: base.slice(0, 80),
  };
}

// 1. API route to generate viral hooks and scripts
app.post("/api/generate_hooks", async (req, res) => {
  const { textInput, urlInput, niche = "general", tone = "bold", useMock = false } = req.body;

  if (!textInput || textInput.trim().length === 0) {
    return res.status(400).json({ error: "Input text is required" });
  }

  // If mock mode is forced, or if GEMINI_API_KEY is not defined, we use our adaptive mock generator
  if (useMock || !process.env.GEMINI_API_KEY) {
    console.log(`Generating adaptive mock data. Mode: ${useMock ? "forced_mock" : "missing_api_key"}`);
    // Simulate slight network lag for a more satisfying UX
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const mockData = generateAdaptiveMockData(textInput, tone, niche);
    return res.json({
      success: true,
      data: mockData,
      isMock: true,
      apiKeyAlert: !process.env.GEMINI_API_KEY
    });
  }

  try {
    const ai = getGeminiClient();
    
    // Formulate a robust prompt to get 5 distinct viral hooks and a 15-second visual/audio script
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
1. Five distinct Hook categories with:
   - "Negative Constraint" (Stop doing X, triggers loss-aversion or pain-point)
   - "Gatekeeper" (Exposing an insider secret, creates high exclusivity)
   - "Numbers-based" (Clear, achievable numbers time frame metrics)
   - "Hot Take" (Contrarian, spicy, debate-sparking observation)
   - "Curiosity Gap" (Opening a loop, shocking test statement, payoff delayed)
   
2. A 15-second short-form video script divided into 4 sequential timeline clips (spanning 0-15s total) featuring:
   - 'time' range (e.g. "0-3s", "3-7s", "7-11s", "11-15s")
   - 'visualCue' describing high-energy, fast-paced actions, green streams, or overlays in brackets []
   - 'audioSpeech' detailing what the creator actually says word-for-word
   - 'textOverlay' displaying bold captions on screen
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
                  type: {
                    type: Type.STRING,
                    description: "Hook strategy name. Must be one of: 'Negative Constraint', 'Gatekeeper', 'Numbers-based', 'Hot Take', 'Curiosity Gap'",
                  },
                  text: {
                    type: Type.STRING,
                    description: "Highly compelling short-form text hook.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A quick breakdown of why this engages user psychology.",
                  },
                  exampleVariation: {
                    type: Type.STRING,
                    description: "An alternative delivery or wording option.",
                  },
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
                      visualCue: { type: Type.STRING, description: "Detailed visual instructions inside bracket frames, e.g. [Cut to screen showing high percentage increase]" },
                      audioSpeech: { type: Type.STRING, description: "What the voiceover says out loud." },
                      textOverlay: { type: Type.STRING, description: "Capitalized keyword screen overlays." },
                    },
                    required: ["time", "visualCue", "audioSpeech", "textOverlay"],
                  },
                },
              },
              required: ["title", "totalDurationSeconds", "clips"],
            },
            originalTextSummary: {
              type: Type.STRING,
              description: "A single line summary of the input concepts.",
            },
          },
          required: ["hooks", "script"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text returned from Gemini API");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json({
      success: true,
      data: parsedResult,
      isMock: false
    });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    // Gracefully fallback to mock response if Gemini fails in any way (e.g., bad API key, quota limits) so they have an interactive experience
    const fallbackMock = generateAdaptiveMockData(textInput, tone, niche);
    return res.json({
      success: true,
      data: fallbackMock,
      isMock: true,
      errorDetails: error.message || "An error occurred with Gemini API. Fell back to dynamic template.",
      apiKeyAlert: true
    });
  }
});

// Serve Frontend Vite Setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Viral Hook Engine] running on http://0.0.0.0:${PORT}`);
  });
}

start();
