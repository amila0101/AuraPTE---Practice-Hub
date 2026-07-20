import { TrendingUp, Target, Clock, Award, Mic, PenLine, BookOpenCheck, Headphones, Flame, Calendar, ChevronRight, Zap, Trophy, Loader2, Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDailyStats, usePracticeSessions } from "@/hooks/useQuestions";
import { useMemo } from "react";
import { format, subDays, isToday, isYesterday, parseISO } from "date-fns";
import NotificationBanner from "@/components/NotificationBanner";

const categoryMeta = [
  { title: "Speaking", skill: "speaking", icon: Mic, color: "--speaking" },
  { title: "Writing", skill: "writing", icon: PenLine, color: "--info" },
  { title: "Reading", skill: "reading", icon: BookOpenCheck, color: "--warning" },
  { title: "Listening", skill: "listening", icon: Headphones, color: "--destructive" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.email?.split("@")[0] || "Student";
  const { data: dailyStats = [], isLoading: statsLoading } = useDailyStats();
  const { data: sessions = [], isLoading: sessionsLoading } = usePracticeSessions();

  const computed = useMemo(() => {
    // Overall score: average of latest daily_stats skill scores
    const latest = dailyStats[0];
    const scores = latest ? [latest.speaking_score, latest.writing_score, latest.reading_score, latest.listening_score].filter(Boolean) as number[] : [];
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Total study hours this month
    const totalMinutes = dailyStats.reduce((sum, d) => sum + (d.study_minutes || 0), 0);
    const studyHours = (totalMinutes / 60).toFixed(1);

    // Total questions done
    const totalQuestions = dailyStats.reduce((sum, d) => sum + (d.questions_done || 0), 0);

    // Accuracy from sessions
    const scoredSessions = sessions.filter((s: any) => s.overall_score != null);
    const accuracy = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / scoredSessions.length)
      : 0;

    // Weekly chart data from daily_stats (last 7 days)
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyChart = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const stat = dailyStats.find((d) => d.date === dateStr);
      const dayScores = stat ? [stat.speaking_score, stat.writing_score, stat.reading_score, stat.listening_score].filter(Boolean) as number[] : [];
      return {
        day: weekDays[date.getDay()],
        score: dayScores.length > 0 ? Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length) : 0,
      };
    });

    // Streak: consecutive days with questions_done > 0
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const stat = dailyStats.find((d) => d.date === dateStr);
      if (stat && (stat.questions_done || 0) > 0) streak++;
      else break;
    }

    // Streak days (last 7)
    const streakDays = Array.from({ length: 7 }, (_, i) => {
      const dateStr = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const stat = dailyStats.find((d) => d.date === dateStr);
      return (stat?.questions_done || 0) > 0;
    });

    // Category stats from sessions
    const categoryCounts = categoryMeta.map((cat) => {
      const catSessions = sessions.filter((s: any) => s.questions?.skill === cat.skill);
      return {
        ...cat,
        questions: catSessions.length,
        completed: catSessions.filter((s: any) => s.overall_score != null).length,
      };
    });

    // Recent scores from sessions
    const recentScores = sessions.slice(0, 5).map((s: any) => {
      const d = parseISO(s.created_at);
      return {
        date: isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d"),
        type: s.questions?.skill ? s.questions.skill.charAt(0).toUpperCase() + s.questions.skill.slice(1) : "Unknown",
        subType: s.questions?.sub_type || "N/A",
        score: s.overall_score || 0,
      };
    });

    const targetScore = 79;

    return { overallScore, studyHours, totalQuestions, accuracy, weeklyChart, streak, streakDays, categoryCounts, recentScores, targetScore };
  }, [dailyStats, sessions]);

  const stats = [
    { label: "Overall Score", value: String(computed.overallScore), suffix: "/90", icon: Trophy, color: "--primary" },
    { label: "Accuracy", value: String(computed.accuracy), suffix: "%", icon: Target, color: "--info" },
    { label: "Practice Time", value: computed.studyHours, suffix: "h", icon: Clock, color: "--warning" },
    { label: "Questions Done", value: String(computed.totalQuestions), suffix: "", icon: Award, color: "--speaking" },
  ];

  const isLoading = statsLoading || sessionsLoading;

  return (
    <div className="min-h-screen mesh-gradient-bg relative">
      {/* Decorative background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[100px] pointer-events-none" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto"
      >
        <NotificationBanner />

        {/* Hero Section */}
        <motion.div variants={item} className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 overflow-hidden">
          {/* Subtle accent glow inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              Hey, {firstName}! <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </h1>
            <p className="text-sm sm:text-base font-medium text-muted-foreground mt-2 max-w-md leading-relaxed">
              {computed.totalQuestions > 0 
                ? "Your dedication is paying off. Keep the momentum going and crush your target score!" 
                : "Welcome to your intelligent practice hub. Start a session to unlock your potential!"}
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background/50 border border-white/10 backdrop-blur-md w-full sm:w-auto justify-center shadow-inner">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xl font-black text-foreground leading-none">{computed.streak}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Day Streak</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/practice-list?type=speaking")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Zap className="h-5 w-5" />
              Start Practice
            </motion.button>
          </div>
        </motion.div>

        {/* 4 Core Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card p-5 group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[48px] opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500"
                style={{ background: `hsl(var(${stat.color}))` }}
              />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/50 border border-white/10 backdrop-blur-sm shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <stat.icon className="h-5 w-5" style={{ color: `hsl(var(${stat.color}))` }} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                ) : (
                  <>
                    <span className="text-3xl font-black text-foreground tracking-tight">{stat.value}</span>
                    <span className="text-sm font-bold text-muted-foreground">{stat.suffix}</span>
                  </>
                )}
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts & Targets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Performance Chart */}
          <motion.div
            variants={item}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Performance Trend
                </h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">Your overall score progression this week</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/40 border border-white/10 text-xs font-bold text-foreground backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-primary" />
                Last 7 Days
              </div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={computed.weeklyChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradientNext" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    fill="url(#scoreGradientNext)"
                    animationDuration={1500}
                    animationEasing="ease-out"
                    dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2, stroke: "hsl(var(--primary))" }}
                    activeDot={{ r: 6, strokeWidth: 3, stroke: "hsl(var(--primary))", fill: "hsl(var(--background))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Target Score & Mini Streak */}
          <motion.div variants={item} className="flex flex-col gap-4">
            <div className="glass-card p-6 flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-10">
                <Target className="h-32 w-32 text-primary" />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Target Score</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-foreground tracking-tighter glow-text">{computed.overallScore}</span>
                  <span className="text-lg font-bold text-muted-foreground">/ {computed.targetScore}</span>
                </div>
                <Progress value={computed.targetScore > 0 ? Math.min((computed.overallScore / computed.targetScore) * 100, 100) : 0} className="h-3 mb-3 bg-background/50 backdrop-blur-sm border border-white/10" />
                <p className="text-sm font-semibold text-muted-foreground">
                  {computed.overallScore >= computed.targetScore
                    ? "Target reached! Exceptional work!"
                    : `${computed.targetScore - computed.overallScore} points away. You can do this!`}
                </p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 text-center">Weekly Consistency</h3>
              <div className="flex items-center justify-between gap-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        computed.streakDays[i]
                          ? "text-primary-foreground shadow-md shadow-primary/20 scale-110"
                          : "bg-background/40 border border-white/10 text-muted-foreground"
                      }`}
                      style={computed.streakDays[i] ? { background: "var(--gradient-primary)" } : undefined}
                    >
                      {computed.streakDays[i] ? "✓" : d}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Practice Categories */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Award className="h-6 w-6 text-accent" /> Skill Modules
            </h2>
            <button
              onClick={() => navigate("/practice-list?type=speaking")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background/40 border border-white/10 backdrop-blur-sm text-sm font-bold text-foreground hover:bg-background/60 transition-colors"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {computed.categoryCounts.map((cat, index) => {
              const pct = cat.questions > 0 ? Math.round((cat.completed / cat.questions) * 100) : 0;
              return (
                <motion.div
                  key={cat.title}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 cursor-pointer group"
                  onClick={() => navigate(`/practice-list?type=${cat.title.toLowerCase()}`)}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="flex items-center justify-center h-12 w-12 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                      style={{ background: `hsl(var(${cat.color}) / 0.15)` }}
                    >
                      <cat.icon className="h-6 w-6" style={{ color: `hsl(var(${cat.color}))` }} />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">{cat.title}</h3>
                  <div className="flex items-center justify-between mt-2 mb-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {cat.completed}/{cat.questions} Completed
                    </p>
                    <span className="text-sm font-black" style={{ color: `hsl(var(${cat.color}))` }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background/50 border border-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.4 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: `hsl(var(${cat.color}))` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item}>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-info" /> Recent Activity
          </h2>
          <div className="glass-card overflow-hidden">
            {computed.recentScores.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No Activity Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Complete your first practice session to see your recent scores and performance tracking here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-background/20">
                      <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Date</th>
                      <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Module</th>
                      <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Task Type</th>
                      <th className="text-right px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.recentScores.map((score, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-background/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground">{score.date}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-background/50 border border-white/10 text-foreground shadow-sm">
                            {score.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-muted-foreground">{score.subType}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center justify-center min-w-[56px] px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${
                              score.score >= 75
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : score.score >= 60
                                ? "bg-accent/20 text-accent-foreground border border-accent/20"
                                : "bg-destructive/15 text-destructive border border-destructive/20"
                            }`}
                          >
                            {score.score}/90
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
