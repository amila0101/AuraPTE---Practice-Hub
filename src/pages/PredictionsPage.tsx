import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sparkles, RefreshCw, TrendingUp, Mic, PenLine,
  BookOpenCheck, Headphones, ChevronRight, Clock, Star,
  BarChart3, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────
type Badge = "HOT" | "NEW" | "UPDATED" | "REPEAT";
type Skill = "speaking" | "writing" | "reading" | "listening";

interface PredictedQuestion {
  id: number;
  title: string;
  subType: string;
  skill: Skill;
  badge: Badge;
  frequency: number; // how many times reported in real exam
  lastSeen: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

// ── Weekly Stats ───────────────────────────────────────────────────────────
const weekStats = {
  new: 18,
  predict: 964,
  updated: 135,
  repeat: 64,
  dateRange: "Jul 14 – Jul 20, 2026",
};

// ── Sample Prediction Data ─────────────────────────────────────────────────
const predictions: PredictedQuestion[] = [
  // Speaking
  { id: 1, title: "Climate change impact on global ecosystems and biodiversity", subType: "Read Aloud", skill: "speaking", badge: "HOT", frequency: 47, lastSeen: "2 days ago", difficulty: "Medium" },
  { id: 2, title: "The role of artificial intelligence in modern healthcare", subType: "Read Aloud", skill: "speaking", badge: "HOT", frequency: 38, lastSeen: "3 days ago", difficulty: "Hard" },
  { id: 3, title: "Describe a bar chart showing global energy consumption by sector", subType: "Describe Image", skill: "speaking", badge: "NEW", frequency: 12, lastSeen: "1 day ago", difficulty: "Medium" },
  { id: 4, title: "Lecture about urbanisation and developing nations", subType: "Re-tell Lecture", skill: "speaking", badge: "REPEAT", frequency: 29, lastSeen: "5 days ago", difficulty: "Hard" },
  { id: 5, title: "What is the term for animals that eat both plants and meat?", subType: "Answer Short Question", skill: "speaking", badge: "HOT", frequency: 56, lastSeen: "1 day ago", difficulty: "Easy" },
  { id: 6, title: "Scientists have discovered a new species of deep-sea fish", subType: "Repeat Sentence", skill: "speaking", badge: "UPDATED", frequency: 22, lastSeen: "4 days ago", difficulty: "Medium" },

  // Writing
  { id: 7, title: "The growth of online education has transformed traditional learning institutions", subType: "Summarize Written Text", skill: "writing", badge: "HOT", frequency: 41, lastSeen: "2 days ago", difficulty: "Medium" },
  { id: 8, title: "Is technology making people more or less social? Discuss both views.", subType: "Write Essay", skill: "writing", badge: "NEW", frequency: 9, lastSeen: "Today", difficulty: "Hard" },
  { id: 9, title: "Government should invest more in public transport than private roads", subType: "Write Essay", skill: "writing", badge: "HOT", frequency: 35, lastSeen: "3 days ago", difficulty: "Hard" },
  { id: 10, title: "The deforestation of rainforests is contributing to rapid climate change", subType: "Summarize Written Text", skill: "writing", badge: "REPEAT", frequency: 28, lastSeen: "6 days ago", difficulty: "Medium" },

  // Reading
  { id: 11, title: "The History of the Internet — paragraph reordering exercise", subType: "Re-order Paragraphs", skill: "reading", badge: "HOT", frequency: 33, lastSeen: "2 days ago", difficulty: "Hard" },
  { id: 12, title: "Renewable Energy Sources — fill in the blanks", subType: "Fill in the Blanks (R&W)", skill: "reading", badge: "UPDATED", frequency: 19, lastSeen: "4 days ago", difficulty: "Medium" },
  { id: 13, title: "According to the passage, what is the main cause of ocean acidification?", subType: "Multiple Choice (Single)", skill: "reading", badge: "NEW", frequency: 7, lastSeen: "Today", difficulty: "Medium" },
  { id: 14, title: "Biodiversity conservation strategies — drag and drop exercise", subType: "Fill in the Blanks (R)", skill: "reading", badge: "REPEAT", frequency: 44, lastSeen: "1 day ago", difficulty: "Hard" },

  // Listening
  { id: 15, title: "Lecture on the economic impact of tourism in developing countries", subType: "Summarize Spoken Text", skill: "listening", badge: "HOT", frequency: 52, lastSeen: "1 day ago", difficulty: "Hard" },
  { id: 16, title: "Discussion about space exploration funding priorities", subType: "Multiple Choice (Multiple)", skill: "listening", badge: "NEW", frequency: 11, lastSeen: "Today", difficulty: "Hard" },
  { id: 17, title: "Write exactly what you hear about solar panel efficiency", subType: "Write from Dictation", skill: "listening", badge: "HOT", frequency: 63, lastSeen: "2 days ago", difficulty: "Medium" },
  { id: 18, title: "Interview with a marine biologist about coral bleaching", subType: "Highlight Correct Summary", skill: "listening", badge: "UPDATED", frequency: 18, lastSeen: "3 days ago", difficulty: "Hard" },
  { id: 19, title: "A documentary on the effects of plastic pollution in oceans", subType: "Highlight Incorrect Words", skill: "listening", badge: "REPEAT", frequency: 31, lastSeen: "4 days ago", difficulty: "Medium" },
  { id: 20, title: "The most important factor in achieving academic success is...", subType: "Select Missing Word", skill: "listening", badge: "HOT", frequency: 27, lastSeen: "2 days ago", difficulty: "Easy" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const skillMeta: Record<Skill, { icon: typeof Mic; color: string; bg: string; label: string; emoji: string }> = {
  speaking:  { icon: Mic,          color: "hsl(var(--speaking))",    bg: "bg-purple-500/10",  label: "Speaking",  emoji: "🎤" },
  writing:   { icon: PenLine,      color: "hsl(var(--info))",        bg: "bg-blue-500/10",    label: "Writing",   emoji: "✍️" },
  reading:   { icon: BookOpenCheck,color: "hsl(var(--warning))",     bg: "bg-amber-500/10",   label: "Reading",   emoji: "📖" },
  listening: { icon: Headphones,   color: "hsl(var(--destructive))", bg: "bg-red-500/10",     label: "Listening", emoji: "🎧" },
};

const badgeMeta: Record<Badge, { label: string; className: string }> = {
  HOT:     { label: "🔥 HOT",     className: "bg-red-500/15 text-red-500 border-red-500/30" },
  NEW:     { label: "🆕 NEW",     className: "bg-primary/15 text-primary border-primary/30" },
  UPDATED: { label: "♻️ UPDATED", className: "bg-blue-500/15 text-blue-400 border-blue-400/30" },
  REPEAT:  { label: "🔄 REPEAT",  className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
};

const difficultyStyle: Record<string, string> = {
  Easy:   "bg-primary/10 text-primary",
  Medium: "bg-accent/15 text-accent-foreground",
  Hard:   "bg-destructive/10 text-destructive",
};

const tabs: { key: Skill | "all"; label: string; emoji: string }[] = [
  { key: "all",       label: "All",       emoji: "📋" },
  { key: "speaking",  label: "Speaking",  emoji: "🎤" },
  { key: "writing",   label: "Writing",   emoji: "✍️" },
  { key: "reading",   label: "Reading",   emoji: "📖" },
  { key: "listening", label: "Listening", emoji: "🎧" },
];

// ── Component ──────────────────────────────────────────────────────────────
const PredictionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Skill | "all">("all");
  const [activeBadge, setActiveBadge] = useState<Badge | "all">("all");

  const filtered = predictions.filter((q) => {
    const matchSkill = activeTab === "all" || q.skill === activeTab;
    const matchBadge = activeBadge === "all" || q.badge === activeBadge;
    return matchSkill && matchBadge;
  });

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 lg:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "var(--gradient-primary)" }}>
            🎯
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Weekly Predictions</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Questions predicted for real PTE exams · <span className="text-primary">{weekStats.dateRange}</span>
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/practice-list?type=speaking")} className="gap-2 rounded-xl font-bold btn-3d w-full sm:w-auto">
          <Sparkles className="h-4 w-4" /> Practice Now
        </Button>
      </motion.div>

      {/* ── Info Banner ── */}
      <motion.div variants={item} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-foreground/80">
          These predictions are compiled from questions reported by PTE candidates worldwide. 
          <strong className="text-primary"> HOT</strong> questions have the highest exam frequency this week. 
          Practice them first to maximize your score! 🚀
        </p>
      </motion.div>

      {/* ── Weekly Stats Bar ── */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New",     value: weekStats.new,     icon: Sparkles,   color: "text-primary",     bg: "bg-primary/10" },
          { label: "Predict", value: weekStats.predict,  icon: BarChart3,  color: "text-blue-400",    bg: "bg-blue-500/10" },
          { label: "Updated", value: weekStats.updated,  icon: RefreshCw,  color: "text-amber-500",   bg: "bg-amber-500/10" },
          { label: "Repeat%", value: `${weekStats.repeat}%`, icon: TrendingUp, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-2xl border-2 bg-card p-4 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-muted-foreground mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Skill Tabs ── */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const count = tab.key === "all" ? predictions.length : predictions.filter(q => q.skill === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-muted-foreground border-transparent hover:bg-muted"
              }`}
            >
              <span>{tab.emoji}</span> {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.key ? "bg-white/20" : "bg-muted"
              }`}>{count}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Badge Filters ── */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        <span className="text-xs font-bold text-muted-foreground self-center">Filter:</span>
        {(["all", "HOT", "NEW", "UPDATED", "REPEAT"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setActiveBadge(b)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
              activeBadge === b
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            {b === "all" ? "All Types" : badgeMeta[b].label}
          </button>
        ))}
      </motion.div>

      {/* ── Predictions List ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + activeBadge}
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-semibold">
              No predictions match your filters 🔍
            </div>
          ) : (
            filtered.map((q, i) => {
              const meta = skillMeta[q.skill];
              const badge = badgeMeta[q.badge];
              return (
                <motion.div
                  key={q.id}
                  variants={item}
                  className="flex items-center gap-4 rounded-2xl border-2 bg-card p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                  style={{ boxShadow: "var(--shadow-card)" }}
                  onClick={() => navigate(`/practice-list?type=${q.skill}`)}
                >
                  {/* Rank */}
                  <div className="shrink-0 w-8 text-center">
                    <span className="text-sm font-black text-muted-foreground">#{i + 1}</span>
                  </div>

                  {/* Skill icon */}
                  <div className={`shrink-0 h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center text-lg`}>
                    {meta.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {q.subType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyStyle[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{q.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-red-400" />
                        {q.frequency} reports
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {q.lastSeen}
                      </span>
                    </div>
                  </div>

                  {/* Frequency bar */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 gap-1 w-24">
                    <span className="text-xs font-black text-foreground">{q.frequency}</span>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((q.frequency / 65) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">frequency</span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Skill Summary Cards ── */}
      <motion.div variants={item}>
        <h2 className="text-base font-black text-foreground mb-4">Prediction Breakdown by Skill 📊</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["speaking", "writing", "reading", "listening"] as Skill[]).map((skill) => {
            const meta = skillMeta[skill];
            const skillPreds = predictions.filter(q => q.skill === skill);
            const hot = skillPreds.filter(q => q.badge === "HOT").length;
            return (
              <motion.div
                key={skill}
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-2xl border-2 bg-card p-4 cursor-pointer"
                style={{ boxShadow: "var(--shadow-card)" }}
                onClick={() => { setActiveTab(skill); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <div className="text-2xl mb-2">{meta.emoji}</div>
                <h3 className="font-black text-foreground text-sm">{meta.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{skillPreds.length} predicted</p>
                <div className="flex items-center gap-1 mt-2">
                  <Flame className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-bold text-red-400">{hot} HOT</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Last Updated ── */}
      <motion.div variants={item} className="text-center">
        <p className="text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 inline mr-1" />
          Predictions updated weekly based on candidate reports · Last update: <strong>Jul 14, 2026</strong>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PredictionsPage;
