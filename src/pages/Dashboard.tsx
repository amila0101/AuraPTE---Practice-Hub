import { TrendingUp, Target, Clock, Award, Mic, PenLine, BookOpenCheck, Headphones, ArrowUpRight, Flame, Calendar, ChevronRight, Zap, Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDailyStats, usePracticeSessions } from "@/hooks/useQuestions";
import { useMemo } from "react";
import { format, subDays, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import NotificationBanner from "@/components/NotificationBanner";

const categoryMeta = [
  { title: "Speaking", skill: "speaking", icon: Mic, color: "--speaking", emoji: "🎤" },
  { title: "Writing", skill: "writing", icon: PenLine, color: "--info", emoji: "✍️" },
  { title: "Reading", skill: "reading", icon: BookOpenCheck, color: "--warning", emoji: "📖" },
  { title: "Listening", skill: "listening", icon: Headphones, color: "--destructive", emoji: "🎧" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
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

    // Target score from profile (use 79 as default PTE target)
    const targetScore = 79;

    return { overallScore, studyHours, totalQuestions, accuracy, weeklyChart, streak, streakDays, categoryCounts, recentScores, targetScore };
  }, [dailyStats, sessions]);

  const stats = [
    { label: "Overall Score", value: String(computed.overallScore), suffix: "/90", icon: TrendingUp, color: "--primary" },
    { label: "Accuracy", value: String(computed.accuracy), suffix: "%", icon: Target, color: "--info" },
    { label: "Practice Time", value: computed.studyHours, suffix: "hrs", icon: Clock, color: "--warning" },
    { label: "Questions Done", value: String(computed.totalQuestions), suffix: "", icon: Award, color: "--speaking" },
  ];

  const isLoading = statsLoading || sessionsLoading;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto"
    >
      {/* Notifications */}
      <NotificationBanner />

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground">
            Hey, {firstName}! 👋
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            {computed.totalQuestions > 0 ? "Keep up the great work! You're making awesome progress." : "Start practicing to see your progress here!"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-accent/15 border-2 border-accent/30 cursor-default"
          >
            <Flame className="h-5 w-5 text-accent" />
            <span className="text-sm font-black text-foreground">{computed.streak} 🔥</span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/practice-list?type=speaking")}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black text-primary-foreground btn-3d"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Zap className="h-4 w-4" />
            Start Practice
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border-2 bg-card p-5 transition-colors"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[48px] opacity-10"
              style={{ background: `hsl(var(${stat.color}))` }}
            />
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl"
                style={{ background: `hsl(var(${stat.color}) / 0.12)` }}
              >
                <stat.icon className="h-5 w-5" style={{ color: `hsl(var(${stat.color}))` }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">{stat.value}</span>
                  <span className="text-sm font-bold text-muted-foreground">{stat.suffix}</span>
                </>
              )}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Middle Row: Chart + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Weekly Performance Chart */}
        <motion.div
          variants={item}
          className="lg:col-span-2 rounded-2xl border-2 bg-card p-4 sm:p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm sm:text-base font-black text-foreground">Weekly Performance 📊</h2>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Your score trend this week</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-bold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              This Week
            </div>
          </div>
          <div className="h-[180px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={computed.weeklyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    boxShadow: "var(--shadow-elevated)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#scoreGradient)"
                  dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 3, stroke: "hsl(var(--card))" }}
                  activeDot={{ r: 7, strokeWidth: 3, stroke: "hsl(var(--card))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Streak & Target */}
        <motion.div variants={item} className="flex flex-col gap-4">
          <div className="rounded-2xl border-2 bg-card p-5 flex-1" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔥</span>
              <h3 className="text-sm font-black text-foreground">Practice Streak</h3>
            </div>
            <div className="flex items-center justify-between gap-0.5 sm:gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 sm:gap-1.5">
                  <div
                    className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${
                      computed.streakDays[i]
                        ? "text-primary-foreground"
                        : "bg-muted text-muted-foreground border-2"
                    }`}
                    style={computed.streakDays[i] ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    {computed.streakDays[i] ? "✓" : d}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 bg-card p-5 flex-1" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <h3 className="text-sm font-black text-foreground">Target Score</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-foreground">{computed.overallScore}</span>
              <span className="text-sm font-bold text-muted-foreground">/ {computed.targetScore}</span>
            </div>
            <Progress value={computed.targetScore > 0 ? Math.min((computed.overallScore / computed.targetScore) * 100, 100) : 0} className="h-2.5 mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">
              {computed.overallScore >= computed.targetScore
                ? "🎉 Target reached! Amazing!"
                : `${computed.targetScore - computed.overallScore} points to reach your target! 💪`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Practice Categories */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-foreground">Practice Categories 🎯</h2>
          <button
            onClick={() => navigate("/practice-list?type=speaking")}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {computed.categoryCounts.map((cat) => {
            const pct = cat.questions > 0 ? Math.round((cat.completed / cat.questions) * 100) : 0;
            return (
              <motion.div
                key={cat.title}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl border-2 bg-card p-5 cursor-pointer transition-colors group"
                style={{ boxShadow: "var(--shadow-card)" }}
                onClick={() => navigate(`/practice-list?type=${cat.title.toLowerCase()}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center justify-center h-12 w-12 rounded-xl text-2xl"
                    style={{ background: `hsl(var(${cat.color}) / 0.12)` }}
                  >
                    {cat.emoji}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-black text-foreground">{cat.title}</h3>
                <div className="flex items-center justify-between mt-1.5 mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {cat.completed}/{cat.questions} done
                  </p>
                  <span className="text-xs font-black" style={{ color: `hsl(var(${cat.color}))` }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `hsl(var(${cat.color}))` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Scores */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-foreground">Recent Activity 📝</h2>
          <button
            onClick={() => navigate("/analytics")}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View Analytics <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="rounded-2xl border-2 bg-card overflow-hidden overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
          {computed.recentScores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-semibold text-sm">
              No practice sessions yet. Start practicing to see your activity! 🚀
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 bg-muted/40">
                  <th className="text-left px-5 py-3.5 font-black text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3.5 font-black text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="text-left px-5 py-3.5 font-black text-xs uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="text-right px-5 py-3.5 font-black text-xs uppercase tracking-wider text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {computed.recentScores.map((score, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-muted-foreground">{score.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-muted text-foreground">
                        {score.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-muted-foreground">{score.subType}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-xl text-xs font-black ${
                          score.score >= 75
                            ? "bg-primary/10 text-primary"
                            : score.score >= 60
                            ? "bg-accent/15 text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {score.score}/90
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
