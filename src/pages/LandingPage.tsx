import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mic, PenLine, BookOpenCheck, Headphones, Zap, ArrowRight,
  CheckCircle2, GraduationCap, BarChart3, BookOpen, Brain,
  Download, Globe, ChevronRight, Users, Award, Clock, Shield,
  Star, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Users,     value: "100K+",  label: "Active Learners",        sub: "Across 40+ countries" },
  { icon: BarChart3, value: "20",     label: "Question Types",         sub: "All official PTE tasks" },
  { icon: BookOpen,  value: "10K+",   label: "Practice Questions",     sub: "AI-generated & growing" },
  { icon: Cpu,       value: "Real",   label: "ASR Audio Scoring",      sub: "Neural ASR + LCS engine" },
];

// ── Skill categories ─────────────────────────────────────────────────────────
const SKILLS = [
  {
    icon: Mic, title: "Speaking", count: 5,
    color: "text-primary", bg: "bg-primary/8", border: "border-primary/20",
    dot: "bg-primary",
    items: ["Read Aloud","Repeat Sentence","Describe Image","Re-tell Lecture","Answer Short Question"],
    badge: "AI Score",
  },
  {
    icon: PenLine, title: "Writing", count: 2,
    color: "text-warning", bg: "bg-warning/8", border: "border-warning/20",
    dot: "bg-warning",
    items: ["Summarize Written Text","Write Essay"],
    badge: "AI Score",
  },
  {
    icon: BookOpenCheck, title: "Reading", count: 5,
    color: "text-success", bg: "bg-success/8", border: "border-success/20",
    dot: "bg-success",
    items: ["MC Single","MC Multiple","Re-order Paragraphs","FIB Drag & Drop","FIB Dropdown"],
    badge: "100% Accurate",
  },
  {
    icon: Headphones, title: "Listening", count: 8,
    color: "text-warning", bg: "bg-warning/8", border: "border-warning/20",
    dot: "bg-warning",
    items: ["Summarize Spoken Text","MC Multiple","MC Single","Highlight Correct Summary",
            "Select Missing Word","Fill in the Blanks","Highlight Incorrect Words","Write from Dictation"],
    badge: "100% Accurate",
  },
];

// ── Study tools ───────────────────────────────────────────────────────────────
const TOOLS = [
  { icon: BookOpen,   title: "Vocab Books",       desc: "Contains 90% of PTE exam vocabulary",              to: "/vocab" },
  { icon: Mic,        title: "Shadowing",          desc: "Improve Read Aloud score in 14 days",              to: "/shadowing" },
  { icon: Brain,      title: "AI Study Plan",      desc: "Personalised recommendations from your results",   to: "/analytics" },
  { icon: BarChart3,  title: "Score Analysis",     desc: "Upload your official score report for AI analysis",to: "/analytics" },
  { icon: Download,   title: "Study Materials",    desc: "Expert PDF resources — free download",              to: "/materials" },
  { icon: Globe,      title: "Weekly Predictions", desc: "Predicted exam questions updated weekly",          to: "/predictions" },
];


// ── Main component ────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-20 sm:h-24">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-md" />
            <span className="hidden sm:inline-block text-[12px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full tracking-wide">BETA</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-[15px] font-medium text-muted-foreground">
            {[["Features","#features"],["Practice","#practice"],["Tools","#tools"],["PTE Guide","#knowledge"]].map(([label,href])=>(
              <a key={label} href={href} className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-8 px-3" onClick={() => navigate("/login")}>Log in</Button>
            <Button size="sm" className="text-xs h-8 px-4 font-bold" onClick={() => navigate("/signup")}>Start Free →</Button>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-0">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 60% 20%, hsl(var(--primary) / 0.07) 0%, transparent 55%), radial-gradient(circle at 20% 80%, hsl(var(--warning) / 0.05) 0%, transparent 40%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pb-12 lg:pb-16 pt-4"
            >
              {/* Headline — tight tracking */}
              <h1 className="text-[2.1rem] sm:text-[2.8rem] lg:text-[3.2rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-foreground">
                Practice PTE Academic<br />& Core with{" "}
                <span className="text-primary">Real AI</span>{" "}
                <span className="text-warning">Scoring</span>
              </h1>

              <p className="mt-4 text-[17px] text-muted-foreground leading-relaxed max-w-[420px]">
                Advanced neural acoustic analysis for speaking. Deterministic algorithms for reading & listening. AI-powered writing feedback. The most accurate free PTE scorer on the web.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" className="h-11 px-6 font-bold text-sm gap-2 shadow-md shadow-primary/20" onClick={() => navigate("/dashboard")}>
                  Start Practising Free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-11 px-6 text-sm gap-2" onClick={() => navigate("/mock-test")}>
                  Take Mock Test
                </Button>
              </div>

              {/* Trust row */}
              <div className="mt-6 flex flex-wrap gap-4 text-[14px] text-muted-foreground">
                {[
                  [CheckCircle2, "100% Free forever"],
                  [CheckCircle2, "All 20 PTE question types"],
                  [CheckCircle2, "Audio pronunciation scoring"],
                ].map(([Icon, text], i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {/* @ts-ignore */}
                    <Icon className="h-3.5 w-3.5 text-success" /> {text}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — clean hero illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden lg:flex items-center justify-center"
            >
              <img
                src="/assets/hero-illustration.png"
                alt="AuraPTE — AI-powered PTE practice platform dashboard"
                className="w-full max-w-[500px] h-auto mx-auto object-contain drop-shadow-xl"
                draggable={false}
              />
            </motion.div>
          </div>
        </div>
      </section>



      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 px-5 py-5"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-foreground leading-none">{s.value}</div>
                  <div className="text-[13px] font-semibold text-foreground mt-0.5">{s.label}</div>
                  <div className="text-[12px] text-muted-foreground">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRACTICE CATEGORIES ───────────────────────────────────────────── */}
      <section id="practice" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-widest text-primary mb-1">Complete Coverage</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">All 20 PTE Question Types</h2>
            <p className="text-[15px] text-muted-foreground mt-1.5">Every task from the official PTE Academic exam — practised and scored</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs text-primary" onClick={() => navigate("/practice")}>
            Browse all <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SKILLS.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className={`rounded-2xl border ${cat.border} bg-card hover:shadow-md transition-all cursor-pointer group`}
              onClick={() => navigate(`/practice?type=${cat.title.toLowerCase()}`)}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${cat.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${cat.bg} flex items-center justify-center`}>
                    <cat.icon className={`h-4.5 w-4.5 ${cat.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{cat.title}</div>
                    <div className="text-[12px] text-muted-foreground">{cat.count} question types</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>{cat.badge}</span>
                  <ChevronRight className={`h-4 w-4 ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </div>

              {/* Question type rows */}
              <div className="px-5 py-3 space-y-1.5">
                {cat.items.map((item, j) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${cat.dot} shrink-0`} />
                    <span className="text-[14px] text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ── SCORING ENGINE CALLOUT ─────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/60 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            {/* Left */}
            <div className="space-y-5">
              <div className="text-[13px] font-bold uppercase tracking-widest text-primary">Scoring Engine</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Built for Real PTE Accuracy</h2>
              <p className="text-base text-muted-foreground max-w-lg">
                AuraPTE uses a hybrid scoring architecture — not a single AI model guessing your score. Each question type gets the exact method it deserves.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Mic,        label: "Speaking", method: "Advanced Neural ASR · WPM · LCS · Non-linear confidence curve", color: "text-primary", bg: "bg-primary/10" },
                  { icon: PenLine,    label: "Writing",  method: "LLM Assessment · Raw sub-scores · TypeScript weighted math", color: "text-warning", bg: "bg-warning/10" },
                  { icon: BookOpenCheck, label: "Reading",  method: "100% deterministic — pure string algorithms, zero AI", color: "text-success", bg: "bg-success/10" },
                  { icon: Headphones, label: "Listening", method: "100% deterministic — LCS / exact match / negative marking", color: "text-warning", bg: "bg-warning/10" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
                    <div className={`h-8 w-8 rounded-lg ${row.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <row.icon className={`h-4 w-4 ${row.color}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-foreground">{row.label}</div>
                      <div className="text-[13px] text-muted-foreground">{row.method}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — accuracy card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <span className="text-[13px] font-black uppercase tracking-widest text-muted-foreground">Accuracy vs Real PTE</span>
                <span className="text-[12px] text-muted-foreground">After all fixes</span>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { skill: "Reading & Listening", pct: 100, label: "Deterministic", color: "bg-success" },
                  { skill: "Speaking (Audio)",    pct: 86,  label: "Neural ASR", color: "bg-primary" },
                  { skill: "Writing",             pct: 78,  label: "AI + Weights", color: "bg-warning" },
                ].map((row) => (
                  <div key={row.skill} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-semibold text-foreground">{row.skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">{row.label}</span>
                        <span className="text-[15px] font-extrabold text-foreground">{row.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className={`h-full rounded-full ${row.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-primary/5 border-t border-primary/15 flex items-center justify-between">
                <span className="text-[13px] font-bold text-primary">Overall System Accuracy</span>
                <span className="text-[15px] font-black text-primary">~95% Match</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDY TOOLS ───────────────────────────────────────────────────── */}
      <section id="tools" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className="text-[13px] font-bold uppercase tracking-widest text-primary mb-1">Everything in One Place</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">PTE Study Tools</h2>
          <p className="text-[15px] text-muted-foreground mt-1.5">Beyond just practice — a complete preparation ecosystem</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(tool.to)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <tool.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-[15px] font-bold text-foreground">{tool.title}</h3>
              <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WHY PTE ───────────────────────────────────────────────────────── */}
      <section className="py-12 bg-muted/20 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-widest text-primary mb-2">Why PTE?</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-5">The Smarter Path to<br />English Certification</h2>
            <div className="space-y-3">
              {[
                { icon: Globe,  text: "Accepted by 3,000+ governments and universities worldwide" },
                { icon: Clock,  text: "Single 2-hour test with results typically within 48 hours" },
                { icon: Shield, text: "Computer-based with fair, impartial AI scoring — no human bias" },
                { icon: Award,  text: "Unlimited re-takes — improve and rebook quickly" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[14px] text-muted-foreground">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Score target card */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <div className="text-[13px] font-black uppercase tracking-widest text-muted-foreground">PTE Score Band Guide</div>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { score: "90",   label: "Expert",       desc: "Near-native level — top universities",    color: "text-success",     bar: "bg-success",     pct: 100 },
                { score: "79+",  label: "Immigration",  desc: "Australian / NZ visa requirement",         color: "text-primary",     bar: "bg-primary",     pct: 88  },
                { score: "65+",  label: "University",   desc: "Most undergraduate / postgrad programs",   color: "text-warning",     bar: "bg-warning",     pct: 72  },
                { score: "50+",  label: "Foundation",   desc: "Foundation courses and some colleges",     color: "text-warning",     bar: "bg-warning",     pct: 56  },
              ].map((band) => (
                <div key={band.score} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`text-xl font-extrabold w-12 shrink-0 ${band.color}`}>{band.score}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground">{band.label}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{band.desc}</div>
                    <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${band.pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className={`h-full rounded-full ${band.bar}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-muted/40 border-t border-border/50 text-center">
              <Button size="sm" className="text-xs h-8 px-5" onClick={() => navigate("/dashboard")}>
                Set My Target Score →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── KNOWLEDGE BASE ────────────────────────────────────────────────── */}
      <section id="knowledge" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className="text-[13px] font-bold uppercase tracking-widest text-primary mb-1">Expert Guides</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">PTE Knowledge Base</h2>
          <p className="text-[15px] text-muted-foreground mt-1.5">Tips, strategy, and exam insight — written for real results</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: "PTE Academic Guide",  desc: "Exam format, scoring, booking and what to expect on test day", tag: "Beginner" },
            { title: "Speaking Tips",        desc: "Pronunciation, fluency, and template strategies for Read Aloud", tag: "High Impact" },
            { title: "Writing Tips",         desc: "One-sentence summaries, essay structure, and word count rules", tag: "High Impact" },
            { title: "Reading Tips",         desc: "Time management for MC, FIB, and Re-order Paragraphs",          tag: "Strategy" },
            { title: "Listening Tips",       desc: "WFD memory tricks, SST structure, and Highlight Incorrect tips", tag: "Strategy" },
            { title: "Score 79+ Strategy",   desc: "Which tasks carry the most weight — and where to focus first",  tag: "Advanced" },
          ].map((article, i) => (
            <motion.div
              key={article.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate("/guides")}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-[14px] font-bold text-foreground leading-snug">{article.title}</h3>
                <span className="text-[11px] font-bold shrink-0 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{article.tag}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{article.desc}</p>
              <span className="text-[13px] text-primary mt-2.5 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Read more <ChevronRight className="h-3 w-3" />
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-primary/5 border-y border-primary/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            {[Star,Star,Star,Star,Star].map((S,i)=>(
              <S key={i} className="h-4 w-4 text-warning fill-warning" />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Ready to Score Your Target?
          </h2>
          <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
            Start practising today. All 20 question types, real acoustic scoring, zero cost — forever.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="h-11 px-8 font-bold text-sm gap-2 shadow-md shadow-primary/20" onClick={() => navigate("/signup")}>
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6 text-sm" onClick={() => navigate("/practice")}>
              Browse Questions
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-[14px]">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center mb-5">
              <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className="h-16 sm:h-20 w-auto object-contain opacity-90" />
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">AI-powered PTE Academic & Core practice. All 20 question types. Free forever.</p>
            <div className="flex gap-2 flex-wrap">
              {["Free","Open","AI-Scored","PWA"].map(t=>(
                <span key={t} className="text-[12px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          {[
            { heading: "Practice", links: ["Speaking","Writing","Reading","Listening","Mock Test"] },
            { heading: "Study Tools", links: ["Vocab Books","Shadowing","AI Study Plan","Score Analysis","Predictions"] },
            { heading: "Resources", links: ["PTE Guide","Study Materials","Forum","Leaderboard","Contact"] },
          ].map(col=>(
            <div key={col.heading}>
              <h4 className="font-bold text-foreground mb-3">{col.heading}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {col.links.map(l=>(
                  <li key={l} className="hover:text-foreground cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-muted-foreground">
          <span>© 2026 AuraPTE. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            Built by
            <a href="https://avantrix.tech" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center ml-0.5">
              <img src="https://i.ibb.co/nNw72yNz/Gemini-Generated-Image-jfxse8jfxse8jfxs.png" alt="Avantrix" className="h-5 w-auto" />
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
