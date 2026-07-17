import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, CheckCircle2, Star, Search, Eye, EyeOff, Plus, X, Clock, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface VocabWord {
  id: number; word: string; phonetic: string; meaning: string; example: string; mastered: boolean; starred: boolean;
  // Spaced repetition fields
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}

const createWord = (id: number, word: string, phonetic: string, meaning: string, example: string, mastered: boolean, starred: boolean): VocabWord => ({
  id, word, phonetic, meaning, example, mastered, starred,
  nextReview: new Date(),
  interval: mastered ? 7 : 1,
  easeFactor: 2.5,
  repetitions: mastered ? 3 : 0,
});

const sampleVocab: VocabWord[] = [
  createWord(1, "ubiquitous", "/juːˈbɪk.wɪ.təs/", "Present, appearing, or found everywhere", "Smartphones have become ubiquitous in modern society.", true, false),
  createWord(2, "paradigm", "/ˈpær.ə.daɪm/", "A typical example or pattern of something; a model", "The discovery led to a paradigm shift in scientific thinking.", true, true),
  createWord(3, "unprecedented", "/ʌnˈpres.ɪ.den.tɪd/", "Never done or known before", "The pandemic caused an unprecedented disruption to global trade.", false, false),
  createWord(4, "mitigate", "/ˈmɪt.ɪ.ɡeɪt/", "Make less severe, serious, or painful", "Measures were taken to mitigate the effects of climate change.", false, true),
  createWord(5, "proliferation", "/prəˌlɪf.əˈreɪ.ʃən/", "Rapid increase in numbers", "The proliferation of social media has changed communication.", false, false),
  createWord(6, "juxtapose", "/ˈdʒʌk.stə.pəʊz/", "Place close together for contrasting effect", "The author juxtaposes rural and urban lifestyles.", true, false),
  createWord(7, "substantiate", "/səbˈstæn.ʃi.eɪt/", "Provide evidence to support or prove the truth of", "The claims were not substantiated by the data.", false, false),
  createWord(8, "ameliorate", "/əˈmiː.li.ə.reɪt/", "Make something bad or unsatisfactory better", "Steps were taken to ameliorate living conditions.", false, true),
];

// SM-2 algorithm
const sm2 = (word: VocabWord, quality: number): VocabWord => {
  // quality: 0-5 (0=complete blackout, 5=perfect)
  let { interval, easeFactor, repetitions } = word;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...word,
    interval,
    easeFactor,
    repetitions,
    nextReview,
    mastered: repetitions >= 3,
  };
};

const VocabPage = () => {
  const [words, setWords] = useState(sampleVocab);
  const [search, setSearch] = useState("");
  const [showMeaning, setShowMeaning] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<"all" | "mastered" | "learning" | "starred" | "review">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", phonetic: "", meaning: "", example: "" });
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const dueForReview = useMemo(() => {
    const now = new Date();
    return words.filter(w => !w.mastered && w.nextReview <= now);
  }, [words]);

  const filtered = words.filter((w) => {
    const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" 
      || (filter === "mastered" && w.mastered) 
      || (filter === "learning" && !w.mastered) 
      || (filter === "starred" && w.starred)
      || (filter === "review" && dueForReview.includes(w));
    return matchesSearch && matchesFilter;
  });

  const mastered = words.filter((w) => w.mastered).length;
  const toggleMeaning = (id: number) => setShowMeaning((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleStar = (id: number) => setWords((prev) => prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w)));

  const handleReview = (quality: number) => {
    const currentWord = dueForReview[reviewIndex];
    if (!currentWord) return;
    setWords(prev => prev.map(w => w.id === currentWord.id ? sm2(w, quality) : w));
    setShowAnswer(false);
    if (reviewIndex < dueForReview.length - 1) {
      setReviewIndex(reviewIndex + 1);
    } else {
      setReviewMode(false);
      setReviewIndex(0);
    }
  };

  const handleAddWord = () => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    const id = Math.max(...words.map(w => w.id), 0) + 1;
    setWords(prev => [createWord(id, newWord.word, newWord.phonetic, newWord.meaning, newWord.example, false, false), ...prev]);
    setNewWord({ word: "", phonetic: "", meaning: "", example: "" });
    setShowAddForm(false);
  };

  // === Review Mode ===
  if (reviewMode && dueForReview.length > 0) {
    const currentWord = dueForReview[reviewIndex];
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-black text-foreground">Spaced Review</h1>
          </div>
          <Button variant="outline" onClick={() => setReviewMode(false)} className="rounded-xl font-bold">
            Exit Review
          </Button>
        </div>
        
        <Progress value={((reviewIndex + 1) / dueForReview.length) * 100} className="h-2.5" />
        <p className="text-xs text-muted-foreground text-center font-semibold">
          {reviewIndex + 1} / {dueForReview.length} words
        </p>

        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 bg-card p-8 text-center space-y-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-3xl font-black text-foreground">{currentWord.word}</h2>
          <p className="text-sm text-muted-foreground">{currentWord.phonetic}</p>

          {!showAnswer ? (
            <Button onClick={() => setShowAnswer(true)} className="rounded-xl font-bold btn-3d gap-2" size="lg">
              <Eye className="h-4 w-4" /> Show Answer
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-base font-semibold text-foreground">{currentWord.meaning}</p>
                <p className="text-sm text-muted-foreground italic mt-2">"{currentWord.example}"</p>
              </div>
              <p className="text-xs text-muted-foreground font-bold">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => handleReview(1)} variant="outline" className="rounded-xl text-xs border-destructive text-destructive hover:bg-destructive/10">
                  Again
                </Button>
                <Button onClick={() => handleReview(3)} variant="outline" className="rounded-xl text-xs border-accent text-accent hover:bg-accent/10">
                  Hard
                </Button>
                <Button onClick={() => handleReview(4)} variant="outline" className="rounded-xl text-xs border-primary text-primary hover:bg-primary/10">
                  Good
                </Button>
                <Button onClick={() => handleReview(5)} variant="default" className="rounded-xl text-xs">
                  Easy
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/12 flex items-center justify-center text-xl sm:text-2xl">📚</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Vocabulary Book</h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{mastered}/{words.length} mastered · 90% PTE vocab 🎯</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {dueForReview.length > 0 && (
            <Button onClick={() => { setReviewMode(true); setReviewIndex(0); setShowAnswer(false); }} variant="default" className="gap-2 rounded-xl font-bold btn-3d flex-1 sm:flex-none">
              <Zap className="h-4 w-4" />
              Review ({dueForReview.length})
            </Button>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" className="gap-2 rounded-xl font-bold border-2 flex-1 sm:flex-none">
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? "Cancel" : "Add Word"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border-2 bg-card p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-black text-foreground">Add New Word ✨</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Word *" value={newWord.word} onChange={e => setNewWord(p => ({ ...p, word: e.target.value }))} className="rounded-xl border-2 font-semibold" />
              <Input placeholder="Phonetic (optional)" value={newWord.phonetic} onChange={e => setNewWord(p => ({ ...p, phonetic: e.target.value }))} className="rounded-xl border-2 font-semibold" />
              <Input placeholder="Meaning *" value={newWord.meaning} onChange={e => setNewWord(p => ({ ...p, meaning: e.target.value }))} className="rounded-xl border-2 font-semibold" />
              <Input placeholder="Example sentence" value={newWord.example} onChange={e => setNewWord(p => ({ ...p, example: e.target.value }))} className="rounded-xl border-2 font-semibold" />
            </div>
            <Button onClick={handleAddWord} disabled={!newWord.word.trim() || !newWord.meaning.trim()} className="rounded-xl font-bold btn-3d gap-2">
              <Plus className="h-4 w-4" /> Add Word
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Progress value={(mastered / words.length) * 100} className="h-2.5" />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-lg font-black text-primary">{dueForReview.length}</div>
          <div className="text-xs text-muted-foreground font-semibold">Due Today</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-lg font-black text-foreground">{words.filter(w => !w.mastered).length}</div>
          <div className="text-xs text-muted-foreground font-semibold">Learning</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-lg font-black text-primary">{mastered}</div>
          <div className="text-xs text-muted-foreground font-semibold">Mastered</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search words..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-2 font-semibold" />
        </div>
        {(["all", "review", "learning", "mastered", "starred"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className={`capitalize text-xs rounded-xl font-bold ${filter !== f ? "border-2" : ""}`}>
            {f === "starred" ? "⭐ Starred" : f === "mastered" ? "✅ Mastered" : f === "learning" ? "📖 Learning" : f === "review" ? `🔄 Review (${dueForReview.length})` : "All"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((word, i) => (
          <motion.div
            key={word.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border-2 bg-card p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-black text-foreground">{word.word}</h3>
                  <span className="text-xs font-semibold text-muted-foreground">{word.phonetic}</span>
                  {word.nextReview <= new Date() && !word.mastered && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Due
                    </span>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl">
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="mt-2">
                  <button onClick={() => toggleMeaning(word.id)} className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    {showMeaning[word.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showMeaning[word.id] ? "Hide" : "Show"} meaning
                  </button>
                  {showMeaning[word.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{word.meaning}</p>
                      <p className="text-xs text-muted-foreground italic">"{word.example}"</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Next review: {word.nextReview.toLocaleDateString()} · Interval: {word.interval}d
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={() => toggleStar(word.id)}>
                  <Star className={`h-4 w-4 ${word.starred ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={() => {
                  setWords(prev => prev.map(w => w.id === word.id ? { ...w, mastered: !w.mastered } : w));
                }}>
                  <CheckCircle2 className={`h-4 w-4 ${word.mastered ? "text-primary" : "text-muted-foreground"}`} />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VocabPage;
