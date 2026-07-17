import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Clock, ChevronRight, Mic, PenLine,
  BookOpenCheck, Headphones, Target, TrendingUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Article Data ──────────────────────────────────────────────────────────
const articles = [
  {
    slug: "what-is-pte",
    title: "What is PTE Academic? Complete Guide",
    category: "General",
    emoji: "🎓",
    readTime: "8 min",
    intro: "The Pearson Test of English (PTE) Academic is a computer-based English language proficiency test accepted by universities and governments worldwide.",
    sections: [
      {
        heading: "What is PTE Academic?",
        body: `PTE Academic is a computer-based English language exam created by Pearson PLC. It tests four core skills: Speaking, Writing, Reading, and Listening. Unlike IELTS, PTE is scored entirely by AI — meaning there's no human examiner bias.\n\nThe exam lasts approximately 2 hours (plus optional 10-minute break) and results are delivered within 48 hours of sitting the test.`,
      },
      {
        heading: "Who accepts PTE?",
        body: `PTE Academic is accepted by thousands of academic institutions worldwide including:\n\n• Harvard Business School\n• Yale School of Management\n• London Business School\n• All Australian universities\n• Canadian immigration (IRCC)\n• UK Visas and Immigration (UKVI)\n• New Zealand immigration\n\nThe Australian government requires PTE scores for skilled migration, student visas, and partner visas.`,
      },
      {
        heading: "PTE vs IELTS — Key Differences",
        body: `The biggest advantage of PTE over IELTS:\n\n• Results in 48 hours (IELTS takes 13+ days)\n• AI-scored — no human examiner variability\n• Computer-based — no handwriting, no face-to-face interview\n• Unlimited attempts (IELTS limits frequency)\n• Same price, but faster and more convenient\n\nMany candidates prefer PTE because they find AI scoring more predictable once you learn the system.`,
      },
      {
        heading: "PTE Score Range",
        body: `PTE uses a Global Scale of English (GSE) score from 10–90:\n\n• 90 — Native level (C2)\n• 79–90 — Most university requirements\n• 65–79 — Australian skilled migration visa\n• 50–65 — Some student visas\n• Below 50 — Basic communication\n\nMost candidates targeting Australian PR need 65 for general skills visa or 79 for points-tested streams.`,
      },
    ],
  },
  {
    slug: "speaking-tips",
    title: "PTE Speaking: Complete 79+ Strategy",
    category: "Speaking",
    emoji: "🎤",
    readTime: "12 min",
    intro: "Speaking is the most feared section for many candidates — but with the right strategy, it can become your highest-scoring section.",
    sections: [
      {
        heading: "The 5 Speaking Question Types",
        body: `1. Read Aloud (RA) — Read a text aloud. Scores both Speaking AND Reading.\n2. Repeat Sentence (RS) — Hear and repeat a sentence verbatim.\n3. Describe Image (DI) — Describe a chart or image in 40 seconds.\n4. Re-tell Lecture (RL) — Summarise an audio lecture.\n5. Answer Short Question (ASQ) — Give a 1–3 word answer to a question.`,
      },
      {
        heading: "The #1 Speaking Secret: Fluency Over Content",
        body: `PTE's AI scoring heavily weighs FLUENCY and PRONUNCIATION over content accuracy. This means:\n\n• An unnatural pause hurts your score more than a mispronounced word\n• Keep speaking even if you're unsure of a word — use a synonym\n• Aim for 130–160 words per minute (natural conversational pace)\n• Avoid filler sounds like "umm", "uhh" — they're penalised as hesitations`,
      },
      {
        heading: "Read Aloud (RA) Strategy",
        body: `Read Aloud is the highest-scoring task in PTE. Use your 40-second preparation time to:\n\n1. Identify difficult words and plan pronunciation\n2. Mark natural pause points (commas, full stops)\n3. Identify any technical terms to speak slowly\n\nDuring recording:\n• Speak at a steady pace — not too fast, not too slow\n• Use rising intonation for lists, falling for statements\n• Don't stop if you make an error — keep going`,
      },
      {
        heading: "Describe Image Template",
        body: `Use this template for every Describe Image question:\n\n"The image shows a [bar chart/pie chart/map/process diagram] depicting [topic].\n\nThe most notable feature is [highest/biggest/largest category] which accounts for [value].\n\nIn contrast, [lowest/smallest category] represents only [value].\n\nOverall, it is evident that [main trend/conclusion]."\n\nPractice 5 templates: bar chart, pie chart, line graph, map, process diagram.`,
      },
    ],
  },
  {
    slug: "writing-tips",
    title: "PTE Writing: Essay & Summary Mastery",
    category: "Writing",
    emoji: "✍️",
    readTime: "10 min",
    intro: "Writing has only 2 question types but they carry massive weight in your overall score — including cross-skill scoring into Reading.",
    sections: [
      {
        heading: "Summarize Written Text (SWT)",
        body: `The most deceptively simple question in PTE:\n\n• Write EXACTLY ONE sentence between 5 and 75 words\n• Include the main idea + 2–3 supporting points\n• Connect clauses using: which, where, while, although, whereas\n\nCommon mistake: Writing multiple sentences = ZERO marks for grammar.\n\nExample structure:\n"[Subject] [main verb], which [supporting point 1] and [supporting point 2], suggesting that [conclusion]."`,
      },
      {
        heading: "Write Essay (WE) — The 4-Paragraph Formula",
        body: `Time: 20 minutes | Target: 250 words\n\nParagraph 1 — Introduction (40 words)\n• Paraphrase the topic sentence\n• State your position clearly\n\nParagraph 2 — First argument (70 words)\n• Topic sentence + explanation + example\n\nParagraph 3 — Counter argument + rebuttal (70 words)\n• Acknowledge other side\n• Explain why your view is stronger\n\nParagraph 4 — Conclusion (40 words)\n• Restate position\n• Call to action or future outlook`,
      },
      {
        heading: "High-Scoring Grammar Structures",
        body: `PTE's AI scoring rewards sentence variety. Use these structures:\n\n✓ Complex: "Although technology has improved communication, it has arguably reduced face-to-face interaction."\n✓ Passive: "Research has been conducted to determine the effects of..."\n✓ Conditional: "Were governments to invest more in renewable energy, CO2 emissions would decrease significantly."\n✓ Inversion: "Not only does exercise improve physical health, but it also boosts mental wellbeing."\n\nAvoid: contractions (don't→do not), slang, bullet points in essays.`,
      },
    ],
  },
  {
    slug: "reading-tips",
    title: "PTE Reading: Speed & Accuracy Techniques",
    category: "Reading",
    emoji: "📖",
    readTime: "9 min",
    intro: "Reading section is time-pressured. The key is strategic skimming and knowing which question types carry the most marks.",
    sections: [
      {
        heading: "5 Reading Question Types",
        body: `1. Multiple Choice (Single) — Select 1 correct answer. No negative marking.\n2. Multiple Choice (Multiple) — Select ALL correct answers. Wrong answers subtract marks!\n3. Re-order Paragraphs — Drag text boxes into correct order.\n4. Fill in the Blanks (R) — Drag words from a bank into gaps.\n5. Fill in the Blanks (R&W) — Select from dropdown options.\n\nFIB (R&W) contributes to both Reading AND Writing scores — prioritise accuracy here.`,
      },
      {
        heading: "Re-order Paragraphs Strategy",
        body: `The key to Re-order Paragraphs is finding the TOPIC sentence and chaining pronouns:\n\nStep 1: Find the opener — usually no pronouns, introduces the topic\nStep 2: Find the conclusion — usually has "In summary", "Therefore", "Overall"\nStep 3: Chain the middle paragraphs using pronoun references: "This", "These", "Such", "It"\nStep 4: Look for time signals: "Initially", "Subsequently", "Finally"\n\nWork from both ends inward — anchor first and last, then fill the middle.`,
      },
      {
        heading: "MCM Warning — Negative Marking",
        body: `Multiple Choice Multiple (MCM) is the only question in PTE with negative marking:\n\n• Correct selected = +1 point\n• Wrong selected = -1 point\n• Not selected (correct) = 0\n• Not selected (wrong) = 0\n\nStrategy: Only select answers you are VERY confident about. If unsure, skip that option. Selecting just one correct answer scores positive even if you miss others.`,
      },
    ],
  },
  {
    slug: "listening-tips",
    title: "PTE Listening: The Hidden Score Booster",
    category: "Listening",
    emoji: "🎧",
    readTime: "11 min",
    intro: "Many candidates underestimate the Listening section. With strategic preparation, it can become your strongest score booster.",
    sections: [
      {
        heading: "8 Listening Question Types",
        body: `1. Summarize Spoken Text (SST) — Write a 50–70 word summary of a lecture.\n2. Multiple Choice (Multiple) — Select all correct answers.\n3. Multiple Choice (Single) — Select one correct answer.\n4. Highlight Correct Summary — Choose which summary best matches the audio.\n5. Select Missing Word — Choose the word that completes the recording.\n6. Fill in the Blanks (FIB) — Type missing words from a transcript.\n7. Highlight Incorrect Words (HIW) — Click words that differ from audio.\n8. Write from Dictation (WFD) — Type exactly what you hear.`,
      },
      {
        heading: "Write from Dictation — The 5-Point Booster",
        body: `WFD is the single highest-impact task in the Listening section:\n\n• Type the sentence EXACTLY as you hear it — spelling matters\n• Each correct word = partial marks (even imperfect answers score)\n• Audio plays only ONCE — full concentration required\n• Common WFD sentences repeat from a fixed pool — memorise them!\n\nPro tip: The top 200 WFD sentences account for 80% of what appears in real exams. Find them in prediction files and memorise 10 per day.`,
      },
      {
        heading: "Note-Taking for SST and RL",
        body: `For Summarize Spoken Text and Re-tell Lecture, effective note-taking is critical:\n\nUse symbols:\n→ = causes / leads to\n↑ = increase / more\n↓ = decrease / less\n= = equals / same as\nw/ = with\n& = and\n\nCapture: WHO did WHAT and WHY — the 3 most important content words per sentence.\n\nFor SST: write 50–70 words. Include the TOPIC, 2–3 key points, and a brief conclusion.`,
      },
    ],
  },
  {
    slug: "score-strategy",
    title: "Score 79+ Strategy: The Complete Roadmap",
    category: "Strategy",
    emoji: "🏆",
    readTime: "15 min",
    intro: "79 is the magic number for most visa and university requirements. Here's the proven roadmap to get there efficiently.",
    sections: [
      {
        heading: "The 79+ Formula",
        body: `To score 79+ overall, you typically need approximately:\n\n• Speaking: 77+\n• Writing: 76+\n• Reading: 75+\n• Listening: 77+\n\nNote: PTE uses cross-skill scoring. Read Aloud (RA) contributes to both Speaking and Reading. FIB (R&W) counts toward Reading AND Writing. WFD affects both Listening AND Writing. This means improving one task can lift multiple section scores.`,
      },
      {
        heading: "6-Week Study Plan",
        body: `Week 1–2: Foundation\n• Learn all 20 question types (formats, timings, scoring)\n• Practice Read Aloud daily — it affects 2 sections\n• Memorise 20 Write from Dictation sentences per day\n\nWeek 3–4: Skill Building\n• Work on Describe Image templates\n• Practice Summarize Written Text (1-sentence rule)\n• Focus on Re-order Paragraphs strategy\n\nWeek 5: Mock Tests\n• Take 2 full mock tests per week\n• Analyse your weak areas — score below 70 in any criterion?\n\nWeek 6: Target Weak Areas\n• Double practice time on your 2 lowest-scoring question types\n• Review prediction files for HOT questions`,
      },
      {
        heading: "The 3 Quick Wins",
        body: `If you have limited time, focus on these 3 tasks that give the best ROI:\n\n1. Read Aloud (RA): Highest frequency + affects Speaking + Reading\n   → Practice 10 RA questions daily, focus on fluency\n\n2. Write from Dictation (WFD): Highest Listening impact\n   → Memorise 200 common sentences over 3 weeks\n\n3. Fill in the Blanks R&W: Affects both Reading + Writing\n   → Learn collocations and context-based vocabulary\n\nMastering just these 3 tasks can add 5–10 points to your overall score.`,
      },
    ],
  },
];

// ── Guide List View ────────────────────────────────────────────────────────
const GuidesListView = () => {
  const navigate = useNavigate();
  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Speaking: "bg-purple-500/10 text-purple-500",
    Writing: "bg-blue-500/10 text-blue-400",
    Reading: "bg-amber-500/10 text-amber-500",
    Listening: "bg-red-500/10 text-red-400",
    Strategy: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 lg:px-6 py-8 space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl btn-3d"
          style={{ background: "var(--gradient-primary)" }}>
          📖
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">PTE Knowledge Base</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            Expert-written guides for every PTE question type · Free forever
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: BookOpen, label: "Articles", value: articles.length },
          { icon: Target, label: "Topics", value: "6" },
          { icon: TrendingUp, label: "Avg Read", value: "10 min" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl border-2 bg-card p-4 text-center"
          >
            <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-black text-foreground">{s.value}</div>
            <div className="text-xs font-bold text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {articles.map((article, i) => (
          <motion.div
            key={article.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-2xl border-2 bg-card p-5 cursor-pointer hover:shadow-md transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}
            onClick={() => navigate(`/guides/${article.slug}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{article.emoji}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${categoryColors[article.category]}`}>
                    {article.category}
                  </span>
                </div>
                <h3 className="font-black text-foreground text-sm leading-tight">{article.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{article.intro}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {article.readTime}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    {article.sections.length} sections
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ── Article Detail View ────────────────────────────────────────────────────
const GuidesArticleView = ({ slug }: { slug: string }) => {
  const navigate = useNavigate();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground font-semibold">Article not found.</p>
        <Button onClick={() => navigate("/guides")}>← Back to Guides</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 lg:px-6 py-8 space-y-6"
    >
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate("/guides")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Guides
      </Button>

      {/* Article header */}
      <div className="rounded-2xl border-2 bg-card p-6 space-y-3" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-4xl">{article.emoji}</div>
        <h1 className="text-2xl font-black text-primary-foreground">{article.title}</h1>
        <p className="text-sm text-primary-foreground/80 font-semibold">{article.intro}</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-primary-foreground/70">
            <Clock className="h-3 w-3" /> {article.readTime} read
          </span>
          <span className="text-xs text-primary-foreground/70">{article.sections.length} sections</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {article.sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border-2 bg-card p-6 space-y-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h2 className="text-base font-black text-foreground">{section.heading}</h2>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{section.body}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border-2 bg-card p-6 text-center space-y-3">
        <h3 className="font-black text-foreground">Ready to Practice?</h3>
        <p className="text-sm text-muted-foreground">Apply what you've learned with AI-scored questions</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button className="gap-2 rounded-xl font-bold btn-3d" onClick={() => navigate("/practice-list?type=speaking")}>
            <Mic className="h-4 w-4" /> Practice Now
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl font-bold border-2" onClick={() => navigate("/courses")}>
            <BookOpen className="h-4 w-4" /> More Courses
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Page Component ────────────────────────────────────────────────────
const GuidesPage = () => {
  const { slug } = useParams<{ slug?: string }>();
  return slug ? <GuidesArticleView slug={slug} /> : <GuidesListView />;
};

export default GuidesPage;
