import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, Pause, RotateCcw, CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const shadowingSentences = [
  { id: 1, text: "Climate change is one of the most pressing issues of our time.", difficulty: "Easy", completed: true },
  { id: 2, text: "The development of artificial intelligence has revolutionized many industries from healthcare to finance.", difficulty: "Medium", completed: true },
  { id: 3, text: "Urbanization has accelerated dramatically over the past century with more than half of the world's population now living in cities.", difficulty: "Hard", completed: false },
  { id: 4, text: "Scientists around the world are working to understand the impact of greenhouse gas emissions on ecosystems.", difficulty: "Medium", completed: false },
  { id: 5, text: "The evidence suggests that immediate action is needed to reduce carbon emissions and transition to renewable energy.", difficulty: "Hard", completed: false },
  { id: 6, text: "Education plays a crucial role in shaping the future of society.", difficulty: "Easy", completed: true },
  { id: 7, text: "Machine learning algorithms can now diagnose diseases with remarkable accuracy.", difficulty: "Medium", completed: false },
  { id: 8, text: "The rapid growth of technology presents both opportunities and challenges for developing nations.", difficulty: "Hard", completed: false },
];

const ShadowingPage = () => {
  const [sentences, setSentences] = useState(shadowingSentences);
  const [activeSentence, setActiveSentence] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSentence, setNewSentence] = useState({ text: "", difficulty: "Medium" });

  const completedCount = sentences.filter((s) => s.completed).length;
  const sentence = sentences[activeSentence];

  const handleAddSentence = () => {
    if (!newSentence.text.trim()) return;
    const id = Math.max(...sentences.map(s => s.id), 0) + 1;
    setSentences(prev => [...prev, { id, text: newSentence.text, difficulty: newSentence.difficulty, completed: false }]);
    setNewSentence({ text: "", difficulty: "Medium" });
    setShowAddForm(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/12 flex items-center justify-center text-xl sm:text-2xl">🗣️</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Shadowing Practice</h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Improve Read Aloud in 14 days · {completedCount}/{sentences.length} done 🔥</p>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 rounded-xl font-bold btn-3d w-full sm:w-auto">
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Sentence"}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border-2 bg-card p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-black text-foreground">Add New Sentence ✨</h3>
            <Input placeholder="Type a sentence to practice..." value={newSentence.text} onChange={e => setNewSentence(p => ({ ...p, text: e.target.value }))} className="rounded-xl border-2 font-semibold" />
            <div className="flex items-center gap-3">
              <Select value={newSentence.difficulty} onValueChange={v => setNewSentence(p => ({ ...p, difficulty: v }))}>
                <SelectTrigger className="w-[140px] rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddSentence} disabled={!newSentence.text.trim()} className="rounded-xl font-bold btn-3d gap-2">
                <Plus className="h-4 w-4" /> Add Sentence
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Progress value={(completedCount / sentences.length) * 100} className="h-2.5" />

      {/* Active Practice */}
      <div className="rounded-2xl border-2 bg-card p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-foreground">Sentence {activeSentence + 1} of {sentences.length}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
            sentence.difficulty === "Easy" ? "bg-primary/10 text-primary" :
            sentence.difficulty === "Medium" ? "bg-accent/15 text-accent-foreground" :
            "bg-destructive/10 text-destructive"
          }`}>
            {sentence.difficulty}
          </span>
        </div>

        <div className="rounded-2xl bg-muted p-4 sm:p-6 border-2">
          <p className="text-base sm:text-lg leading-relaxed font-bold text-foreground text-center">{sentence.text}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button variant="outline" size="lg" className="gap-2 rounded-2xl border-2 font-bold" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {isPlaying ? "Pause" : "Listen"}
          </Button>
          <Button
            size="lg"
            className={`gap-2 rounded-2xl font-black ${!isRecording ? "btn-3d" : ""}`}
            variant={isRecording ? "destructive" : "default"}
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic className="h-5 w-5" />
            {isRecording ? "Stop" : "Record"}
          </Button>
          <Button variant="outline" size="lg" className="gap-2 rounded-2xl border-2 font-bold">
            <RotateCcw className="h-5 w-5" />
            Retry
          </Button>
        </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-1 h-12">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 rounded-full bg-primary"
                animate={{ height: [8, Math.random() * 32 + 8, 8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sentence List */}
      <div className="space-y-2">
        <h3 className="font-black text-foreground">All Sentences 📝</h3>
        {sentences.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 cursor-pointer transition-all ${
              i === activeSentence ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
            }`}
            onClick={() => setActiveSentence(i)}
          >
            <div className="shrink-0">
              {s.completed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
            </div>
            <p className="text-sm font-bold text-foreground flex-1 truncate">{s.text}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              s.difficulty === "Easy" ? "bg-primary/10 text-primary" :
              s.difficulty === "Medium" ? "bg-accent/15 text-accent-foreground" :
              "bg-destructive/10 text-destructive"
            }`}>
              {s.difficulty}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShadowingPage;
