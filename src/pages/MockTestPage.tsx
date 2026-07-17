import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Play, CheckCircle2, Mic, PenLine, BookOpenCheck, Headphones, AlertCircle, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const sectionMeta = [
  { key: "speaking", icon: Mic, label: "S", emoji: "🎤" },
  { key: "writing", icon: PenLine, label: "W", emoji: "✍️" },
  { key: "reading", icon: BookOpenCheck, label: "R", emoji: "📖" },
  { key: "listening", icon: Headphones, label: "L", emoji: "🎧" },
];

const useMockTests = () => {
  return useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

const useCreateMockTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examType: string) => {
      // Fetch available questions grouped by skill
      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id, skill")
        .eq("exam_type", examType === "pte_core" ? "pte_core" : "pte_academic");
      if (qErr) throw qErr;

      if (!questions || questions.length === 0) {
        throw new Error("No questions available. Generate some questions first!");
      }

      // Pick questions for mock test (up to limits per skill)
      const limits: Record<string, number> = { speaking: 16, writing: 3, reading: 15, listening: 12 };
      const selectedIds: string[] = [];
      const sections: Record<string, number> = { speaking: 0, writing: 0, reading: 0, listening: 0 };

      for (const skill of Object.keys(limits)) {
        const skillQs = questions.filter((q) => q.skill === skill);
        const shuffled = skillQs.sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, limits[skill]);
        picked.forEach((q) => selectedIds.push(q.id));
        sections[skill] = picked.length;
      }

      if (selectedIds.length === 0) {
        throw new Error("No questions found for any skill category.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Please log in first");

      const { data, error } = await supabase.from("mock_tests").insert({
        user_id: session.user.id,
        exam_type: examType,
        question_ids: selectedIds,
        status: "in_progress",
      }).select().single();

      if (error) throw error;
      return { ...data, sections, totalQuestions: selectedIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mock-tests"] });
      toast.success("Mock test created! Starting...");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

const examTypes = [
  {
    key: "pte_academic",
    label: "PTE Academic",
    emoji: "🎓",
    desc: "Full format exam · S+W+R+L",
    sections: [
      { label: "Speaking", count: 16, icon: "🎤" },
      { label: "Writing",  count: 3,  icon: "✍️" },
      { label: "Reading",  count: 15, icon: "📖" },
      { label: "Listening",count: 12, icon: "🎧" },
    ],
    duration: "~3 hrs",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary",
  },
  {
    key: "pte_core",
    label: "PTE Core",
    emoji: "🏫",
    desc: "Canadian immigration format · S+W+R+L",
    sections: [
      { label: "Speaking", count: 10, icon: "🎤" },
      { label: "Writing",  count: 4,  icon: "✍️" },
      { label: "Reading",  count: 13, icon: "📖" },
      { label: "Listening",count: 10, icon: "🎧" },
    ],
    duration: "~2 hrs",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400",
  },
] as const;

const MockTestPage = () => {
  const navigate = useNavigate();
  const { data: mockTests = [], isLoading } = useMockTests();
  const createMockTest = useCreateMockTest();
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [examType, setExamType] = useState<"pte_academic" | "pte_core">("pte_academic");

  const handleStart = (testId: string) => {
    setStartingTest(testId);
    setTimeout(() => navigate(`/practice?mock=${testId}`), 1000);
  };

  const handleCreateNew = () => {
    createMockTest.mutate(examType, {
      onSuccess: (data) => {
        setTimeout(() => navigate(`/practice?mock=${data.id}`), 1000);
      },
    });
  };

  const selectedExam = examTypes.find(e => e.key === examType)!;

  const getTestSections = (test: any) => {
    const questionIds = (test.question_ids || []) as string[];
    // We don't have skill info in mock_tests, so show total
    return { total: questionIds.length };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Mock Tests 📋</h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Simulate the real PTE exam experience</p>
        </div>
      </div>

      {/* Exam Type Selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        {examTypes.map((et) => (
          <motion.button
            key={et.key}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setExamType(et.key as "pte_academic" | "pte_core")}
            className={`rounded-2xl border-2 bg-card p-5 text-left transition-all ${
              examType === et.key
                ? `${et.border} shadow-md`
                : "border-border hover:border-primary/30"
            }`}
            style={{ boxShadow: examType === et.key ? "var(--shadow-card)" : undefined }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{et.emoji}</span>
                <div>
                  <h3 className={`font-black text-foreground text-sm`}>{et.label}</h3>
                  <p className="text-xs text-muted-foreground">{et.desc}</p>
                </div>
              </div>
              {examType === et.key && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${et.bg} ${et.color}`}>Selected</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {et.sections.map((s) => (
                <span key={s.label} className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                  {s.icon} {s.label} <span className={`font-black ml-0.5 ${et.color}`}>{s.count}</span>
                </span>
              ))}
              <span className="text-xs font-bold text-muted-foreground ml-auto">{et.duration}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Start Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateNew}
          disabled={createMockTest.isPending}
          className="gap-2 rounded-xl font-bold btn-3d w-full sm:w-auto"
        >
          {createMockTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Start {selectedExam.label} Mock Test
        </Button>
      </div>


      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 flex gap-3">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-black text-foreground text-sm">Before you begin 📝</h3>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Ensure you have a quiet environment, a working microphone, and enough uninterrupted time.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && mockTests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-semibold">
          <p>No mock tests yet. Click "New Mock Test" to create one! 🚀</p>
          <p className="text-xs mt-2">Make sure you have generated questions first.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {mockTests.map((test: any, i: number) => {
          const questionIds = (test.question_ids || []) as string[];
          const isCompleted = test.status === "completed";

          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border-2 bg-card p-6 hover:shadow-md transition-all"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-foreground">
                  Mock Test #{i + 1}
                </h3>
                {isCompleted && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </span>
                )}
                {test.status === "in_progress" && (
                  <span className="text-xs bg-accent/15 text-accent-foreground px-2.5 py-1 rounded-xl font-bold">
                    In Progress
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {test.exam_type === "pte_core" ? "PTE Core" : "PTE Academic"}</span>
                <span>{questionIds.length} questions</span>
              </div>

              <div className="text-xs font-semibold text-muted-foreground mb-4">
                Started: {format(parseISO(test.started_at), "MMM d, yyyy")}
                {test.completed_at && ` • Completed: ${format(parseISO(test.completed_at), "MMM d, yyyy")}`}
              </div>

              {isCompleted && test.overall_score != null && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-muted-foreground">Score</span>
                    <span className="font-black text-foreground">{test.overall_score}/90</span>
                  </div>
                  <Progress value={(test.overall_score / 90) * 100} className="h-2" />
                </div>
              )}

              <Button
                className={`w-full gap-2 rounded-xl font-black ${!isCompleted ? "btn-3d" : ""}`}
                variant={isCompleted ? "outline" : "default"}
                disabled={startingTest === test.id}
                onClick={() => handleStart(test.id)}
              >
                {startingTest === test.id ? "Starting..." : isCompleted ? <><RotateCcw className="h-4 w-4" /> Review</> : <><Play className="h-4 w-4" /> Continue</>}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MockTestPage;
