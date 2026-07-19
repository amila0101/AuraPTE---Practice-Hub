import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PTE_QUESTION_TYPES: Record<string, string[]> = {
  speaking: ["Read Aloud", "Repeat Sentence", "Describe Image", "Re-tell Lecture", "Answer Short Question"],
  writing: ["Summarize Written Text", "Write Essay"],
  reading: ["Multiple Choice (Single)", "Multiple Choice (Multiple)", "Re-order Paragraphs", "Fill in the Blanks (R)", "Fill in the Blanks (R&W)"],
  listening: ["Summarize Spoken Text", "Multiple Choice (Single)", "Fill in the Blanks", "Highlight Correct Summary", "Select Missing Word", "Highlight Incorrect Words", "Write from Dictation"],
};

// Detailed prompt templates for each sub-type to ensure PTE accuracy
function getSubTypePrompt(subType: string, difficulty: string, examType: string): string {
  const examLabel = examType === "pte_core" ? "PTE Core" : "PTE Academic";
  
  const prompts: Record<string, string> = {
    // === SPEAKING ===
    "Read Aloud": `Generate a ${examLabel} "Read Aloud" question.
The student sees a text passage on screen and must read it aloud clearly.
Return JSON:
{
  "title": "Read Aloud - [brief topic]",
  "instruction": "Look at the text below. In 30-40 seconds, you must read this text aloud as naturally and clearly as possible. You have 35 seconds to read.",
  "content": "[A passage of 50-70 words on an academic topic. Must be grammatically perfect, use formal academic English. Topics: science, history, economics, environment, sociology, technology. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": null
}`,

    "Repeat Sentence": `Generate a ${examLabel} "Repeat Sentence" question.
The student hears a sentence and must repeat it exactly. Since we cannot provide audio, provide the transcript.
Return JSON:
{
  "title": "Repeat Sentence - [brief topic]",
  "instruction": "You will hear a sentence. After listening, repeat the sentence exactly as you heard it.",
  "content": "[A single sentence of 10-15 words. Natural spoken English, academic context. This represents the audio transcript the student would hear. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[exact same sentence for scoring]"}
}`,

    "Describe Image": `Generate a ${examLabel} "Describe Image" question.
The student sees an image (graph, chart, map, diagram, or picture) and must describe it in 40 seconds after 25 seconds of preparation.
Provide a DETAILED textual description of a chart/graph/diagram that can be used to generate a realistic visual.
Return JSON:
{
  "title": "Describe Image - [chart/graph type and topic]",
  "instruction": "Study the image below carefully. You have 25 seconds to describe what you see in detail. Include key features, trends, and comparisons.",
  "content": "[DETAILED description of a realistic chart/graph/diagram. Example format:\n\n📊 BAR CHART: 'Global Renewable Energy Production (2018-2023)'\n\nX-axis: Years (2018, 2019, 2020, 2021, 2022, 2023)\nY-axis: Energy production in Terawatt-hours (TWh)\n\nData:\n• Solar: 585 → 720 → 855 → 1,020 → 1,280 → 1,510\n• Wind: 1,270 → 1,420 → 1,590 → 1,860 → 2,100 → 2,370\n• Hydro: 4,200 → 4,300 → 4,350 → 4,250 → 4,400 → 4,500\n\nKey observations: Solar shows fastest growth rate (158% increase). Wind shows steady growth. Hydro remains dominant but relatively stable.\n\nMake it realistic with actual-looking data. Use bar charts, line graphs, pie charts, process diagrams, maps with data, or tables. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[A model answer describing the image: key features, trends, highest/lowest values, comparisons, 60-80 words]"}
}`,

    "Re-tell Lecture": `Generate a ${examLabel} "Re-tell Lecture" question.
The student listens to a lecture and must re-tell the main points. Provide a lecture transcript.
Return JSON:
{
  "title": "Re-tell Lecture - [topic]",
  "instruction": "You will hear a lecture. After listening, you have 40 seconds to re-tell what you heard in your own words. Cover the main points and key details.",
  "content": "[A lecture transcript of 120-180 words. Academic topic, spoken naturally. Include main argument, supporting details, and conclusion. Topics: science, social science, history, technology. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[Key points the student should mention: 3-5 bullet points summarizing the lecture]"}
}`,

    "Answer Short Question": `Generate a ${examLabel} "Answer Short Question" question.
The student hears a question and must give a one-word or short-phrase answer.
Return JSON:
{
  "title": "Answer Short Question - [topic category]",
  "instruction": "You will hear a question. Answer with a single word or a few words.",
  "content": "[A clear factual question that has a definitive 1-3 word answer. Examples: 'What do we call the study of stars and planets?', 'What is the person who writes for a newspaper called?', 'What instrument is used to measure temperature?' Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[The exact short answer, e.g., 'Astronomy', 'Journalist', 'Thermometer']"}
}`,

    // === WRITING ===
    "Summarize Written Text": `Generate a ${examLabel} "Summarize Written Text" question.
The student reads a passage and must summarize it in ONE SINGLE SENTENCE (5-75 words, max 10 minutes).
Return JSON:
{
  "title": "Summarize Written Text - [topic]",
  "instruction": "Read the passage below and summarize it using one single sentence. You have 10 minutes. Write between 5 and 75 words. Your response must be a single sentence.",
  "content": "[An academic passage of 200-300 words. Dense with information, well-structured. Topics: science, environment, history, sociology, economics, technology. Must contain a clear main idea with supporting details. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[A model single-sentence summary of 25-50 words capturing the main idea and key supporting points]"}
}`,

    "Write Essay": `Generate a ${examLabel} "Write Essay" question.
The student writes a 200-300 word essay on a given topic (20 minutes).
Return JSON:
{
  "title": "Write Essay - [topic]",
  "instruction": "You have 20 minutes to write an essay on the topic below. Write between 200 and 300 words. Structure your essay with an introduction, body paragraphs, and conclusion.",
  "content": "[An essay prompt/topic. Examples: 'Do you agree or disagree that technology has made our lives more complicated? Discuss both views and give your opinion.', 'Some people believe that university education should be free for everyone. To what extent do you agree or disagree?' Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": null
}`,

    // === READING ===
    "Multiple Choice (Single)": `Generate a ${examLabel} Reading "Multiple Choice (Single Answer)" question.
The student reads a passage and selects ONE correct answer from options.
Return JSON:
{
  "title": "Multiple Choice (Single) - [topic]",
  "instruction": "Read the passage carefully and choose the single best answer to the question below.",
  "content": "[An academic passage of 150-250 words followed by a clear question about the passage. Difficulty: ${difficulty}]",
  "options": ["[Option A - plausible but incorrect]", "[Option B - correct answer]", "[Option C - plausible but incorrect]", "[Option D - plausible but incorrect]"],
  "correct_answer": {"answer": "[The exact text of the correct option]", "index": [0-based index of correct option]}
}
IMPORTANT: Make all options plausible. Only ONE is correct. Randomize the position of the correct answer.`,

    "Multiple Choice (Multiple)": `Generate a ${examLabel} Reading "Multiple Choice (Multiple Answers)" question.
The student reads a passage and selects ALL correct answers (2-3 correct out of 5-7 options).
Return JSON:
{
  "title": "Multiple Choice (Multiple) - [topic]",
  "instruction": "Read the passage carefully and choose ALL the correct answers. There are multiple correct answers.",
  "content": "[An academic passage of 200-300 words followed by a clear question. Difficulty: ${difficulty}]",
  "options": ["[Option A]", "[Option B]", "[Option C]", "[Option D]", "[Option E]"],
  "correct_answer": {"answers": ["[exact text of correct option 1]", "[exact text of correct option 2]"], "indices": [0, 3]}
}
IMPORTANT: 2-3 options must be correct. All options must be plausible.`,

    "Re-order Paragraphs": `Generate a ${examLabel} "Re-order Paragraphs" question.
The student must arrange 4-5 jumbled text boxes into the correct logical order.
Return JSON:
{
  "title": "Re-order Paragraphs - [topic]",
  "instruction": "The text boxes below have been placed in a random order. Arrange them into the correct order to form a coherent passage.",
  "content": "[A brief context line about the topic]",
  "options": ["[Paragraph that should be 1st - topic sentence/introduction]", "[Paragraph that should be 2nd]", "[Paragraph that should be 3rd]", "[Paragraph that should be 4th]", "[Paragraph that should be 5th - conclusion]"],
  "correct_answer": {"order": [0, 1, 2, 3, 4], "explanation": "The passage discusses [topic] starting with [intro] and concluding with [conclusion]"}
}
IMPORTANT: The "options" array must be ALREADY SHUFFLED (not in correct order). The "order" in correct_answer gives the indices of options in the correct reading order. Each paragraph should be 30-50 words. Difficulty: ${difficulty}`,

    "Fill in the Blanks (R)": `Generate a ${examLabel} Reading "Fill in the Blanks (Drag & Drop)" question.
The student drags words from a word bank to fill blanks in a passage.
Return JSON:
{
  "title": "Fill in the Blanks (Drag) - [topic]",
  "instruction": "In the text below, some words are missing. Drag words from the box below to fill in the blanks.",
  "content": "[An academic passage of 80-120 words with 4-5 blanks marked as ___BLANK1___, ___BLANK2___, etc. The passage must make complete sense when blanks are filled. Difficulty: ${difficulty}]",
  "options": ["[correct word for blank 1]", "[correct word for blank 2]", "[correct word for blank 3]", "[correct word for blank 4]", "[distractor word 1]", "[distractor word 2]", "[distractor word 3]"],
  "correct_answer": {"blanks": {"BLANK1": "[correct word]", "BLANK2": "[correct word]", "BLANK3": "[correct word]", "BLANK4": "[correct word]"}}
}
IMPORTANT: Include 2-3 distractor words that are plausible but incorrect. Words should be academic vocabulary.`,

    "Fill in the Blanks (R&W)": `Generate a ${examLabel} Reading & Writing "Fill in the Blanks (Dropdown)" question.
The student selects the correct word from a dropdown for each blank.
Return JSON:
{
  "title": "Fill in the Blanks (R&W) - [topic]",
  "instruction": "Below is a text with blanks. For each blank, select the correct word from the dropdown options.",
  "content": "[An academic passage of 80-120 words with 4-5 blanks marked as ___BLANK1___, ___BLANK2___, etc. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"blanks": {"BLANK1": {"correct": "[correct word]", "options": ["[correct]", "[wrong1]", "[wrong2]", "[wrong3]"]}, "BLANK2": {"correct": "[correct word]", "options": ["[wrong1]", "[correct]", "[wrong2]", "[wrong3]"]}, "BLANK3": {"correct": "[correct word]", "options": ["[wrong1]", "[wrong2]", "[correct]", "[wrong3]"]}, "BLANK4": {"correct": "[correct word]", "options": ["[wrong1]", "[wrong2]", "[wrong3]", "[correct]"]}}}
}
IMPORTANT: Each blank has 4 dropdown choices. Only one is correct. All choices must be the same part of speech.`,

    // === LISTENING ===
    "Summarize Spoken Text": `Generate a ${examLabel} "Summarize Spoken Text" question.
The student listens to a lecture (60-90 seconds) and writes a summary of 50-70 words. Provide the transcript.
Return JSON:
{
  "title": "Summarize Spoken Text - [topic]",
  "instruction": "You will hear a short lecture. Write a summary of 50-70 words. You have 10 minutes.",
  "content": "[A lecture transcript of 150-250 words. Spoken-style academic English. Clear main idea with 2-3 supporting points. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[Model summary of 50-70 words covering main idea and key points]"}
}`,

    "Fill in the Blanks": `Generate a ${examLabel} Listening "Fill in the Blanks" question.
The student hears a recording and fills in missing words in a transcript.
Return JSON:
{
  "title": "Fill in the Blanks (Listening) - [topic]",
  "instruction": "You will hear a recording. Type the missing words in each blank as you listen.",
  "content": "[A transcript of 60-100 words with 3-5 blanks marked as ___BLANK1___, ___BLANK2___, etc. The full transcript represents what the student hears. Blanks are words they must type. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"blanks": {"BLANK1": "[missing word]", "BLANK2": "[missing word]", "BLANK3": "[missing word]"}}
}`,

    "Highlight Correct Summary": `Generate a ${examLabel} "Highlight Correct Summary" question.
The student hears a recording and selects the paragraph that best summarizes it. Provide the transcript.
Return JSON:
{
  "title": "Highlight Correct Summary - [topic]",
  "instruction": "You will hear a recording. Choose the paragraph that best summarizes the recording.",
  "content": "[A lecture/talk transcript of 120-180 words. Difficulty: ${difficulty}]",
  "options": ["[Correct summary paragraph - 40-60 words, accurate]", "[Wrong summary - contains factual errors]", "[Wrong summary - focuses on minor details, misses main point]", "[Wrong summary - contradicts the recording]"],
  "correct_answer": {"answer": "[exact text of correct summary]", "index": 0}
}
IMPORTANT: Randomize position of correct answer. Make wrong options plausible but subtly incorrect.`,

    "Select Missing Word": `Generate a ${examLabel} "Select Missing Word" question.
The student hears a recording where the last word/phrase is replaced with a beep, and selects the missing word.
Return JSON:
{
  "title": "Select Missing Word - [topic]",
  "instruction": "You will hear a recording. The last word or group of words has been replaced by a beep. Select the option that best completes the recording.",
  "content": "[A passage of 60-100 words. The last sentence should end with '... ___.' representing the beep/missing word. Difficulty: ${difficulty}]",
  "options": ["[Option A]", "[Option B - correct]", "[Option C]", "[Option D]"],
  "correct_answer": {"answer": "[correct missing word/phrase]", "index": 1}
}
IMPORTANT: Randomize correct answer position.`,

    "Highlight Incorrect Words": `Generate a ${examLabel} "Highlight Incorrect Words" question.
The student reads along while listening. Some words in the transcript differ from what is spoken. They must click the incorrect words.
Return JSON:
{
  "title": "Highlight Incorrect Words - [topic]",
  "instruction": "You will hear a recording. The transcript below contains some words that differ from what the speaker says. Click on the words that are different.",
  "content": "[A passage of 80-120 words that represents the ON-SCREEN text. 4-6 words in this text are DIFFERENT from what the speaker actually says. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"incorrect_words": [{"word": "[wrong word in text]", "correct_word": "[what speaker actually says]", "position": [word index in text]}]}
}
IMPORTANT: The incorrect words must be plausible substitutions (e.g., 'increase' instead of 'decrease', 'accepted' instead of 'rejected').`,

    "Write from Dictation": `Generate a ${examLabel} "Write from Dictation" question.
The student hears a sentence and must type it exactly.
Return JSON:
{
  "title": "Write from Dictation - [topic]",
  "instruction": "You will hear a sentence. Type the sentence exactly as you hear it.",
  "content": "[A single sentence of 10-16 words. Academic context, natural spoken English. This is the transcript of what the student hears. Difficulty: ${difficulty}]",
  "options": null,
  "correct_answer": {"answer": "[The exact sentence]"}
}`,
  };

  return prompts[subType] || prompts["Read Aloud"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const { skill, sub_type, difficulty, exam_type } = await req.json();

    const selectedSkill = skill || "speaking";
    const types = PTE_QUESTION_TYPES[selectedSkill] || PTE_QUESTION_TYPES.speaking;
    const selectedSubType = sub_type || types[Math.floor(Math.random() * types.length)];
    const selectedDifficulty = difficulty || "medium";
    const selectedExamType = exam_type || "pte_academic";

    // Check for existing question with same skill + sub_type to prevent duplicates
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existing } = await supabase
      .from("questions")
      .select("*")
      .eq("skill", selectedSkill)
      .eq("sub_type", selectedSubType)
      .eq("exam_type", selectedExamType)
      .limit(1)
      .single();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subTypePrompt = getSubTypePrompt(selectedSubType, selectedDifficulty, selectedExamType);

    const prompt = `You are an expert PTE exam question creator with deep knowledge of Pearson's official PTE Academic and PTE Core exam formats.

Generate ONE practice question following these EXACT specifications:

${subTypePrompt}

CRITICAL RULES:
1. Content must be academically rigorous and realistic - similar to actual PTE exam questions.
2. Use varied topics: science, technology, history, sociology, environment, economics, psychology, medicine, linguistics, anthropology.
3. Do NOT use common/overused examples. Be creative and original.
4. All text must be grammatically perfect.
5. For multiple choice: all options must be plausible. Never make wrong answers obviously wrong.
6. Return ONLY valid JSON. No markdown, no code blocks, no explanation.
7. Difficulty level: ${selectedDifficulty} (easy = straightforward vocabulary, medium = standard academic, hard = complex academic vocabulary and concepts).`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a PTE exam expert. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("Lovable AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;
    if (!textContent) throw new Error("No content from AI");

    // Parse JSON from response (handle markdown code blocks)
    let cleanJson = textContent.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }
    const questionData = JSON.parse(cleanJson);

    // Save to database (supabase client already created above)

    // Generate actual chart image for "Describe Image" questions
    let imageUrl: string | null = null;
    if (selectedSubType === "Describe Image") {
      try {
        const imagePrompt = `Create a clean, professional academic chart or graph based on this description. Make it look like a real infographic or data visualization you'd see in a PTE exam. Use clear labels, a title, and a legend. No text outside the chart. White background.\n\nDescription: ${questionData.content}`;
        
        const imgResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const base64Image = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (base64Image) {
            // Extract base64 data and upload to Supabase storage
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
            const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const fileName = `describe-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
            
            const { error: uploadError } = await supabase.storage
              .from("question-images")
              .upload(fileName, imageBytes, { contentType: "image/png" });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from("question-images")
                .getPublicUrl(fileName);
              imageUrl = urlData.publicUrl;
            } else {
              console.error("Image upload error:", uploadError);
            }
          }
        } else {
          console.error("Image generation failed:", imgResponse.status);
        }
      } catch (imgErr) {
        console.error("Image generation error:", imgErr);
        // Continue without image - text description will be used as fallback
      }
    }

    if (selectedSubType === "Describe Image" && !imageUrl) {
      return new Response(JSON.stringify({ error: "Image generation failed for Describe Image. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: saved, error: dbError } = await supabase.from("questions").insert({
      exam_type: selectedExamType,
      skill: selectedSkill,
      sub_type: selectedSubType,
      title: questionData.title,
      instruction: questionData.instruction,
      content: questionData.content,
      options: questionData.options,
      correct_answer: questionData.correct_answer,
      difficulty: selectedDifficulty,
      is_ai_generated: true,
      image_url: imageUrl,
    }).select().single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to save question");
    }

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-question error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
