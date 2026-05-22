import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Copy,
  Check,
  Flame,
  Zap,
  RotateCcw,
  Info,
  Play,
  Square,
  Clock,
  Laptop,
  AlertTriangle,
  Lightbulb,
  FileText,
  Sliders,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { HookType, HookResult, ShortFormScript, EngineResult } from "./types.ts";

export default function App() {
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("Finance & Tech");
  const [selectedTone, setSelectedTone] = useState("spicy"); // spicy, educational, cinematic, bold
  const [useMock, setUseMock] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<"hooks" | "script">("hooks");

  // Simulated Retention tips during loading
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const retentionTips = [
    "🔥 LOSS AVERSION: Negative constraint hooks are 34% more effective at stopping the doom-scroll.",
    "👀 TEXT OVERLAYS: Using highlighted CAPS overlays increases short-form readability on silent scrolling by 60%.",
    "⚡ SPEED TO HOOK: The first 400 milliseconds of video determine 80% of scroll-away rate. Keep hooks brief!",
    "🤫 GATEKEEPER EFFECT: Creating the illusion of custom underground secrets activates high status curiosity loops.",
    "⏱️ TIMESTAMPS: Breaking a 15-second video into four micro-acts increases overall average view duration."
  ];

  // Playback Teleprompter state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackClipIndex, setPlaybackClipIndex] = useState(0);
  const [playbackTimeRemaining, setPlaybackTimeRemaining] = useState(15);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % retentionTips.length);
      }, 3050);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle Preset Clicks to make it ultra fast to test!
  const PRESETS = [
    {
      title: "Fintech & Passive Income",
      snippet: "Most passive income is a complete scam because you still trade your time to configure complicated spreadsheets. The real secret is using minor automation scrapers that find broken digital assets and resell them to busy local small businesses for $150 a pop. You don't need coding knowledge, just a basic workflow tool.",
      url: "https://creatorhustles.com/passive-income-strategy-2026",
      niche: "Finance & Tech",
      tone: "spicy"
    },
    {
      title: "UI/UX Design Standards",
      snippet: "Traditional design portfolios are utterly generic now. Top tech firms don't want to see a standard mobile food-delivery app prototype anymore. They want to see complex, boring data dashboards designed flawlessly. To stand out, go build high-density billing tables, enterprise permission management, and complex workflow pipelines. Focus on edge-cases, error handling, and keyboard navigation.",
      url: "https://designerguide.org/edge-case-portfolio-secrets",
      niche: "UI/UX Design",
      tone: "bold"
    },
    {
      title: "Physical Optimization",
      snippet: "You are not lacking workout motivation, you are getting wrecked by decision fatigue before you even reach the weight rack. Real fitness starts with planning your exactly 3 core lift weights on Sunday night, leaving only one pair of shoes in the hallway, and having your training journal physically resting open on the study table. Set it up so it is harder to escape than to execute.",
      url: "",
      niche: "Fitness & Mindset",
      tone: "educational"
    }
  ];

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTextInput(preset.snippet);
    setUrlInput(preset.url);
    setSelectedNiche(preset.niche);
    setSelectedTone(preset.tone);
  };

  // Run generation logic via the backend API
  const handleGenerate = async () => {
    if (!textInput.trim()) {
      setErrorText("Provide some raw content or paste article text to generate material.");
      return;
    }

    setLoading(true);
    setErrorText(null);
    setResult(null);
    setIsPlaying(false);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/api/generate_hooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textInput,
          urlInput: urlInput || undefined,
          niche: selectedNiche,
          tone: selectedTone,
          useMock: useMock
        })
      });

      const contentType = response.headers.get("content-type") || "";
      const resData = contentType.includes("application/json")
        ? await response.json()
        : { success: false, errorDetails: await response.text() };

      if (!response.ok) {
        throw new Error(resData.errorDetails || `Request failed with status ${response.status}`);
      }

      if (resData.success) {
        setResult(resData.data);
        if (resData.apiKeyAlert) {
          setApiKeyMissing(true);
        } else {
          setApiKeyMissing(false);
        }
      } else {
        setErrorText(resData.errorDetails || "Failed to generate viral content.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText("Server request crashed. Ensure application is fully loaded and running.");
    } finally {
      setLoading(false);
    }
  };

  // Clipboard copy utilities
  const handleCopyHook = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFullScript = (script: ShortFormScript) => {
    let fullText = `TITLES: ${script.title}\n\n`;
    script.clips.forEach((c) => {
      fullText += `[${c.time}]\nVisuals: ${c.visualCue}\nSpoken: "${c.audioSpeech}"\nOverlay: ${c.textOverlay}\n\n`;
    });
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Interactive Live Script Player
  const startScriptPlayback = () => {
    if (!result || !result.script || result.script.clips.length === 0) return;
    setIsPlaying(true);
    setPlaybackClipIndex(0);
    setPlaybackTimeRemaining(15);

    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);

    let currentClip = 0;
    let secondsLeft = 15;

    playbackIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setPlaybackTimeRemaining(secondsLeft);

      if (secondsLeft <= 0) {
        setIsPlaying(false);
        if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      } else if (secondsLeft <= 4) {
        currentClip = 3;
      } else if (secondsLeft <= 8) {
        currentClip = 2;
      } else if (secondsLeft <= 12) {
        currentClip = 1;
      } else {
        currentClip = 0;
      }
      setPlaybackClipIndex(currentClip);
    }, 1000);
  };

  const stopScriptPlayback = () => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  return (
    <div id="viral-hook-app" className="min-h-screen bg-[#0a0a0c] text-slate-200 flex flex-col font-sans overflow-x-hidden border-4 border-[#1a1a1e]">
      
      {/* Header Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f12]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">V</div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase italic">Viral Hook Engine</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiKeyMissing ? "bg-amber-400 animate-pulse" : "bg-indigo-400"}`} />
            <span className="text-[10px] text-slate-550 font-mono tracking-wider">
              {apiKeyMissing ? "DEMO MODE active" : "GEMINI PLATFORM CONNECTED"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-lg">
            <button
              id="toggle-ai"
              onClick={() => setUseMock(false)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${!useMock && !apiKeyMissing ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Gemini AI
            </button>
            <button
              id="toggle-mock"
              onClick={() => setUseMock(true)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${useMock || apiKeyMissing ? "bg-amber-600/20 text-amber-300 border border-amber-900/50" : "text-slate-400 hover:text-white"}`}
            >
              Demo Template
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Api Key Alert Indicator */}
        {apiKeyMissing && !useMock && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start gap-3 text-xs md:text-sm shadow-xl">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="text-amber-200 font-semibold block mb-0.5">Note: Interactive Demo Active</strong>
              Our active system has seamlessly set up the **Viral Hook Engine** layout. You can try any of our custom interactive presets below! To toggle live custom queries, make sure your api key is loaded under the **Settings {" > "} Secrets** panel.
            </div>
          </div>
        )}

        {/* INPUT SOURCE & PARAMETERS CONTAINER */}
        <section className="bg-[#141418] border border-white/5 p-5 md:p-6 rounded-2xl shadow-2xl relative">
          
          <div className="flex flex-col gap-4">
            
            {/* Header tags for input panel */}
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Input Source (URL or Raw Text Description)
              </label>
              <span className="text-[10px] text-indigo-500 font-mono hidden sm:inline">AI MODEL: GEMINI-3.5-FLASH</span>
            </div>

            {/* Custom interactive preset quick buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Load Preset:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  id={`preset-btn-${idx}`}
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 text-xs bg-white/5 hover:bg-indigo-600/10 hover:text-indigo-300 border border-white/5 rounded-lg text-slate-300 font-medium transition duration-150 text-left"
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Textarea Area containing input, context elements */}
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your blog content, transcript, newsletter draft, copy-write, or raw video ideas here..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-600 resize-none transition-all"
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {textInput.length > 0 && (
                  <button
                    onClick={() => { setTextInput(""); setUrlInput(""); }}
                    className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 border border-white/5 rounded-lg flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Box
                  </button>
                )}
              </div>
            </div>

            {/* Advanced configurations drawer setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Reference url link
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://creatorhustles.com/viral-article-link"
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-slate-205 focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Target Niche
                </label>
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/40"
                >
                  <option value="Finance & Tech">Finance & Tech</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Fitness & Mindset">Fitness & Mindset</option>
                  <option value="SaaS & Marketing">SaaS & Marketing</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Delivery strategies
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/40"
                >
                  <option value="spicy">Contrarian (Spicy & Contrarian)</option>
                  <option value="bold">Retention (Maximum Shock Value)</option>
                  <option value="educational">Authority (Educational & Mindset)</option>
                  <option value="cinematic">Cinematic Story (Enthralling Hooks)</option>
                </select>
              </div>

            </div>

            {/* Error logs, if any */}
            {errorText && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            {/* Button trigger with premium glow metrics */}
            <div className="flex justify-end pt-2">
              <button
                id="generate-button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer uppercase tracking-tight"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Creator Feed...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Hooks & Scripts</span>
                    <Zap className="w-4 h-4 fill-white animate-pulse" />
                  </>
                )}
              </button>
            </div>

          </div>

        </section>

        {/* LOADING ACTIVE HUD */}
        {loading && (
          <div className="bg-[#141418] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="relative mb-6">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-200">Processing Shortform Metrics...</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-2">
              Formatting hook psychology, mapping camera angles, and rendering timeline scripts.
            </p>

            <div className="w-full max-w-md mt-6 pt-4 border-t border-white/5 text-center min-h-[60px]">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Viral Retention Principle</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-slate-350 leading-relaxed max-w-sm mx-auto"
                >
                  {retentionTips[currentTipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* EMPTY PLACEHOLDER */}
        {!loading && !result && (
          <div className="bg-[#141418]/60 border border-dashed border-white/10 p-12 rounded-2xl flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-slate-500">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">Creator Hub Awaiting Action</h3>
            <p className="text-xs text-slate-550 max-w-md mt-1 mb-5">
              Select one of our high-performing creator presets above or write raw paragraphs on your draft, then tap generate to see instantly formulated hooks.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <span className="text-[10px] px-2.5 py-1 bg-white/5 text-slate-400 rounded-full border border-white/5 font-mono">Negative Constraint</span>
              <span className="text-[10px] px-2.5 py-1 bg-white/5 text-slate-400 rounded-full border border-white/5 font-mono">Numbers-based</span>
              <span className="text-[10px] px-2.5 py-1 bg-white/5 text-slate-400 rounded-full border border-white/5 font-mono">Director&apos;s Cut Script</span>
            </div>
          </div>
        )}

        {/* RESULTS SUITE */}
        {!loading && result && (
          <div className="space-y-6">
            
            {/* Navigational Sub-Tabs */}
            <div className="flex border-b border-white/10 bg-[#141418] rounded-xl p-1">
              <button
                id="hook-tab-trigger"
                onClick={() => { setActiveTab("hooks"); stopScriptPlayback(); }}
                className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "hooks" ? "bg-white/5 text-white" : "text-slate-450 hover:text-slate-250 hover:bg-white/5"}`}
              >
                <Flame className={`w-4 h-4 ${activeTab === "hooks" ? "text-indigo-400" : ""}`} />
                <span>5 Hook Categories</span>
              </button>
              
              <button
                id="script-tab-trigger"
                onClick={() => setActiveTab("script")}
                className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "script" ? "bg-white/5 text-white" : "text-slate-450 hover:text-slate-250 hover:bg-white/5"}`}
              >
                <Play className={`w-4 h-4 ${activeTab === "script" ? "text-indigo-400" : ""}`} />
                <span>15s Script & Preview Player</span>
              </button>
            </div>

            {/* TAB 1: 5 HOOK VARIANTS */}
            {activeTab === "hooks" && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {result.hooks.map((hook, index) => {
                  
                  // Stylings mapped precisely from Design guidelines for each of the 5 categories
                  const getHookStyles = (type: string) => {
                    switch (type) {
                      case "Negative Constraint":
                        return { badge: "bg-red-500/10 text-red-400 border-red-500/20" };
                      case "Gatekeeper":
                        return { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
                      case "Numbers-based":
                        return { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
                      case "Hot Take":
                        return { badge: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" };
                      case "Curiosity Gap":
                      default:
                        return { badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
                    }
                  };

                  const styles = getHookStyles(hook.type);

                  return (
                    <div
                      key={index}
                      id={`hook-card-${index}`}
                      className="bg-[#141418] border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors group text-left min-h-[310px]"
                    >
                      <div className="mb-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter border ${styles.badge}`}>
                          {hook.type}
                        </span>
                        
                        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-100 group-hover:text-white transition">
                          &ldquo;{hook.text}&rdquo;
                        </p>
                        
                        {/* Interactive explanations and variations displayed inside card details */}
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">Psych Loop:</span>
                            <p className="text-[11px] text-slate-400 leading-normal">{hook.explanation}</p>
                          </div>
                          {hook.exampleVariation && (
                            <div className="bg-black/30 p-2 rounded border border-white/5">
                              <span className="text-[9px] text-indigo-400 uppercase font-black block tracking-wider">Alt take:</span>
                              <p className="text-[11px] text-slate-400 italic leading-snug">&ldquo;{hook.exampleVariation}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyHook(hook.text, index)}
                        className="w-full mt-3 py-2 bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-200 border border-white/5 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-450" />
                            <span>Copy Hook</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {/* TAB 2: DIRECTOR'S CUT SCRIPT & TELEPROMPTER */}
            {activeTab === "script" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Teleprompter Simulation screen - col-span-5 */}
                <div className="lg:col-span-5 flex flex-col">
                  
                  <div className="bg-gradient-to-br from-[#1a1a22] to-[#141418] border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col h-full min-h-[380px] justify-between shadow-2xl">
                    
                    {/* Background SVG style deco */}
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M10 8l6 4-6 4V8z"/>
                      </svg>
                    </div>

                    {/* Top status bar of virtual screen */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-2 w-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`} />
                        <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">DIRECTOR SCRIPT PREVIEW</h3>
                      </div>
                      <span className="text-[10px] bg-black/40 text-slate-400 px-2.5 py-0.5 rounded font-mono border border-white/5">
                        {isPlaying ? `TICTAC: ${playbackTimeRemaining}s` : "STANDBY"}
                      </span>
                    </div>

                    {/* Captions flow main board */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 relative z-10 my-4">
                      {isPlaying ? (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={playbackClipIndex}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-4 w-full"
                          >
                            <div className="text-xl md:text-2xl font-black tracking-wider text-yellow-300 drop-shadow-md bg-black/70 px-4 py-3 rounded-lg uppercase border border-yellow-400/20 font-mono inline-block">
                              {result.script.clips[playbackClipIndex].textOverlay}
                            </div>
                            
                            <p className="text-sm font-bold text-slate-100 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed max-w-sm mx-auto">
                              🎤 &ldquo;{result.script.clips[playbackClipIndex].audioSpeech}&rdquo;
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <div className="space-y-3">
                          <Play className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Press &ldquo;Simulate Pacing&rdquo; below to run the 15-second visual timing clock and check speech pacing speed!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Active video cues frame */}
                    <div className="relative z-10 bg-black/60 p-3 rounded-xl border border-white/10 text-xs">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block tracking-wider mb-1">
                        🎬 Visual Action Directions
                      </span>
                      <p className="text-indigo-400/90 font-mono italic">
                        {isPlaying 
                          ? result.script.clips[playbackClipIndex].visualCue
                          : "[Stage instructions update dynamically in sync during simulation mode]"
                        }
                      </p>
                    </div>

                    {/* Controller layer at bottom */}
                    <div className="relative z-10 pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      {!isPlaying ? (
                        <button
                          onClick={startScriptPlayback}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Simulate Pacing</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopScriptPlayback}
                          className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop Clock</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyFullScript(result.script)}
                        className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-bold border border-white/5 rounded-lg uppercase tracking-wider flex items-center gap-1"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>Copy Script</span>
                      </button>
                    </div>

                  </div>

                </div>

                {/* TRANSCRIPT FLOW - col-span-7 */}
                <div className="lg:col-span-7">
                  
                  <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 shadow-2xl h-full flex flex-col justify-between">
                    
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                        <div>
                          <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-[0.2em]">DIRECTOR’S COMPLETE TRANSCRIPT</span>
                          <h4 className="text-sm font-bold text-white mt-1">{result.script.title}</h4>
                        </div>
                        <span className="text-xs bg-[#1a1a20] px-2 py-0.5 rounded border border-white/5 text-slate-400 font-mono">Duration: 15s</span>
                      </div>

                      {/* Content Blocks for each script clip */}
                      <div className="space-y-4">
                        {result.script.clips.map((clip, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setIsPlaying(true);
                              setPlaybackClipIndex(idx);
                              setPlaybackTimeRemaining(15 - (idx * 4));
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isPlaying && playbackClipIndex === idx ? "bg-[#1d1d28] border-indigo-500/40" : "bg-black/30 border-white/5 hover:border-white/15"}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] bg-black/40 border border-white/10 text-indigo-400 font-mono px-2 py-0.5 rounded font-extrabold">
                                {clip.time}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Segment {idx + 1}</span>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-indigo-400/85 italic font-mono">
                                {clip.visualCue}
                              </p>
                              
                              <p className="text-sm uppercase font-bold text-white tracking-wide pr-1.5 border-l-2 border-indigo-500/40 pl-2 my-2 py-0.5 leading-snug">
                                &ldquo;{clip.audioSpeech}&rdquo;
                              </p>

                              <p className="text-[10px] inline-flex items-center gap-1 bg-yellow-400/10 text-yellow-300 px-2 py-0.5 rounded border border-yellow-400/20 mt-1 uppercase font-mono">
                                <span className="font-bold text-[9px] tracking-widest mr-1 opacity-80">OVERLAY:</span>{clip.textOverlay}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>STAMP SEGMENTATION: SECONDS BOUNDED</span>
                      <span>SYSTEMS CALIBRATED</span>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="h-12 bg-black/50 flex items-center justify-between px-6 border-t border-white/5 text-[10px] text-slate-650 font-medium tracking-tight mt-auto">
        <div className="text-[10px] text-slate-600 font-semibold">VIRAL-ENGINE ENGINE v1.1.2 - ACCELERATOR STABLE RELEASE</div>
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest hidden sm:inline">Systems Fully Operational</div>
        </div>
      </footer>

    </div>
  );
}
