import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Globe, BellOff, Check, User, Target, MapPin,
  Save, Loader2, Award, BookOpen
} from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const targetScores = [50, 65, 79, 90];
const studyGoals = [
  { value: "immigration", label: "🇦🇺 Australian / Canadian Immigration" },
  { value: "university", label: "🎓 University Admission" },
  { value: "work_visa", label: "💼 Work Visa" },
  { value: "general", label: "📚 General English Improvement" },
];
const countries = [
  "India", "China", "Nepal", "Pakistan", "Sri Lanka", "Bangladesh",
  "Philippines", "Nigeria", "Brazil", "Colombia", "Other"
];

const SettingsPage = () => {
  const { language, setLanguage, t, languageNames, availableLanguages } = useLanguage();
  const { permission, reminderEnabled, toggleReminder, isSupported } = useNotifications();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(() => localStorage.getItem("aurapte_name") || "");
  const [targetScore, setTargetScore] = useState<number>(() => Number(localStorage.getItem("aurapte_target") || "79"));
  const [studyGoal, setStudyGoal] = useState(() => localStorage.getItem("aurapte_goal") || "university");
  const [country, setCountry] = useState(() => localStorage.getItem("aurapte_country") || "");
  const [saving, setSaving] = useState(false);

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || "?";

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem("aurapte_name", fullName);
    localStorage.setItem("aurapte_target", String(targetScore));
    localStorage.setItem("aurapte_goal", studyGoal);
    localStorage.setItem("aurapte_country", country);
    setSaving(false);
    toast.success("Profile saved! 🎉");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-black text-foreground">{t("settings")}</h1>
        <p className="text-sm text-muted-foreground font-semibold mt-1">Manage your profile and preferences</p>
      </motion.div>

      {/* ── Profile Section ── */}
      <motion.div variants={item} className="rounded-2xl border-2 bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Your Profile</h2>
            <p className="text-xs text-muted-foreground">Your name appears on the leaderboard and forum</p>
          </div>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-xl font-black text-primary-foreground btn-3d">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Account</p>
            <p className="text-sm font-bold text-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Full Name</label>
          <Input
            placeholder="Enter your full name..."
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border-2 font-semibold"
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Country / Region
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-2 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  country === c
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {country === c && <Check className="h-3 w-3 inline mr-1" />}
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Target className="h-3 w-3" /> Target PTE Score
          </label>
          <div className="grid grid-cols-4 gap-2">
            {targetScores.map((score) => (
              <button
                key={score}
                onClick={() => setTargetScore(score)}
                className={`py-3 rounded-xl border-2 font-black text-sm transition-all ${
                  targetScore === score
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {score}
                {score === 79 && <span className="block text-[8px] font-bold opacity-70">Most Uni</span>}
                {score === 65 && <span className="block text-[8px] font-bold opacity-70">Visa</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Study Goal */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Study Goal
          </label>
          <div className="space-y-2">
            {studyGoals.map((g) => (
              <button
                key={g.value}
                onClick={() => setStudyGoal(g.value)}
                className={`flex items-center w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                  studyGoal === g.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {studyGoal === g.value && <Check className="h-4 w-4 text-primary mr-2 shrink-0" />}
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2 rounded-xl font-bold btn-3d">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </motion.div>

      {/* ── Score Band Info ── */}
      <motion.div variants={item} className="rounded-2xl border-2 bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">PTE Score Bands</h2>
            <p className="text-xs text-muted-foreground">What your target score means</p>
          </div>
        </div>
        {[
          { score: "90", label: "Perfect — Native level fluency", color: "bg-primary/15 text-primary border-primary/30" },
          { score: "79+", label: "Most universities & skilled migration", color: "bg-blue-500/15 text-blue-400 border-blue-400/30" },
          { score: "65+", label: "Australian student / spousal visa", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
          { score: "50+", label: "Basic immigration requirements", color: "bg-muted text-muted-foreground border-border" },
        ].map((band) => (
          <div key={band.score} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${band.color}`}>
            <span className="font-black text-sm w-8 shrink-0">{band.score}</span>
            <span className="text-sm font-semibold">{band.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Language ── */}
      <motion.div variants={item} className="rounded-2xl border-2 bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{t("language")}</h2>
            <p className="text-xs text-muted-foreground">Choose your preferred UI language</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                language === lang
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 text-foreground"
              }`}
            >
              {languageNames[lang]}
              {language === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div variants={item} className="rounded-2xl border-2 bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{t("notifications")}</h2>
            <p className="text-xs text-muted-foreground">
              {isSupported ? "Get daily study reminders at 9 AM and 7 PM" : "Notifications not supported in this browser"}
            </p>
          </div>
        </div>
        {isSupported && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {reminderEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-semibold text-foreground">{t("studyReminder")}</span>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={toggleReminder} />
          </div>
        )}
        {permission === "denied" && (
          <p className="text-xs text-destructive font-semibold">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
