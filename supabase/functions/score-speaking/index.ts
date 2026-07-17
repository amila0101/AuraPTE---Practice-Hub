import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AssemblyWord {
  text: string;
  start: number;   // milliseconds
  end: number;     // milliseconds
  confidence: number; // 0.0 – 1.0
}

interface AssemblyTranscript {
  status: string;
  text: string;
  words: AssemblyWord[];
  audio_duration: number; // seconds — SERVER-SIDE, trusted (Bug Fix 2)
  error?: string;
}

type PunctType = "none" | "comma" | "period" | "semicolon";

interface ScoreResult {
  overall_score: number;
  breakdown: Record<string, number>;
  feedback: string;
  suggestions: string[];
  model_answer?: string;
  note?: string;
  wpm?: number;
  transcript?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function clamp90(n: number): number {
  return Math.max(0, Math.min(90, Math.round(n)));
}

function normaliseWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function tokenise(text: string): string[] {
  return text.trim().split(/\s+/).map(normaliseWord).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — Punctuation from AssemblyAI directly (punctuate: true)
//          No more aligning punctMap to asrWords by index — read from word.text
// ─────────────────────────────────────────────────────────────────────────────

function getPunctType(wordText: string): PunctType {
  // AssemblyAI (punctuate: true) appends punctuation to word.text
  // e.g. "quickly," or "running." or "however;"
  if (/[.!?]$/.test(wordText)) return "period";
  if (/,$/.test(wordText))      return "comma";
  if (/;$/.test(wordText))      return "semicolon";
  return "none";
}

const PAUSE_THRESHOLDS: Record<PunctType, { short: number; long: number }> = {
  none:       { short: 600,   long: 2000 },
  comma:      { short: 1200,  long: 2800 },
  semicolon:  { short: 1400,  long: 3000 },
  period:     { short: 1600,  long: 3500 },
};

// ─────────────────────────────────────────────────────────────────────────────
// LCS — Content Matching (Fix: Cascading Failure)
// ─────────────────────────────────────────────────────────────────────────────

function computeLCS(target: string[], asr: string[]): number {
  const m = target.length, n = asr.length;
  // Rolling array to save memory (O(n) space)
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      curr[j] = target[i - 1] === asr[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }
  return prev[n];
}

// ─────────────────────────────────────────────────────────────────────────────
// WPM → Base Fluency Score
// ─────────────────────────────────────────────────────────────────────────────

function wpmToBaseScore(wpm: number): number {
  if (wpm >= 120 && wpm <= 145) return 90;  // ideal PTE native pace
  if (wpm >= 100 && wpm <  120) return 74;
  if (wpm >  145 && wpm <= 165) return 74;  // slightly fast
  if (wpm >=  80 && wpm <  100) return 54;
  if (wpm >  165 && wpm <= 185) return 54;  // too fast
  if (wpm >=  60 && wpm <   80) return 32;
  if (wpm >  185)               return 20;  // very fast/rushed
  return 15; // < 60 WPM — very broken
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-Linear Pronunciation Curve (Fix: Linear Scaling Trap)
// ─────────────────────────────────────────────────────────────────────────────

function confidenceToScore(avgConf: number): number {
  // ASR confidence rarely drops below 0.6 — linear mapping gives 63/90 for
  // a 0.70 confidence score which is generous. Non-linear curve punishes low.
  if (avgConf >= 0.93) return Math.round(88 + ((avgConf - 0.93) / 0.07) * 2);  // 88-90
  if (avgConf >= 0.87) return Math.round(72 + ((avgConf - 0.87) / 0.06) * 16); // 72-88
  if (avgConf >= 0.80) return Math.round(48 + ((avgConf - 0.80) / 0.07) * 24); // 48-72
  if (avgConf >= 0.73) return Math.round(22 + ((avgConf - 0.73) / 0.07) * 26); // 22-48 ← BIG DROP
  if (avgConf >= 0.65) return Math.round( 5 + ((avgConf - 0.65) / 0.08) * 17); // 5-22
  return Math.max(0, Math.round((avgConf / 0.65) * 5));                          // 0-5
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE SCORER — Runs all formulas on AssemblyAI word data
// ─────────────────────────────────────────────────────────────────────────────

const FUNCTION_WORDS = new Set([
  "the","a","an","in","of","on","at","to","is","are","was","were",
  "and","or","but","for","it","this","that","with","by","from","as",
  "be","been","being","have","has","had","do","does","did","will",
  "would","could","should","may","might","shall","not","no","up",
]);

function computeSpeakingScores(
  asrWords: AssemblyWord[],
  audioDuration: number,   // seconds from AssemblyAI (server-side, trusted)
  targetPassage: string,   // original passage (for Read Aloud / Repeat Sentence)
  subType: string
): { content: number; fluency: number; pronunciation: number; wpm: number } {

  const wordCount = asrWords.length;

  // ── CONTENT — LCS against target ──────────────────────────────────────────
  let content = 0;
  if (targetPassage) {
    const targetWords = tokenise(targetPassage);
    const asrText     = asrWords.map(w => normaliseWord(w.text));
    const matched     = computeLCS(targetWords, asrText);
    content           = clamp90(Math.round((matched / Math.max(1, targetWords.length)) * 90));
  }

  // ── FLUENCY — WPM + contextual pauses + initial silence ───────────────────

  // FIX 2: Use server-side audioDuration. Guard against zero.
  const safeDuration = Math.max(1, audioDuration);
  const wpm          = (wordCount / safeDuration) * 60;
  let baseScore      = wpmToBaseScore(wpm);

  // Initial silence penalty (FIX 3)
  const initialSilenceMs = asrWords[0]?.start ?? 0;
  const initialPenalty   = initialSilenceMs > 5000 ? 20
                         : initialSilenceMs > 3000 ? 12
                         : initialSilenceMs > 2000 ?  6
                         : 0;

  // Pause penalties — FIX 1: read punctuation from word.text directly
  let longPauses = 0, shortPauses = 0;
  for (let i = 0; i < asrWords.length - 1; i++) {
    const gap       = asrWords[i + 1].start - asrWords[i].end;
    const pType     = getPunctType(asrWords[i].text); // from AssemblyAI spoken word
    const threshold = PAUSE_THRESHOLDS[pType];

    if      (gap > threshold.long)  longPauses++;
    else if (gap > threshold.short) shortPauses++;
  }

  const fluency = clamp90(baseScore - (longPauses * 8) - (shortPauses * 3) - initialPenalty);

  // ── PRONUNCIATION — content-word weighted confidence + non-linear curve ───
  let wSum = 0, wTotal = 0;
  for (const w of asrWords) {
    const clean  = normaliseWord(w.text);
    const weight = FUNCTION_WORDS.has(clean) ? 1 : 2;
    wSum   += w.confidence * weight;
    wTotal += weight;
  }
  const avgConf     = wTotal > 0 ? wSum / wTotal : 0;
  const pronunciation = clamp90(confidenceToScore(avgConf));

  return { content, fluency, pronunciation, wpm: Math.round(wpm) };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHTED FINAL SCORE — TypeScript does the math (not the LLM)
// ─────────────────────────────────────────────────────────────────────────────

function buildFinalScore(
  subType: string,
  scores: { content: number; fluency: number; pronunciation: number; wpm: number },
  asrTranscript: string,
  targetPassage: string
): ScoreResult {

  const { content, fluency, pronunciation, wpm } = scores;

  let overall: number;
  let breakdown: Record<string, number>;
  let note: string | undefined;

  if (subType === "Read Aloud") {
    // Official PTE: Content 20% + Fluency 40% + Pronunciation 40%
    overall   = clamp90(Math.round(content * 0.20 + fluency * 0.40 + pronunciation * 0.40));
    breakdown = { content, oral_fluency: fluency, pronunciation };

  } else if (subType === "Repeat Sentence") {
    // Official PTE: Content 33% + Fluency 33% + Pronunciation 34%
    overall   = clamp90(Math.round(content * 0.33 + fluency * 0.33 + pronunciation * 0.34));
    breakdown = { content, oral_fluency: fluency, pronunciation };

  } else if (subType === "Re-tell Lecture") {
    // Official PTE: Content 33% + Fluency 33% + Pronunciation 34%
    overall   = clamp90(Math.round(content * 0.33 + fluency * 0.33 + pronunciation * 0.34));
    breakdown = { content, oral_fluency: fluency, pronunciation };

  } else if (subType === "Describe Image") {
    // Official PTE: Oral Fluency 50% + Pronunciation 50% (no content score from image)
    overall   = clamp90(Math.round(fluency * 0.50 + pronunciation * 0.50));
    breakdown = { oral_fluency: fluency, pronunciation };
    note      = "Content describes image quality — not scored by PTE for Describe Image.";

  } else if (subType === "Answer Short Question") {
    // Binary: compare ASR transcript to target answer
    const asrClean    = asrTranscript.toLowerCase().trim();
    const targetClean = targetPassage.toLowerCase().trim();
    const isCorrect   = asrClean.includes(targetClean) || targetClean.includes(asrClean);
    overall           = isCorrect ? 90 : 0;
    breakdown         = { content: overall };

  } else {
    // Fallback for other speaking types
    overall   = clamp90(Math.round(content * 0.33 + fluency * 0.33 + pronunciation * 0.34));
    breakdown = { content, oral_fluency: fluency, pronunciation };
  }

  // Generate deterministic feedback from scores
  const feedbackParts: string[] = [];

  if (subType === "Read Aloud" || subType === "Repeat Sentence" || subType === "Re-tell Lecture") {
    feedbackParts.push(
      content >= 70
        ? `Content accuracy is strong (${content}/90) — most words were correctly spoken.`
        : `Content accuracy needs work (${content}/90) — several words were missed or incorrect.`
    );
  }

  feedbackParts.push(
    fluency >= 70
      ? `Oral fluency is good (${fluency}/90) at ${wpm} WPM — speech was smooth and well-paced.`
      : fluency >= 50
      ? `Oral fluency is moderate (${fluency}/90) at ${wpm} WPM — some hesitations detected.`
      : `Oral fluency needs improvement (${fluency}/90) at ${wpm} WPM — too many pauses or unnatural pacing.`
  );

  feedbackParts.push(
    pronunciation >= 70
      ? `Pronunciation is clear (${pronunciation}/90) — speech was well-recognised by ASR.`
      : pronunciation >= 48
      ? `Pronunciation is acceptable (${pronunciation}/90) — some words were unclear.`
      : `Pronunciation needs significant work (${pronunciation}/90) — many words were difficult to recognise.`
  );

  const suggestions: string[] = [];

  if (wpm < 100) suggestions.push("Speak faster — aim for 120–145 words per minute for PTE.");
  if (wpm > 165) suggestions.push("Slow down — speaking too fast reduces clarity and fluency scores.");
  if (fluency < 65) suggestions.push("Practise shadowing native speakers to reduce unnatural pauses.");
  if (pronunciation < 65) suggestions.push("Practise individual phonemes — focus on consonant sounds at word boundaries.");
  if (content < 65 && subType !== "Describe Image") suggestions.push("Read the passage aloud daily to improve memory and word accuracy.");
  if (suggestions.length === 0) suggestions.push("Excellent performance! Maintain this pace and clarity in the real exam.");

  return {
    overall_score: overall,
    breakdown,
    feedback: feedbackParts.join(" "),
    suggestions: suggestions.slice(0, 3),
    wpm,
    transcript: asrTranscript,
    note,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLYAI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function uploadAudioToAssemblyAI(audioBytes: Uint8Array, apiKey: string): Promise<string> {
  const res = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      "authorization": apiKey,
      "content-type": "application/octet-stream",
    },
    body: audioBytes,
  });
  if (!res.ok) throw new Error(`AssemblyAI upload failed: ${res.status}`);
  const data = await res.json();
  return data.upload_url as string;
}

async function transcribeAudio(audioUrl: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      "authorization": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      punctuate: true,          // FIX 1: AssemblyAI adds punctuation to word.text
      format_text: false,       // Raw words, no formatting
      word_boost: [             // Boost common PTE academic words for accuracy
        "academic", "university", "research", "analysis", "significant",
        "environment", "technology", "government", "international", "development",
      ],
    }),
  });
  if (!res.ok) throw new Error(`AssemblyAI transcribe failed: ${res.status}`);
  const data = await res.json();
  return data.id as string;
}

async function pollTranscript(transcriptId: string, apiKey: string): Promise<AssemblyTranscript> {
  const maxAttempts = 30; // 30 × 2s = 60s max wait
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { "authorization": apiKey },
    });
    if (!res.ok) throw new Error(`AssemblyAI poll failed: ${res.status}`);

    const data: AssemblyTranscript = await res.json();

    if (data.status === "completed") return data;
    if (data.status === "error")     throw new Error(`AssemblyAI error: ${data.error}`);
    // status === "processing" | "queued" → keep polling
  }
  throw new Error("AssemblyAI transcription timed out after 60s");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ASSEMBLY_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!ASSEMBLY_API_KEY) throw new Error("ASSEMBLYAI_API_KEY not configured in Supabase secrets");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase    = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const token      = authHeader?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Parse multipart form — audio blob + metadata
    const formData   = await req.formData();
    const audioFile  = formData.get("audio") as File | null;
    const questionId = formData.get("question_id") as string;
    const timeSpentSec = parseInt(formData.get("time_spent_seconds") as string ?? "0");

    if (!audioFile) throw new Error("No audio file provided");
    if (!questionId) throw new Error("No question_id provided");

    // Fetch question from DB
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();
    if (qError || !question) throw new Error("Question not found");

    // Convert File → Uint8Array for upload
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBytes  = new Uint8Array(audioBuffer);

    // ── ASSEMBLYAI PIPELINE ────────────────────────────────────────────────
    console.log("Uploading audio to AssemblyAI...");
    const uploadUrl     = await uploadAudioToAssemblyAI(audioBytes, ASSEMBLY_API_KEY);

    console.log("Submitting transcription...");
    const transcriptId  = await transcribeAudio(uploadUrl, ASSEMBLY_API_KEY);

    console.log("Polling for result...");
    const transcript    = await pollTranscript(transcriptId, ASSEMBLY_API_KEY);

    const asrWords      = transcript.words ?? [];

    if (asrWords.length === 0) {
      return new Response(JSON.stringify({
        overall_score: 0,
        breakdown: { content: 0, oral_fluency: 0, pronunciation: 0 },
        feedback: "No speech was detected in the recording. Please check your microphone and try again.",
        suggestions: ["Ensure your microphone is enabled", "Speak clearly into the microphone", "Check browser microphone permissions"],
        transcript: "",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // FIX 2: Use AssemblyAI server-side audio_duration — NEVER trust frontend timing
    // Math.max(1, ...) guards against zero/null
    const serverAudioDuration = Math.max(1, transcript.audio_duration ?? 0);

    // ── SCORING FORMULAS ───────────────────────────────────────────────────
    // Target passage: for Read Aloud / Repeat Sentence = question content
    // For Describe Image / Re-tell Lecture = model answer or empty
    const targetPassage = question.sub_type === "Read Aloud" || question.sub_type === "Repeat Sentence"
      ? (question.correct_answer as Record<string, string>)?.answer ?? question.content
      : question.sub_type === "Answer Short Question"
      ? (question.correct_answer as Record<string, string>)?.answer ?? ""
      : "";

    const scores      = computeSpeakingScores(asrWords, serverAudioDuration, targetPassage, question.sub_type);
    const scoreResult = buildFinalScore(question.sub_type, scores, transcript.text ?? "", targetPassage);

    // ── PERSIST ────────────────────────────────────────────────────────────
    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        question_id: questionId,
        answer_text: transcript.text ?? "",
        score: scoreResult.breakdown,
        overall_score: scoreResult.overall_score,
        feedback: scoreResult.feedback,
        time_spent_seconds: timeSpentSec,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session save error:", sessionError);
      throw new Error("Failed to save session");
    }

    // ── UPDATE daily_stats ─────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const { data: existingStats } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existingStats) {
      const prev = (existingStats as Record<string, unknown>)[`${question.skill}_score`] as number | null;
      await supabase.from("daily_stats").update({
        questions_done: (existingStats.questions_done || 0) + 1,
        study_minutes:  (existingStats.study_minutes  || 0) + Math.round(timeSpentSec / 60),
        [`${question.skill}_score`]: prev
          ? Math.round((prev + scoreResult.overall_score) / 2)
          : scoreResult.overall_score,
      }).eq("id", existingStats.id);
    } else {
      await supabase.from("daily_stats").insert({
        user_id: user.id,
        date: today,
        questions_done: 1,
        study_minutes: Math.round(timeSpentSec / 60),
        [`${question.skill}_score`]: scoreResult.overall_score,
      });
    }

    return new Response(
      JSON.stringify({ ...scoreResult, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e: unknown) {
    const err = e as Error & { status?: number };
    console.error("score-speaking error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: err.status ?? 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
