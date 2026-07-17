import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Clock, Award, Mic, PenLine, BookOpenCheck, Headphones, Loader2, Upload, FileImage, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useDailyStats, usePracticeSessions } from "@/hooks/useQuestions";
import { format, subDays, parseISO, isToday, isYesterday } from "date-fns";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "2px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: 700,
};

const AnalyticsPage = () => {
  const { data: dailyStats = [], isLoading: statsLoading } = useDailyStats();
  const { data: sessions = [], isLoading: sessionsLoading } = usePracticeSessions();

  const computed = useMemo(() => {
    // Overall stats
    const scoredSessions = sessions.filter((s: any) => s.overall_score != null);
    const overallScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((sum: number, s: any) => sum + s.overall_score, 0) / scoredSessions.length)
      : 0;
    const accuracy = overallScore; // accuracy as avg score
    const totalMinutes = dailyStats.reduce((sum, d) => sum + (d.study_minutes || 0), 0);
    const studyHours = (totalMinutes / 60).toFixed(1);
    const totalQuestions = dailyStats.reduce((sum, d) => sum + (d.questions_done || 0), 0);

    // Progress over time (weekly aggregates from daily_stats)
    const progressData = dailyStats.slice(0, 8).reverse().map((d, i) => {
      const scores = [d.speaking_score, d.writing_score, d.reading_score, d.listening_score].filter(Boolean) as number[];
      return {
        week: format(parseISO(d.date), "MMM d"),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    });

    // Radar data from latest stats
    const latest = dailyStats[0];
    const radarData = [
      { subject: "Speaking", score: latest?.speaking_score || 0, fullMark: 90 },
      { subject: "Writing", score: latest?.writing_score || 0, fullMark: 90 },
      { subject: "Reading", score: latest?.reading_score || 0, fullMark: 90 },
      { subject: "Listening", score: latest?.listening_score || 0, fullMark: 90 },
    ];

    // Weekly bar chart (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const stat = dailyStats.find((d) => d.date === dateStr);
      return {
        day: format(date, "EEE"),
        speaking: stat?.speaking_score || 0,
        writing: stat?.writing_score || 0,
        reading: stat?.reading_score || 0,
        listening: stat?.listening_score || 0,
      };
    });

    // Skill breakdown
    const skillBreakdown = [
      { skill: "Speaking", emoji: "🎤", color: "--speaking", score: latest?.speaking_score || 0, target: 79 },
      { skill: "Writing", emoji: "✍️", color: "--info", score: latest?.writing_score || 0, target: 79 },
      { skill: "Reading", emoji: "📖", color: "--warning", score: latest?.reading_score || 0, target: 79 },
      { skill: "Listening", emoji: "🎧", color: "--destructive", score: latest?.listening_score || 0, target: 79 },
    ].map((s) => {
      const catSessions = sessions.filter((sess: any) => sess.questions?.skill === s.skill.toLowerCase());
      return { ...s, questions: catSessions.length, completed: catSessions.filter((sess: any) => sess.overall_score != null).length };
    });

    // Recent practice
    const recentPractice = sessions.slice(0, 6).map((s: any) => {
      const d = parseISO(s.created_at);
      return {
        date: isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d"),
        type: s.questions?.skill ? s.questions.skill.charAt(0).toUpperCase() + s.questions.skill.slice(1) : "Unknown",
        task: s.questions?.sub_type || "N/A",
        score: s.overall_score || 0,
        time: s.time_spent_seconds ? `${Math.round(s.time_spent_seconds / 60)} min` : "—",
      };
    });

    return { overallScore, accuracy, studyHours, totalQuestions, progressData, radarData, weeklyData, skillBreakdown, recentPractice };
  }, [dailyStats, sessions]);

  const [scoreImage, setScoreImage] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | { weak: string[]; strong: string[]; tip: string }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScoreImage(url);
    setAnalysisResult(null);
    setAnalysing(true);
    // Simulate AI analysis delay
    setTimeout(() => {
      setAnalysing(false);
      setAnalysisResult({
        weak: ["Oral Fluency", "Written Discourse", "Spelling"],
        strong: ["Pronunciation", "Reading Comprehension"],
        tip: "Your Oral Fluency is the primary bottleneck. Focus on Read Aloud and Repeat Sentence daily. Aim for 10 RA questions per day with the shadowing technique for 2 weeks.",
      });
    }, 2200);
  };

  const isLoading = statsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground">Score Analytics 📊</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">Track your progress and identify areas for improvement</p>
      </div>

      {/* ── Score Report Upload (STEP 11) ── */}
      <div className="rounded-2xl border-2 bg-card p-5 sm:p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-black text-foreground">Upload Official PTE Score Report</h2>
            <p className="text-xs text-muted-foreground font-semibold">AI analyses your weak communicative skills and gives targeted advice</p>
          </div>
        </div>

        {!scoreImage ? (
          <label
            htmlFor="score-upload"
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 cursor-pointer hover:border-primary/60 hover:bg-primary/10 transition-all group"
          >
            <FileImage className="h-10 w-10 text-primary/40 group-hover:text-primary transition-colors mb-3" />
            <p className="text-sm font-bold text-foreground">Drop your score report here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, PDF screenshots</p>
            <input id="score-upload" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Uploaded image */}
            <div className="relative inline-block">
              <img src={scoreImage} alt="Score report" className="max-h-48 rounded-xl border-2 object-contain" />
              <button
                onClick={() => { setScoreImage(null); setAnalysisResult(null); }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Analysing state */}
            {analysing && (
              <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Analysing your score report...</p>
                  <p className="text-xs text-muted-foreground">AI is identifying weak communicative skills</p>
                </div>
              </div>
            )}

            {/* Analysis result */}
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 space-y-2">
                    <h4 className="text-xs font-black text-destructive uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Weak Areas
                    </h4>
                    {analysisResult.weak.map((w) => (
                      <div key={w} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        <span className="text-sm font-semibold text-foreground">{w}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Strong Areas
                    </h4>
                    {analysisResult.strong.map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-semibold text-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-2">💡 AI Recommendation</h4>
                  <p className="text-sm font-semibold text-foreground">{analysisResult.tip}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>


      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Overall Score", value: String(computed.overallScore), suffix: "/90", icon: TrendingUp, color: "--primary" },
          { label: "Accuracy Rate", value: String(computed.accuracy), suffix: "/90", icon: Target, color: "--info" },
          { label: "Study Hours", value: computed.studyHours, suffix: "hrs", icon: Clock, color: "--warning" },
          { label: "Questions Done", value: String(computed.totalQuestions), suffix: "", icon: Award, color: "--speaking" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border-2 bg-card p-5 relative overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] opacity-10"
              style={{ background: `hsl(var(${stat.color}))` }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-muted-foreground">{stat.label}</span>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: `hsl(var(${stat.color}) / 0.12)` }}>
                <stat.icon className="h-4 w-4" style={{ color: `hsl(var(${stat.color}))` }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-foreground">{stat.value}</span>
              <span className="text-sm font-bold text-muted-foreground">{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-2xl border-2 bg-card p-4 sm:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-black text-foreground mb-4">Progress Over Time 📈</h3>
          {computed.progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={computed.progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={700} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 90]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 3, stroke: "hsl(var(--card))" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground font-semibold text-sm">
              No data yet. Complete some practice sessions! 🚀
            </div>
          )}
        </div>

        <div className="rounded-2xl border-2 bg-card p-4 sm:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-black text-foreground mb-4">Skills Breakdown 🎯</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={computed.radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={700} />
              <PolarRadiusAxis angle={30} domain={[0, 90]} stroke="hsl(var(--border))" fontSize={10} />
              <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="rounded-2xl border-2 bg-card p-4 sm:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="font-black text-foreground mb-4">Weekly Performance by Category 📅</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={computed.weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={700} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 90]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="speaking" fill="hsl(var(--speaking))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="writing" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="reading" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="listening" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4">
          {[
            { label: "Speaking", color: "hsl(var(--speaking))" },
            { label: "Writing", color: "hsl(var(--info))" },
            { label: "Reading", color: "hsl(var(--warning))" },
            { label: "Listening", color: "hsl(var(--destructive))" },
          ].map((cat) => (
            <span key={cat.label} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <div className="h-3 w-3 rounded" style={{ background: cat.color }} />
              {cat.label}
            </span>
          ))}
        </div>
      </div>

      {/* Skill Cards */}
      <div>
        <h3 className="font-black text-foreground mb-4">Category Progress 🏆</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {computed.skillBreakdown.map((skill, i) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-2xl border-2 bg-card p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{skill.emoji}</span>
                <span className="font-black text-foreground">{skill.skill}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-black text-foreground">{skill.score}</span>
                <span className="text-sm font-bold text-muted-foreground">/ {skill.target}</span>
              </div>
              <Progress value={skill.target > 0 ? Math.min((skill.score / skill.target) * 100, 100) : 0} className="h-2 mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">{skill.completed}/{skill.questions} done</p>
              <span className={`text-xs font-black ${skill.score >= skill.target ? "text-primary" : "text-accent-foreground"}`}>
                {skill.score >= skill.target ? "✅ Target reached!" : skill.score > 0 ? `${skill.target - skill.score} points to go 💪` : "Start practicing! 🚀"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Practice */}
      <div>
        <h3 className="font-black text-foreground mb-4">Recent Sessions 📝</h3>
        <div className="rounded-2xl border-2 bg-card overflow-hidden overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
          {computed.recentPractice.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-semibold text-sm">
              No sessions yet. Start practicing to see your history! 🚀
            </div>
          ) : (
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b-2 bg-muted/40">
                  <th className="text-left px-5 py-3 font-black text-xs uppercase text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 font-black text-xs uppercase text-muted-foreground">Category</th>
                  <th className="text-left px-5 py-3 font-black text-xs uppercase text-muted-foreground">Task</th>
                  <th className="text-right px-5 py-3 font-black text-xs uppercase text-muted-foreground">Time</th>
                  <th className="text-right px-5 py-3 font-black text-xs uppercase text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {computed.recentPractice.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-semibold text-muted-foreground">{item.date}</td>
                    <td className="px-5 py-3">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-muted text-foreground">{item.type}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-muted-foreground">{item.task}</td>
                    <td className="px-5 py-3 text-right font-semibold text-muted-foreground">{item.time}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black ${item.score >= 70 ? "bg-primary/10 text-primary" : item.score >= 50 ? "bg-accent/15 text-accent-foreground" : "bg-destructive/10 text-destructive"}`}>
                        {item.score}/90
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
