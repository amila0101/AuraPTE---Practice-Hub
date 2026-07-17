import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ScoreResult {
  overall_score: number;
  breakdown: Record<string, number>;
  feedback: string;
  suggestions: string[];
  model_answer?: string;
  note?: string;       // e.g. "Audio required for full pronunciation scoring"
}

interface Question {
  skill: string;
  sub_type: string;
  content: string;
  title: string;
  options: string[] | null;
  correct_answer: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: DETERMINISTIC SCORERS — No API call, zero cost, 100% accurate
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise a word: lowercase, strip punctuation */
function normaliseWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

/** Split text into normalised word array */
function tokenise(text: string): string[] {
  return text.trim().split(/\s+/).map(normaliseWord).filter(Boolean);
}

/** Clamp a number to [0, 90] and round */
function clamp90(n: number): number {
  return Math.max(0, Math.min(90, Math.round(n)));
}

// ── Write from Dictation ─────────────────────────────────────────────────────
function scoreWriteFromDictation(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, string>;
  const target = correct?.answer ?? question.content;

  const targetWords = tokenise(target);
  const studentWords = tokenise(answerText);

  // PTE: compare word-by-word in order (positional matching)
  let correctCount = 0;
  const totalWords = targetWords.length;
  const len = Math.min(targetWords.length, studentWords.length);
  for (let i = 0; i < len; i++) {
    if (targetWords[i] === studentWords[i]) correctCount++;
  }

  const score = clamp90((correctCount / totalWords) * 90);

  const wrongWords = targetWords
    .map((w, i) => studentWords[i] !== w ? `"${studentWords[i] ?? "—"}" (should be "${w}")` : null)
    .filter(Boolean);

  return {
    overall_score: score,
    breakdown: { listening: score, spelling: score },
    feedback: score === 90
      ? "Perfect! Every word matched exactly."
      : `${correctCount}/${totalWords} words correct. ${wrongWords.slice(0, 4).join(", ")}.`,
    suggestions: [
      "Every word must match exactly — including function words (the, a, in, of)",
      "Practice the top 200 common WFD sentences until memorised",
      "If unsure of a word, write your best guess — partial credit applies",
    ],
    model_answer: target,
  };
}

// ── MCQ Single ───────────────────────────────────────────────────────────────
function scoreMCQSingle(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctAnswer = (correct?.answer as string ?? "").toLowerCase().trim();
  const correctIndex = correct?.index as number ?? -1;
  const studentAnswer = answerText.toLowerCase().trim();

  // Match by text or by index number submitted
  const isCorrect =
    studentAnswer === correctAnswer ||
    studentAnswer.includes(correctAnswer) ||
    correctAnswer.includes(studentAnswer) ||
    (question.options && studentAnswer === String(correctIndex)) ||
    (question.options && studentAnswer === question.options[correctIndex]?.toLowerCase().trim());

  const score = isCorrect ? 90 : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: isCorrect
      ? `Correct! "${correct?.answer}" is the right answer.`
      : `Incorrect. The correct answer is: "${correct?.answer}".`,
    suggestions: ["Read the full passage before looking at options", "Eliminate obviously wrong answers first"],
    model_answer: String(correct?.answer ?? ""),
  };
}

// ── MCQ Multiple — Negative Marking ─────────────────────────────────────────
function scoreMCQMultiple(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctAnswers: string[] = ((correct?.answers as string[]) ?? []).map((a) => a.toLowerCase().trim());
  const correctIndices: number[] = (correct?.indices as number[]) ?? [];
  const allOptions = question.options ?? [];

  // Parse student selections (comma-separated or pipe-separated)
  const studentSelections = answerText
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  let points = 0;
  const totalCorrect = correctAnswers.length;
  const detailLines: string[] = [];

  // Map student selections to option indices first
  const studentIndices = studentSelections.map((sel) => {
    const idx = allOptions.findIndex((opt) => opt.toLowerCase().trim() === sel || opt.toLowerCase().includes(sel));
    return idx;
  });

  for (const sel of studentSelections) {
    const matched = correctAnswers.some(
      (ca) => ca === sel || ca.includes(sel) || sel.includes(ca)
    );
    if (matched) {
      points++;
      detailLines.push(`✓ "${sel}" — correct`);
    } else {
      points--;
      detailLines.push(`✗ "${sel}" — wrong (-1 point)`);
    }
  }

  // Missed correct answers = 0 (no penalty for not selecting)
  const rawScore = Math.max(0, points);
  const score = totalCorrect > 0 ? clamp90((rawScore / totalCorrect) * 90) : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: `Score: ${rawScore}/${totalCorrect} points. ${detailLines.join("; ")}. Correct answers: ${correctAnswers.join(", ")}.`,
    suggestions: [
      "⚠️ NEGATIVE MARKING: wrong selections subtract points",
      "Only select options you are very confident about",
      "It is better to leave an answer unselected than to guess wrongly",
    ],
    model_answer: `Correct answers: ${correctAnswers.join(", ")}`,
  };
}

// ── Re-order Paragraphs — Pair-based scoring ─────────────────────────────────
function scoreReorderParagraphs(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctOrder: number[] = (correct?.order as number[]) ?? [];

  // Parse student order: accept "0,1,2,3,4" or index list
  const studentOrder = answerText
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  if (studentOrder.length === 0 || correctOrder.length === 0) {
    return {
      overall_score: 0,
      breakdown: { content: 0 },
      feedback: "Could not parse paragraph order. Submit as comma-separated indices e.g. '2,0,3,1,4'.",
      suggestions: ["Submit your answer as the paragraph numbers in order, e.g. 2,0,3,1,4"],
      model_answer: `Correct order: ${correctOrder.join(", ")}. ${correct?.explanation ?? ""}`,
    };
  }

  // PTE pair-based scoring: count correct consecutive pairs
  const totalPairs = correctOrder.length - 1;
  let correctPairs = 0;

  for (let i = 0; i < totalPairs; i++) {
    if (studentOrder[i] === correctOrder[i] && studentOrder[i + 1] === correctOrder[i + 1]) {
      correctPairs++;
    }
  }

  const score = totalPairs > 0 ? clamp90((correctPairs / totalPairs) * 90) : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: `${correctPairs}/${totalPairs} consecutive pairs in correct order. Your order: [${studentOrder.join(",")}]. Correct: [${correctOrder.join(",")}].`,
    suggestions: [
      "Find the opener first: it introduces the topic with no pronoun references",
      "Chain paragraphs using pronoun signals: This, These, Such, It, They",
      "Find the conclusion last: usually contains 'In summary', 'Therefore', 'Overall'",
    ],
    model_answer: `Correct order: ${correctOrder.join(", ")}. ${correct?.explanation ?? ""}`,
  };
}

// ── Fill in the Blanks (any type) ─────────────────────────────────────────────
function scoreFillInTheBlanks(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const blanks = correct?.blanks as Record<string, unknown> ?? {};

  // Parse student answers: accept "word1, word2, word3" OR "BLANK1: word, BLANK2: word"
  const blankKeys = Object.keys(blanks);
  let studentAnswers: Record<string, string> = {};

  // Try format: "BLANK1: answer, BLANK2: answer"
  if (answerText.includes(":")) {
    answerText.split(",").forEach((part) => {
      const [k, v] = part.split(":").map((s) => s.trim());
      if (k && v) studentAnswers[k.toUpperCase()] = normaliseWord(v);
    });
  } else {
    // Fallback: positional — "word1, word2, word3"
    const parts = answerText.split(",").map((s) => s.trim());
    blankKeys.forEach((key, i) => {
      studentAnswers[key] = normaliseWord(parts[i] ?? "");
    });
  }

  let correct_count = 0;
  const total = blankKeys.length;
  const detailLines: string[] = [];

  for (const key of blankKeys) {
    const correctWord = typeof blanks[key] === "string"
      ? normaliseWord(blanks[key] as string)
      : normaliseWord((blanks[key] as Record<string, string>)?.correct ?? "");

    const studentWord = studentAnswers[key] ?? "";
    const isCorrect = studentWord === correctWord;
    if (isCorrect) correct_count++;
    detailLines.push(`${key}: "${studentWord}" → ${isCorrect ? "✓" : `✗ (correct: "${correctWord}")`}`);
  }

  const score = total > 0 ? clamp90((correct_count / total) * 90) : 0;
  const isListening = question.skill === "listening";

  return {
    overall_score: score,
    breakdown: isListening
      ? { listening: score, spelling: score }
      : { vocabulary: score },
    feedback: `${correct_count}/${total} blanks correct. ${detailLines.join(" | ")}`,
    suggestions: [
      "Spelling must be exact — even one letter wrong = zero for that blank",
      isListening
        ? "Focus on stressed words in the audio — they are usually the missing words"
        : "Read the full sentence context before choosing — check the word's grammatical role",
    ],
    model_answer: `Correct: ${JSON.stringify(blanks)}`,
  };
}

// ── Select Missing Word ────────────────────────────────────────────────────────
function scoreSelectMissingWord(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctAnswer = (correct?.answer as string ?? "").toLowerCase().trim();
  const studentAnswer = answerText.toLowerCase().trim();
  const isCorrect = studentAnswer === correctAnswer || correctAnswer.includes(studentAnswer);
  const score = isCorrect ? 90 : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: isCorrect ? `Correct! "${correct?.answer}" completes the recording.` : `Incorrect. The correct answer is: "${correct?.answer}".`,
    suggestions: ["Listen to the flow and tone of the sentence to predict the ending"],
    model_answer: String(correct?.answer ?? ""),
  };
}

// ── Highlight Correct Summary ─────────────────────────────────────────────────
function scoreHighlightCorrectSummary(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctAnswer = (correct?.answer as string ?? "").toLowerCase().trim();
  const studentAnswer = answerText.toLowerCase().trim();
  // Flexible match — student may submit abbreviated text
  const isCorrect = studentAnswer === correctAnswer ||
    correctAnswer.includes(studentAnswer.slice(0, 30)) ||
    studentAnswer.includes(correctAnswer.slice(0, 30));
  const score = isCorrect ? 90 : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: isCorrect ? "Correct summary selected!" : `Incorrect. Correct summary: "${String(correct?.answer ?? "").slice(0, 100)}..."`,
    suggestions: ["Choose the summary that covers the MAIN point, not just specific details", "Wrong options often contain factual errors or focus on minor points"],
    model_answer: String(correct?.answer ?? ""),
  };
}

// ── Answer Short Question — exact + synonym match ────────────────────────────
function scoreAnswerShortQuestion(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const correctAnswer = (correct?.answer as string ?? "").toLowerCase().trim();
  const studentAnswer = answerText.toLowerCase().trim();

  // Accept: exact match, plural/singular, common synonyms
  const isCorrect =
    studentAnswer === correctAnswer ||
    studentAnswer.startsWith(correctAnswer) ||
    correctAnswer.startsWith(studentAnswer) ||
    studentAnswer.replace(/s$/, "") === correctAnswer.replace(/s$/, "");

  const score = isCorrect ? 90 : 0;

  return {
    overall_score: score,
    breakdown: { content: score },
    feedback: isCorrect ? `Correct! "${correct?.answer}" is right.` : `Incorrect. The correct answer is: "${correct?.answer}".`,
    suggestions: ["Only 1-3 words needed — don't over-explain", "Answer the exact question asked"],
    model_answer: String(correct?.answer ?? ""),
  };
}

// ── Highlight Incorrect Words — negative marking ──────────────────────────────
function scoreHighlightIncorrectWords(question: Question, answerText: string): ScoreResult {
  const correct = question.correct_answer as Record<string, unknown>;
  const incorrectWords = (correct?.incorrect_words as Array<Record<string, unknown>>) ?? [];
  const totalIncorrect = incorrectWords.length;

  // Student submits a comma-separated list of words they clicked
  const studentHighlighted = answerText
    .split(",")
    .map((w) => normaliseWord(w))
    .filter(Boolean);

  const correctSet = new Set(incorrectWords.map((w) => normaliseWord(w.word as string)));

  let hits = 0;
  let wrong = 0;

  for (const w of studentHighlighted) {
    if (correctSet.has(w)) hits++;
    else wrong--;
  }

  const raw = Math.max(0, hits + wrong);
  const score = totalIncorrect > 0 ? clamp90((raw / totalIncorrect) * 90) : 0;

  return {
    overall_score: score,
    breakdown: { listening: score },
    feedback: `${hits} correct highlights, ${Math.abs(wrong)} wrong highlights. Score: ${raw}/${totalIncorrect} points. Incorrect words were: ${incorrectWords.map((w) => `"${w.word}" (should be "${w.correct_word}")`).join(", ")}.`,
    suggestions: [
      "⚠️ NEGATIVE MARKING: wrong highlights subtract points",
      "Focus on content words (nouns, verbs, adjectives) — they are most likely to differ",
      "Opposite meaning words are common traps: 'increase' vs 'decrease'",
    ],
    model_answer: `Incorrect words: ${incorrectWords.map((w) => `${w.word} → ${w.correct_word}`).join(", ")}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: AI SUB-SCORE PROMPTS — Gemini returns raw scores only
//          Our backend code applies the weighted formula
// ─────────────────────────────────────────────────────────────────────────────

interface SubScoreRequest {
  criteria: string[];          // e.g. ["content", "oral_fluency", "pronunciation"]
  weights: Record<string, number>; // e.g. { content: 0.20, oral_fluency: 0.40, pronunciation: 0.40 }
  prompt: string;
  modelAnswerInstruction: string;
}

function getAISubScoreRequest(question: Question, answerText: string): SubScoreRequest {
  const { sub_type, content } = question;

  if (sub_type === "Read Aloud") {
    return {
      criteria: ["content", "oral_fluency", "pronunciation"],
      weights: { content: 0.20, oral_fluency: 0.40, pronunciation: 0.40 },
      prompt: `You are a PTE Academic scoring assistant. Evaluate ONLY the following three criteria independently. Do NOT calculate a final score — that is done externally.

Passage the student should read aloud:
"""
${content}
"""

Student's text response (this represents their spoken words):
"""
${answerText}
"""

Rate EACH criterion from 0 to 90:

content (0-90): Word-for-word accuracy. Count how many words from the passage appear in the student's response in correct order.
  90 = identical or near-identical | 60 = ~70% of words correct | 30 = ~40% correct | 0 = largely different

oral_fluency (0-90): Assess natural pacing and smoothness from the response completeness and structure.
  90 = complete, natural flow | 60 = mostly complete, some gaps | 30 = fragmented | 0 = incomplete/broken

pronunciation (0-90): Estimate from response quality — if the student correctly reproduced the text, they likely pronounced it correctly.
  Score proportionally to content accuracy but independently. Do not conflate with fluency.

feedback: 2-3 specific sentences on what was done well and what to improve.
suggestions: 3 short actionable tips.`,
      modelAnswerInstruction: `model_answer: Copy the exact passage verbatim as the model answer.`,
    };
  }

  if (sub_type === "Repeat Sentence") {
    return {
      criteria: ["content", "oral_fluency", "pronunciation"],
      weights: { content: 0.33, oral_fluency: 0.33, pronunciation: 0.34 },
      prompt: `You are a PTE Academic scoring assistant. Evaluate ONLY the three criteria below independently.

Sentence the student heard:
"""
${content}
"""

Student's recalled response:
"""
${answerText}
"""

Rate EACH criterion from 0 to 90 independently:

content (0-90): How many words were recalled correctly in the correct order.
  90 = identical | 70 = 80%+ correct | 50 = 60-79% | 30 = 40-59% | 10 = <40% | 0 = unrelated

oral_fluency (0-90): Smoothness inferred from completeness. Full recall → high. Fragmented → low.

pronunciation (0-90): Correlated with content accuracy but assessed independently. Mostly correct recall → assume good pronunciation.

feedback: Specific note on recall accuracy and any words likely missed.
suggestions: 2-3 tips for improving sentence memory.`,
      modelAnswerInstruction: `model_answer: The exact sentence: "${content}"`,
    };
  }

  if (sub_type === "Describe Image") {
    // HONEST ARCHITECTURE: Without audio we CANNOT score pronunciation/fluency acoustically.
    // We score content (did the student cover key image features?) and add a clear note.
    return {
      criteria: ["content"],
      weights: { content: 1.0 },
      prompt: `You are a PTE Academic scoring assistant evaluating a Describe Image text response.

IMPORTANT ARCHITECTURAL NOTE: This is a TEXT submission. We cannot measure true pronunciation or fluency without audio. Therefore, score CONTENT ONLY — did the student describe the key features of the image?

Image/chart description:
"""
${content}
"""

Student's description:
"""
${answerText}
"""

content (0-90): Did the student cover the key features?
  Check for: (1) Type of image mentioned, (2) Key trend or highest/lowest value, (3) Comparison between data points, (4) Concluding statement, (5) Vocabulary appropriate to the chart type.
  90 = all 5 elements | 72 = 4 elements | 54 = 3 elements | 36 = 2 elements | 18 = 1 element | 0 = irrelevant

feedback: Identify which key features were covered and which were missed.
suggestions: 3 tips on what to include in image descriptions.`,
      modelAnswerInstruction: `model_answer: A model 60-80 word description covering: image type, highest/lowest value or main trend, one comparison, and a conclusion.`,
    };
  }

  if (sub_type === "Re-tell Lecture") {
    return {
      criteria: ["content", "oral_fluency", "pronunciation"],
      weights: { content: 0.33, oral_fluency: 0.33, pronunciation: 0.34 },
      prompt: `You are a PTE Academic scoring assistant. Evaluate ONLY the three criteria below independently.

Lecture transcript:
"""
${content}
"""

Student's re-tell:
"""
${answerText}
"""

content (0-90): Extract 5 key concepts from the lecture. How many appear in the student's re-tell?
  5+ concepts = 90 | 4 = 72 | 3 = 54 | 2 = 36 | 1 = 18 | 0 = 0

oral_fluency (0-90): Is the re-tell a coherent paragraph with logical flow? Complete paragraph → high. Bullet points or fragments → lower.

pronunciation (0-90): Infer from response quality proportionally to content coverage.

feedback: Which key lecture points were included and which were missed.
suggestions: 3 note-taking tips for lectures.`,
      modelAnswerInstruction: `model_answer: A 60-80 word model re-tell covering the main topic, 3 key points, and a brief conclusion.`,
    };
  }

  if (sub_type === "Summarize Written Text") {
    return {
      criteria: ["content", "form", "grammar", "vocabulary"],
      weights: { content: 0.33, form: 0.33, grammar: 0.17, vocabulary: 0.17 },
      prompt: `You are a PTE Academic scoring assistant. Evaluate the following criteria INDEPENDENTLY. Do NOT calculate a final score.

Original passage:
"""
${content}
"""

Student's summary:
"""
${answerText}
"""

CRITICAL — form (0 or 90 ONLY):
  Is the response EXACTLY one sentence? Count the full stops / sentence-ending punctuation.
  One sentence AND 5-75 words → form: 90
  Multiple sentences OR <5 words OR >75 words → form: 0
  If form = 0, set content, grammar, vocabulary all to 0 as well (automatic fail per PTE rules).

content (0-90): Does the single sentence capture the main idea + at least one key supporting point?
  Main idea + 2 supporting points = 90 | Main idea + 1 = 60 | Main idea only = 30 | Wrong = 0

grammar (0-90): Is the sentence grammatically correct? No tense errors, correct articles, subject-verb agreement.

vocabulary (0-90): Are academic words from the passage used accurately?

feedback: Check the one-sentence rule first. Then comment on content coverage and grammar.
suggestions: 2 tips on writing a one-sentence summary.`,
      modelAnswerInstruction: `model_answer: A single summary sentence of 25-50 words capturing the main idea and one key supporting point.`,
    };
  }

  if (sub_type === "Write Essay") {
    return {
      criteria: ["content", "development_structure", "linguistic_range", "grammar", "vocabulary", "spelling"],
      weights: { content: 0.20, development_structure: 0.20, linguistic_range: 0.20, grammar: 0.20, vocabulary: 0.10, spelling: 0.10 },
      prompt: `You are a PTE Academic scoring assistant. Score EACH criterion independently from 0-90. Do NOT compute a final score.

Essay topic:
"""
${content}
"""

Student essay:
"""
${answerText}
"""

Word count check: Count words. Flag if outside 200-300 range.

content (0-90): Does the essay address the topic? Are arguments specific, relevant, and supported with examples?
  Strong on-topic with examples = 90 | Mostly on-topic = 60 | Partially relevant = 30 | Off-topic = 0

development_structure (0-90): Clear introduction, body paragraphs, conclusion? Logical argument flow? Transition words?
  All three sections + transitions = 90 | Two sections = 60 | No clear structure = 0-30

linguistic_range (0-90): Variety of sentence structures (complex, compound, conditional, passive, inversion)?
  4+ different structures = 90 | 2-3 = 60 | Only simple sentences = 20

grammar (0-90): Tense consistency, subject-verb agreement, articles, prepositions. Deduct for each error type.

vocabulary (0-90): Academic word list usage, avoidance of repetition, correct collocations.

spelling (0-90): 90 if zero errors. Deduct 10 for each unique spelling error type found.

word_count_penalty: true if outside 200-300 range (we apply a 15-point final deduction in code).

feedback: One paragraph identifying the essay's key strengths and top 2-3 specific weaknesses with examples from the text.
suggestions: 3 targeted improvement tips.`,
      modelAnswerInstruction: `model_answer: A 2-sentence outline of what a 90/90 essay structure would contain for this topic.`,
    };
  }

  if (sub_type === "Summarize Spoken Text") {
    return {
      criteria: ["content", "form", "grammar", "vocabulary"],
      weights: { content: 0.33, form: 0.33, grammar: 0.17, vocabulary: 0.17 },
      prompt: `You are a PTE Academic scoring assistant.

Lecture transcript:
"""
${content}
"""

Student summary:
"""
${answerText}
"""

form (0 or 90 ONLY): Is the response 50-70 words?
  Within 50-70 words → form: 90 | Outside range → form: 0

content (0-90): Are the main topic + 2 key points from the lecture covered?
  Topic + 2+ points = 90 | Topic + 1 = 60 | Topic only = 30 | Wrong = 0

grammar (0-90): Grammatical accuracy.

vocabulary (0-90): Use of academic vocabulary from the lecture.

feedback: Word count check first. Then key points covered vs missed.
suggestions: 2 tips for writing spoken text summaries.`,
      modelAnswerInstruction: `model_answer: A 55-65 word model summary of this lecture.`,
    };
  }

  // Generic fallback for any unmatched AI question
  return {
    criteria: ["content"],
    weights: { content: 1.0 },
    prompt: `Score the following student answer for the PTE question. Return only the content score (0-90).

Question: "${content}"
Answer: "${answerText}"

content (0-90): accuracy and relevance of the answer.
feedback: brief explanation.
suggestions: 2 tips.`,
    modelAnswerInstruction: `model_answer: The ideal answer.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 RUNNER: Call Gemini, get raw sub-scores, apply weights in TypeScript
// ─────────────────────────────────────────────────────────────────────────────

async function scoreWithAI(
  question: Question,
  answerText: string,
  lovableApiKey: string
): Promise<ScoreResult> {
  const req = getAISubScoreRequest(question, answerText);

  const systemMsg = `You are a PTE Academic sub-score evaluator. Return ONLY valid JSON with NO markdown, NO code blocks, NO extra text. JSON structure:
{
  ${req.criteria.map((c) => `"${c}": <number 0-90>`).join(",\n  ")},
  "feedback": "<string>",
  "suggestions": ["<string>", "<string>", "<string>"],
  ${req.modelAnswerInstruction ? `"model_answer": "<string>",` : ""}
  "word_count_penalty": <boolean, optional>
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: req.prompt },
      ],
      temperature: 0.1,   // Low = consistent, repeatable sub-scores
      max_tokens: 800,
    }),
  });

  if (response.status === 429) throw Object.assign(new Error("Rate limit exceeded. Please try again in a moment."), { status: 429 });
  if (response.status === 402) throw Object.assign(new Error("AI credits exhausted."), { status: 402 });
  if (!response.ok) {
    const errText = await response.text();
    console.error("AI error:", response.status, errText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content ?? "";

  let cleanJson = textContent.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  }
  // Extract JSON object if wrapped
  const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanJson = jsonMatch[0];

  const raw = JSON.parse(cleanJson);

  // ── APPLY WEIGHTS IN TYPESCRIPT (not in the LLM) ──────────────────────────
  let weightedScore = 0;
  const breakdown: Record<string, number> = {};

  for (const [criterion, weight] of Object.entries(req.weights)) {
    const subScore = clamp90(Number(raw[criterion] ?? 0));
    breakdown[criterion] = subScore;
    weightedScore += subScore * weight;
  }

  // Apply word count penalty for essays (detected by Gemini flag)
  if (raw.word_count_penalty === true && question.sub_type === "Write Essay") {
    weightedScore = Math.max(0, weightedScore - 15);
  }

  // Honest note for Describe Image: we only scored content
  const note = question.sub_type === "Describe Image"
    ? "⚠️ Pronunciation & Fluency require audio recording — text submission scored on Content only."
    : undefined;

  return {
    overall_score: clamp90(weightedScore),
    breakdown,
    feedback: String(raw.feedback ?? ""),
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    model_answer: raw.model_answer ? String(raw.model_answer) : undefined,
    note,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER: Decide deterministic vs AI scoring per sub_type
// ─────────────────────────────────────────────────────────────────────────────

const DETERMINISTIC_TYPES = new Set([
  "Write from Dictation",
  "Multiple Choice (Single)",
  "Multiple Choice (Multiple)",
  "Re-order Paragraphs",
  "Fill in the Blanks (R)",
  "Fill in the Blanks (R&W)",
  "Fill in the Blanks",       // Listening FIB
  "Select Missing Word",
  "Highlight Correct Summary",
  "Answer Short Question",
  "Highlight Incorrect Words",
]);

function scoreQuestion(question: Question, answerText: string): ScoreResult | null {
  switch (question.sub_type) {
    case "Write from Dictation":          return scoreWriteFromDictation(question, answerText);
    case "Multiple Choice (Single)":      return scoreMCQSingle(question, answerText);
    case "Multiple Choice (Multiple)":    return scoreMCQMultiple(question, answerText);
    case "Re-order Paragraphs":           return scoreReorderParagraphs(question, answerText);
    case "Fill in the Blanks (R)":
    case "Fill in the Blanks (R&W)":
    case "Fill in the Blanks":            return scoreFillInTheBlanks(question, answerText);
    case "Select Missing Word":           return scoreSelectMissingWord(question, answerText);
    case "Highlight Correct Summary":     return scoreHighlightCorrectSummary(question, answerText);
    case "Answer Short Question":         return scoreAnswerShortQuestion(question, answerText);
    case "Highlight Incorrect Words":     return scoreHighlightIncorrectWords(question, answerText);
    default:                              return null; // → AI scoring
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HTTP HANDLER
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { question_id, answer_text, time_spent_seconds } = await req.json();

    // Fetch question
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single();
    if (qError || !question) throw new Error("Question not found");

    const q = question as Question;

    // ── ROUTE: Deterministic or AI? ──────────────────────────────────────────
    let scoreResult: ScoreResult;
    const deterministicResult = scoreQuestion(q, answer_text);

    if (deterministicResult !== null) {
      // No API call — pure algorithm
      scoreResult = deterministicResult;
    } else {
      // AI scoring — Gemini returns raw sub-scores, we apply weights
      scoreResult = await scoreWithAI(q, answer_text, LOVABLE_API_KEY);
    }

    // ── PERSIST to Supabase ──────────────────────────────────────────────────
    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        question_id,
        answer_text,
        score: scoreResult.breakdown,
        overall_score: scoreResult.overall_score,
        feedback: scoreResult.feedback,
        time_spent_seconds,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session save error:", sessionError);
      throw new Error("Failed to save session");
    }

    // ── UPDATE daily_stats ───────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const { data: existingStats } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existingStats) {
      const updates: Record<string, number> = {
        questions_done: (existingStats.questions_done || 0) + 1,
        study_minutes: (existingStats.study_minutes || 0) + Math.round((time_spent_seconds || 0) / 60),
      };
      const scoreField = `${q.skill}_score`;
      if (scoreField in existingStats) {
        const prev = (existingStats as Record<string, unknown>)[scoreField] as number | null;
        updates[scoreField] = prev
          ? Math.round((prev + scoreResult.overall_score) / 2)
          : scoreResult.overall_score;
      }
      await supabase.from("daily_stats").update(updates).eq("id", existingStats.id);
    } else {
      const insert: Record<string, unknown> = {
        user_id: user.id,
        date: today,
        questions_done: 1,
        study_minutes: Math.round((time_spent_seconds || 0) / 60),
      };
      insert[`${q.skill}_score`] = scoreResult.overall_score;
      await supabase.from("daily_stats").insert(insert);
    }

    return new Response(
      JSON.stringify({ ...scoreResult, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const err = e as Error & { status?: number };
    console.error("score-answer error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: err.status ?? 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
