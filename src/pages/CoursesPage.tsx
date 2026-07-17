import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, PenLine, BookOpenCheck, Headphones, ChevronRight,
  Clock, Star, CheckCircle2, BookOpen, Play, ChevronDown, ChevronUp,
  Zap, Target, Award, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────
type Skill = "speaking" | "writing" | "reading" | "listening";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  keyPoints: string[];
  tip: string;
  examWeight: string;
}

interface Course {
  skill: Skill;
  emoji: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  lessons: Lesson[];
}

// ── Course Content Data ────────────────────────────────────────────────────
const courses: Course[] = [
  {
    skill: "speaking",
    emoji: "🎤",
    label: "Speaking",
    description: "Master all 5 speaking question types with AI-scored feedback on pronunciation & fluency",
    color: "hsl(var(--speaking))",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    lessons: [
      {
        id: "ra",
        title: "Read Aloud (RA) — Strategy Guide",
        duration: "15 min",
        difficulty: "Intermediate",
        keyPoints: [
          "Pronunciation and fluency score higher than content — don't pause on unknown words",
          "Use the 40-second prep time to identify difficult words and chunk sentences",
          "Speak at a natural pace — neither too fast nor too slow (130–160 wpm)",
          "Avoid rising intonation at the end of statements",
          "Practice with tongue twisters to improve articulation speed",
        ],
        tip: "💡 Read Aloud contributes to both Speaking AND Reading score in PTE Academic!",
        examWeight: "Very High",
      },
      {
        id: "rs",
        title: "Repeat Sentence (RS) — Memory Techniques",
        duration: "10 min",
        difficulty: "Beginner",
        keyPoints: [
          "Listen to the full sentence before speaking — do not start mid-sentence",
          "Focus on capturing key content words (nouns, verbs) if you miss some function words",
          "Maintain the same rhythm and intonation as the original speaker",
          "Avoid unnecessary pauses — fluency is critical for scoring",
          "Sentences are 9–16 words; practice chunking long sentences into 3-word groups",
        ],
        tip: "💡 RS is one of the highest-frequency question types. Scoring even 70% here significantly boosts your total.",
        examWeight: "Very High",
      },
      {
        id: "di",
        title: "Describe Image (DI) — Template Approach",
        duration: "20 min",
        difficulty: "Advanced",
        keyPoints: [
          "Use the OPENING → MAIN → TREND → CLOSE template structure",
          "Opening: 'The image shows a [type of chart] depicting [topic]'",
          "Main: Describe the highest and lowest values, key comparisons",
          "Trend: 'Overall, it can be seen that...'",
          "Prepare 5–6 generic templates for: bar, line, pie, map, process, table",
        ],
        tip: "💡 You get 25 seconds to prepare — use it to identify chart type and 2–3 key data points.",
        examWeight: "High",
      },
      {
        id: "rl",
        title: "Re-tell Lecture (RL) — Note Taking",
        duration: "18 min",
        difficulty: "Advanced",
        keyPoints: [
          "Take notes using keywords and abbreviations during the audio",
          "Structure: Topic → Key Point 1 → Key Point 2 → Conclusion",
          "Opening template: 'The lecture discusses the topic of [keyword]'",
          "Don't try to memorize every word — capture the main ideas",
          "Practice listening to academic TED Talks and summarizing in 40 seconds",
        ],
        tip: "💡 Use symbol-based note-taking: → (causes), ↑ (increase), ↓ (decrease), = (equals)",
        examWeight: "High",
      },
      {
        id: "asq",
        title: "Answer Short Question (ASQ) — Quick Wins",
        duration: "8 min",
        difficulty: "Beginner",
        keyPoints: [
          "Answer in 1–3 words only — do not give long explanations",
          "Questions test general knowledge and vocabulary (e.g. 'What do you call a person who teaches?')",
          "If unsure, say the most common English answer — even partial credit counts",
          "These questions are short but frequent — a reliable way to boost your score",
          "Study common ASQ topics: occupations, geography, science, everyday items",
        ],
        tip: "💡 Memorize 200 common ASQ answers — most repeat from a fixed pool in real exams!",
        examWeight: "Medium",
      },
    ],
  },
  {
    skill: "writing",
    emoji: "✍️",
    label: "Writing",
    description: "Score 79+ in writing with structured essay templates and summarization mastery",
    color: "hsl(var(--info))",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    lessons: [
      {
        id: "swt",
        title: "Summarize Written Text (SWT) — One Sentence Mastery",
        duration: "12 min",
        difficulty: "Intermediate",
        keyPoints: [
          "Write EXACTLY one sentence between 5 and 75 words",
          "Structure: '[Subject] [verb] [key point 1], [key point 2], and [key point 3]'",
          "Use 'which', 'where', 'although', 'while' to connect clauses within one sentence",
          "Do not write a full paragraph — the system penalizes multiple sentences",
          "Include the MAIN idea and 2–3 supporting points from the passage",
        ],
        tip: "💡 Grammar and content both score equally here. A grammatically perfect sentence with all key ideas = full marks.",
        examWeight: "High",
      },
      {
        id: "we",
        title: "Write Essay (WE) — 79+ Band Strategy",
        duration: "25 min",
        difficulty: "Advanced",
        keyPoints: [
          "Write 200–300 words (optimal: 250 words) in exactly 20 minutes",
          "Structure: Introduction (40w) + Body 1 (70w) + Body 2 (70w) + Conclusion (40w)",
          "Always address BOTH sides of the argument before giving your opinion",
          "Use discourse markers: 'Furthermore', 'In contrast', 'To conclude', 'Nevertheless'",
          "Avoid informal contractions (don't → do not) and slang",
        ],
        tip: "💡 Grammar is the highest-weighted criterion in essays. Focus on sentence variety: mix simple, compound, and complex sentences.",
        examWeight: "Very High",
      },
    ],
  },
  {
    skill: "reading",
    emoji: "📖",
    label: "Reading",
    description: "Time management and skimming strategies for all 5 reading question types",
    color: "hsl(var(--warning))",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    lessons: [
      {
        id: "rmc",
        title: "Multiple Choice Reading — Elimination Strategy",
        duration: "10 min",
        difficulty: "Intermediate",
        keyPoints: [
          "Read the QUESTION first, then skim the text for relevant sections",
          "Eliminate obviously wrong answers first",
          "For Multiple (MCM): select all correct answers — wrong selections subtract marks",
          "Beware of 'distractor' options that use words from the text but with wrong meaning",
          "Time limit: aim for 2 minutes per MCQ",
        ],
        tip: "💡 MCM has negative marking! Only select answers you are confident about.",
        examWeight: "Medium",
      },
      {
        id: "rop",
        title: "Re-order Paragraphs — Logic Clue Strategy",
        duration: "15 min",
        difficulty: "Advanced",
        keyPoints: [
          "Find the TOPIC sentence (usually has no pronoun references, stands alone)",
          "Look for cohesive devices: 'this', 'these', 'however', 'therefore' to chain paragraphs",
          "Paragraphs with 'First', 'Initially', 'To begin' usually come early",
          "Paragraphs ending with a conclusion word ('In summary', 'Overall') come last",
          "Work from the beginning and end inward to anchor the sequence",
        ],
        tip: "💡 Practice speed — you have about 2–3 minutes per ROP question in the real exam.",
        examWeight: "High",
      },
      {
        id: "fib",
        title: "Fill in the Blanks — Context Clue Reading",
        duration: "12 min",
        difficulty: "Intermediate",
        keyPoints: [
          "R&W FIB (dropdown): Read surrounding words for grammatical clues (noun/verb/adj)",
          "Reading FIB (drag-drop): Each word in the bank fits exactly one blank",
          "Use process of elimination: fill easiest blanks first, then revisit harder ones",
          "Watch for collocations: words that naturally pair together (e.g., 'make a decision')",
          "Check subject-verb agreement and article usage (a/an/the) for context",
        ],
        tip: "💡 R&W FIB contributes to both Reading AND Writing scores — it's one of the most efficient sections!",
        examWeight: "Very High",
      },
    ],
  },
  {
    skill: "listening",
    emoji: "🎧",
    label: "Listening",
    description: "Sharpen your listening accuracy across all 8 question types with real exam-like audio",
    color: "hsl(var(--destructive))",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    lessons: [
      {
        id: "sst",
        title: "Summarize Spoken Text (SST) — Efficient Note-Taking",
        duration: "15 min",
        difficulty: "Advanced",
        keyPoints: [
          "Write 50–70 words summarizing the main idea and 2–3 key points",
          "Take notes using abbreviations during the 60–90 second audio",
          "Structure: 'The lecture discusses [topic]. The speaker highlights [point 1] and [point 2]. In conclusion...'",
          "Grammar, vocabulary, and content all contribute to scoring",
          "Do not copy sentences from the audio verbatim — paraphrase",
        ],
        tip: "💡 SST contributes to both Listening AND Writing scores — spend 10 minutes on each.",
        examWeight: "Very High",
      },
      {
        id: "wfd",
        title: "Write from Dictation (WFD) — Highest Impact Quick Win",
        duration: "10 min",
        difficulty: "Beginner",
        keyPoints: [
          "Audio plays only ONCE in the real exam — listen with full concentration",
          "Type the sentence exactly as heard, including punctuation",
          "If you miss a word, leave a blank and return — don't overthink",
          "Each correct word scores marks — even a partially correct answer earns points",
          "WFD sentences repeat from a known pool — memorize common WFDs!",
        ],
        tip: "💡 WFD is one of the highest-impact listening sections. Many candidates improve their score 3–5 points by mastering the common 200 WFD sentences.",
        examWeight: "Very High",
      },
      {
        id: "hiw",
        title: "Highlight Incorrect Words (HIW) — Speed Reading",
        duration: "12 min",
        difficulty: "Intermediate",
        keyPoints: [
          "Read the text on screen while the audio plays simultaneously",
          "Click any word that differs from what you hear (usually 2–7 words differ)",
          "Focus on content words — incorrect words are usually nouns, verbs, or adjectives",
          "Don't click if unsure — there's partial marking (wrong clicks may cost marks)",
          "Practice speed reading to keep pace with the audio",
        ],
        tip: "💡 The audio plays at a natural speaking pace (~130 wpm). Train your eyes to scan ahead of the audio.",
        examWeight: "High",
      },
    ],
  },
];

// ── Lesson Card ────────────────────────────────────────────────────────────
function LessonCard({
  lesson,
  color,
  skillKey,
  index,
}: {
  lesson: Lesson;
  color: string;
  skillKey: Skill;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const diffStyle: Record<string, string> = {
    Beginner:     "bg-primary/10 text-primary",
    Intermediate: "bg-accent/15 text-accent-foreground",
    Advanced:     "bg-destructive/10 text-destructive",
  };

  const weightStyle: Record<string, string> = {
    "Very High": "text-red-400 font-black",
    "High":      "text-amber-500 font-bold",
    "Medium":    "text-primary font-bold",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border-2 bg-card overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black text-white"
          style={{ background: color }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-foreground">{lesson.title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {lesson.duration}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${diffStyle[lesson.difficulty]}`}>
              {lesson.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">
              Exam Weight: <span className={weightStyle[lesson.examWeight]}>{lesson.examWeight}</span>
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t-2 overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-4">
              {/* Key Points */}
              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
                  📌 Key Strategy Points
                </h4>
                <ul className="space-y-2">
                  {lesson.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                      <span className="text-sm text-foreground/90 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tip Banner */}
              <div
                className="rounded-xl border p-3 text-sm font-semibold"
                style={{ borderColor: `${color}40`, background: `${color}10`, color }}
              >
                {lesson.tip}
              </div>

              {/* CTA */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-2 rounded-xl font-bold"
                  style={{ background: color }}
                  onClick={() => navigate(`/practice-list?type=${skillKey}`)}
                >
                  <Play className="h-4 w-4" /> Practice {lesson.id.toUpperCase()}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-xl font-bold border-2"
                  onClick={() => navigate("/predictions")}
                >
                  <Target className="h-4 w-4" /> See Predictions
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const CoursesPage = () => {
  const [activeSkill, setActiveSkill] = useState<Skill>("speaking");
  const activeCourse = courses.find((c) => c.skill === activeSkill)!;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 lg:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl btn-3d"
          style={{ background: "var(--gradient-primary)" }}>
          📚
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">PTE Courses & Strategy Guides</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            Expert-written strategies for every question type · Built for <span className="text-primary">79+ scores</span>
          </p>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Total Lessons", value: courses.reduce((a, c) => a + c.lessons.length, 0), color: "text-primary" },
          { icon: Zap, label: "Skill Sections", value: 4, color: "text-blue-400" },
          { icon: TrendingUp, label: "Score Target", value: "79+", color: "text-amber-500" },
          { icon: Award, label: "Free Forever", value: "✓", color: "text-primary" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="rounded-2xl border-2 bg-card p-4 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
            <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Skill Tabs ── */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {courses.map((course) => (
          <button
            key={course.skill}
            onClick={() => setActiveSkill(course.skill)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              activeSkill === course.skill
                ? `${course.border} shadow-md`
                : "border-transparent bg-card hover:bg-muted"
            }`}
            style={
              activeSkill === course.skill
                ? { background: `${course.color}10`, boxShadow: "var(--shadow-card)" }
                : {}
            }
          >
            <div className="text-2xl mb-1">{course.emoji}</div>
            <div className="font-black text-foreground text-sm">{course.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {course.lessons.length} lessons
            </div>
          </button>
        ))}
      </motion.div>

      {/* ── Active Course ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSkill}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Course Description */}
          <div
            className={`rounded-2xl border-2 ${activeCourse.border} ${activeCourse.bg} p-5 flex items-start gap-3`}
          >
            <span className="text-3xl">{activeCourse.emoji}</span>
            <div>
              <h2 className="font-black text-foreground text-lg">{activeCourse.label} Mastery</h2>
              <p className="text-sm font-semibold text-muted-foreground mt-1">{activeCourse.description}</p>
            </div>
          </div>

          {/* Lessons */}
          <div className="space-y-3">
            {activeCourse.lessons.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                color={activeCourse.color}
                skillKey={activeCourse.skill}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom CTA ── */}
      <motion.div variants={item} className="rounded-2xl border-2 bg-card p-6 text-center space-y-3"
        style={{ background: "var(--gradient-hero)" }}>
        <h2 className="text-xl font-black text-primary-foreground">Ready to Apply What You've Learned?</h2>
        <p className="text-sm text-primary-foreground/80">Practice with AI-scored questions and track your improvement</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="secondary" className="gap-2 rounded-xl font-bold btn-3d"
            onClick={() => window.location.href = "/practice-list?type=speaking"}>
            <Mic className="h-4 w-4" /> Practice Speaking
          </Button>
          <Button variant="secondary" className="gap-2 rounded-xl font-bold"
            onClick={() => window.location.href = "/mock-test"}>
            <Star className="h-4 w-4" /> Take Mock Test
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CoursesPage;
