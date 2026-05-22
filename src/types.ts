export enum HookType {
  NEGATIVE_CONSTRAINT = "Negative Constraint",
  GATEKEEPER = "Gatekeeper",
  NUMBERS_BASED = "Numbers-based",
  HOT_TAKE = "Hot Take",
  CURIOSITY_GAP = "Curiosity Gap"
}

export interface HookResult {
  type: HookType;
  text: string;
  explanation: string;
  exampleVariation: string;
}

export interface ScriptClip {
  time: string;
  visualCue: string;
  audioSpeech: string;
  textOverlay: string;
}

export interface ShortFormScript {
  title: string;
  totalDurationSeconds: number;
  clips: ScriptClip[];
}

export interface EngineResult {
  hooks: HookResult[];
  script: ShortFormScript;
  originalTextSummary?: string;
}

export interface GenerationRequest {
  textInput: string;
  urlInput?: string;
  niche?: string;
  tone?: string;
}
