import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, PenLine, BookOpenCheck, Headphones, Play, CheckCircle2, Search, Sparkles, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useQuestions, useGenerateQuestion } from "@/hooks/useQuestions";
import { usePracticeSessions } from "@/hooks/useQuestions";

const categoryMeta: Record<string, { icon: typeof Mic; color: string; emoji: string }> = {
  speaking: { icon: Mic, color: "--speaking", emoji: "🎤" },
  writing: { icon: PenLine, color: "--info", emoji: "✍️" },
  reading: { icon: BookOpenCheck, color: "--warning", emoji: "📖" },
  listening: { icon: Headphones, color: "--destructive", emoji: "🎧" },
};

const PracticeListPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeType = searchParams.get("type") || "speaking";
  const [search, setSearch] = useState("");
  const [filterSubType, setFilterSubType] = useState("all");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("aurapte_bookmarks") || "[]")) as Set<string>; }
    catch { return new Set(); }
  });
  const generateQuestion = useGenerateQuestion();

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("aurapte_bookmarks", JSON.stringify([...next]));
      return next;
    });
  };

  const { data: questions = [], isLoading } = useQuestions(activeType);
  const { data: sessions = [] } = usePracticeSessions();

  useEffect(() => {
    setSearch("");
    setFilterSubType("all");
  }, [activeType]);

  const handleGenerate = () => {
    generateQuestion.mutate({
      skill: activeType,
      difficulty: "medium",
      exam_type: "pte_academic",
    });
  };

  // Build session lookup: question_id -> best session
  const sessionMap = new Map<string, { score: number | null; status: string }>();
  sessions.forEach((s: any) => {
    const existing = sessionMap.get(s.question_id);
    if (!existing || (s.overall_score || 0) > (existing.score || 0)) {
      sessionMap.set(s.question_id, {
        score: s.overall_score,
        status: s.overall_score != null ? "completed" : "attempted",
      });
    }
  });

  const subTypes = ["all", ...new Set(questions.map((q) => q.sub_type))];
  const filtered = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterSubType === "all" || q.sub_type === filterSubType;
    const matchesBookmark = !showBookmarks || bookmarks.has(q.id);
    return matchesSearch && matchesFilter && matchesBookmark;
  });

  const completed = questions.filter((q) => sessionMap.get(q.id)?.status === "completed").length;
  const meta = categoryMeta[activeType] || categoryMeta.speaking;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl"
            style={{ background: `hsl(var(${meta.color}) / 0.12)` }}
          >
            {meta.emoji}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground capitalize">{activeType} Practice</h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{completed}/{questions.length} completed</p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generateQuestion.isPending}
          className="gap-2 rounded-xl font-bold btn-3d w-full sm:w-auto"
        >
          {generateQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Question
        </Button>
      </div>

      <Progress value={questions.length > 0 ? (completed / questions.length) * 100 : 0} className="h-2.5" />

      {/* Bookmarks Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
            showBookmarks
              ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
              : "bg-card text-muted-foreground border-transparent hover:bg-muted"
          }`}
        >
          {showBookmarks ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          Bookmarks {bookmarks.size > 0 && <span className="font-black">{bookmarks.size}</span>}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-2 font-semibold" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {subTypes.map((st) => (
            <Button
              key={st}
              size="sm"
              variant={filterSubType === st ? "default" : "outline"}
              onClick={() => setFilterSubType(st)}
              className={`text-xs capitalize rounded-xl font-bold ${filterSubType !== st ? "border-2" : ""}`}
            >
              {st === "all" ? "All Types" : st}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Question List */}
      {!isLoading && (
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const session = sessionMap.get(q.id);
            const status = session?.status || "new";
            const score = session?.score;
            const difficulty = q.difficulty || "medium";

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-2xl border-2 bg-card p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/practice/exam?id=${q.id}&type=${q.skill}`)}
              >
                <div className="shrink-0">
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : status === "attempted" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-accent bg-accent/20" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm truncate">{q.title}</span>
                    {q.is_ai_generated && (
                      <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-black shrink-0">✨ AI</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground">{q.sub_type}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg capitalize ${
                      difficulty === "easy" ? "bg-primary/10 text-primary" :
                      difficulty === "medium" ? "bg-accent/15 text-accent-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {difficulty}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {score != null && (
                    <span className={`text-sm font-black ${score >= 70 ? "text-primary" : score >= 50 ? "text-accent-foreground" : "text-destructive"}`}>
                      {score}/90
                    </span>
                  )}
                  {/* Bookmark button */}
                  <button
                    onClick={(e) => toggleBookmark(q.id, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      bookmarks.has(q.id) ? "text-amber-500" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {bookmarks.has(q.id)
                      ? <BookmarkCheck className="h-4 w-4" />
                      : <Bookmark className="h-4 w-4" />}
                  </button>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-semibold">
          <p>{questions.length === 0 ? "No questions yet. Click 'Generate Question' to create your first one! ✨" : "No questions found matching your criteria. 🔍"}</p>
        </div>
      )}
    </div>
  );
};

export default PracticeListPage;
