import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, BookOpen, Mic, PenLine, BookOpenCheck, Headphones, Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const materials = [
  { title: "PTE Speaking Templates", desc: "Complete templates for Read Aloud, Describe Image, and Re-tell Lecture", category: "Speaking", icon: Mic, pages: 24, size: "2.4 MB", emoji: "🎤" },
  { title: "Essay Writing Guide", desc: "25 essay templates with model answers and scoring criteria", category: "Writing", icon: PenLine, pages: 36, size: "3.1 MB", emoji: "✍️" },
  { title: "Reading Strategies Handbook", desc: "Techniques for Fill in Blanks, Re-order Paragraphs, and MCQ", category: "Reading", icon: BookOpenCheck, pages: 18, size: "1.8 MB", emoji: "📖" },
  { title: "Listening Practice Guide", desc: "Tips for Write From Dictation, SST, and Highlight Incorrect Words", category: "Listening", icon: Headphones, pages: 22, size: "2.0 MB", emoji: "🎧" },
  { title: "PTE Vocabulary List", desc: "1000+ most frequently tested words with definitions and examples", category: "General", icon: BookOpen, pages: 45, size: "4.2 MB", emoji: "📚" },
  { title: "Score Prediction Guide", desc: "Understanding PTE scoring and predicting your target score", category: "General", icon: FileText, pages: 12, size: "1.2 MB", emoji: "🏆" },
];

const categoryIcons: Record<string, typeof Mic> = { Speaking: Mic, Writing: PenLine, Reading: BookOpenCheck, Listening: Headphones, General: BookOpen };
const categoryEmojis: Record<string, string> = { Speaking: "🎤", Writing: "✍️", Reading: "📖", Listening: "🎧", General: "📚" };

const StudyMaterialsPage = () => {
  const [materialList, setMaterialList] = useState(materials);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: "", desc: "", category: "General" });

  const handleAddMaterial = () => {
    if (!newMaterial.title.trim() || !newMaterial.desc.trim()) return;
    const icon = categoryIcons[newMaterial.category] || FileText;
    const emoji = categoryEmojis[newMaterial.category] || "📄";
    setMaterialList(prev => [...prev, { ...newMaterial, icon, emoji, pages: 0, size: "—" }]);
    setNewMaterial({ title: "", desc: "", category: "General" });
    setShowAddForm(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Study Materials 📄</h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Free PDF resources created by PTE experts</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 rounded-xl font-bold btn-3d w-full sm:w-auto">
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Material"}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border-2 bg-card p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-black text-foreground">Add New Material ✨</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Title *" value={newMaterial.title} onChange={e => setNewMaterial(p => ({ ...p, title: e.target.value }))} className="rounded-xl border-2 font-semibold" />
              <Select value={newMaterial.category} onValueChange={v => setNewMaterial(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Speaking", "Writing", "Reading", "Listening", "General"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Description *" value={newMaterial.desc} onChange={e => setNewMaterial(p => ({ ...p, desc: e.target.value }))} className="rounded-xl border-2 font-semibold" />
            <Button onClick={handleAddMaterial} disabled={!newMaterial.title.trim() || !newMaterial.desc.trim()} className="rounded-xl font-bold btn-3d gap-2">
              <Upload className="h-4 w-4" /> Add Material
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        {materialList.map((mat, i) => (
          <motion.div
            key={mat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border-2 bg-card p-6 hover:shadow-md transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
                {mat.emoji}
              </div>
              <div>
                <h3 className="font-black text-foreground">{mat.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground mt-1">{mat.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs font-bold text-muted-foreground">
                <span>{mat.pages} pages</span>
                <span>{mat.size}</span>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-2 font-bold">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
