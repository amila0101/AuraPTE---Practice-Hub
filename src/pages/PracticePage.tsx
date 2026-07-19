import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import AudioRecorder from "@/components/AudioRecorder";
import { getQuestionTimeLimit } from "@/lib/pteTimings";
import { useQuestions, useGenerateQuestion, useScoreAnswer, type Question } from "@/hooks/useQuestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PracticePage = () => {
  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("type") || undefined;
  const questionId = searchParams.get("id") || undefined;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scoreResult, setScoreResult] = useState<Record<string, unknown> | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [isScoringAudio, setIsScoringAudio] = useState(false);
  const audioRecorderKeyRef = useRef(0); // force remount on question change

  const { data: questions = [], isLoading } = useQuestions(skillFilter);
  const generateQuestion = useGenerateQuestion();
  const scoreAnswer = useScoreAnswer();

  const question = questions[currentIndex];
  const total = questions.length;
  
  const isSpeakingQuestion = question?.skill === "speaking";

  // Jump to specific question if id is provided
  useEffect(() => {
    if (questionId && questions.length > 0) {
      const idx = questions.findIndex((q) => q.id === questionId);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [questionId, questions]);

  useEffect(() => {
    setStartTime(Date.now());
    setAnswer("");
    setScoreResult(null);
    setIsScoringAudio(false);
    audioRecorderKeyRef.current += 1; // remount AudioRecorder fresh on each question
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      toast.info("You've completed all questions in this set!");
    }
  }, [currentIndex, total]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleGenerate = (skill?: string) => {
    generateQuestion.mutate({
      skill: skill || skillFilter || "speaking",
      difficulty: "medium",
      exam_type: "pte_academic",
    });
  };

  const handleSubmitAnswer = () => {
    if (!question || !answer.trim()) {
      toast.error("Please provide an answer first");
      return;
    }
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    scoreAnswer.mutate(
      { question_id: question.id, answer_text: answer, time_spent_seconds: timeSpent },
      {
        onSuccess: (data) => {
          setScoreResult(data);
          toast.success(`Score: ${data.overall_score}/90`);
        },
      }
    );
  };

  // ── Audio submit — sends blob to score-speaking edge function ──────────────
  const handleAudioSubmit = useCallback(async (blob: Blob) => {
    if (!question) return;
    setIsScoringAudio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      form.append("question_id", question.id);
      form.append("time_spent_seconds", String(Math.round((Date.now() - startTime) / 1000)));

      // Extract the base URL from our already-configured Supabase client
      const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "https://mqemlgygwvtrzbxfirnu.supabase.co";
      
      const res = await fetch(
        `${supabaseUrl}/functions/v1/score-speaking`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");

      setScoreResult(data);
      toast.success(`Speaking Score: ${data.overall_score}/90 · ${data.wpm} WPM`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Audio scoring failed");
    } finally {
      setIsScoringAudio(false);
    }
  }, [question, startTime]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
        <div className="text-center space-y-3">
          <Sparkles className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">No questions yet</h2>
          <p className="text-muted-foreground max-w-md">
            Generate your first AI-powered PTE question to start practicing!
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {["speaking", "writing", "reading", "listening"].map((skill) => (
            <Button
              key={skill}
              onClick={() => handleGenerate(skill)}
              disabled={generateQuestion.isPending}
              variant="outline"
              className="capitalize gap-2"
            >
              {generateQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate {skill}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Exam header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-card px-4 sm:px-6 py-3 gap-2 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
            Q {currentIndex + 1}/{total}
          </span>
          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
            {questions.slice(0, 20).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-4 sm:w-6 rounded-full transition-colors ${
                  i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/40" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(question?.skill)}
            disabled={generateQuestion.isPending}
            className="gap-1.5 text-xs"
          >
            {generateQuestion.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Generate</span>
          </Button>
          <Timer key={question?.id} initialMinutes={question ? getQuestionTimeLimit(question.skill, question.sub_type) : 2} onTimeUp={goNext} />
        </div>
      </header>

      {/* Question content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {question && (
          <QuestionCard
            question={{
              id: question.id,
              type: question.skill as "speaking" | "writing" | "reading" | "listening",
              subType: question.sub_type,
              title: question.title,
              content: question.content,
              instruction: question.instruction,
              options: question.options as string[] | null,
              correct_answer: question.correct_answer as Record<string, unknown> | null,
              image_url: question.image_url,
            }}
            direction={direction}
            onAnswerChange={setAnswer}
          />
        )}

        {/* Audio Recorder — shown for all speaking questions */}
        {isSpeakingQuestion && question && !scoreResult && (
          <motion.div
            key={audioRecorderKeyRef.current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black text-foreground">Your Speaking Response</h3>
            </div>
            <AudioRecorder
              key={audioRecorderKeyRef.current}
              prepSeconds={question.sub_type === "Read Aloud" ? 35
                         : question.sub_type === "Repeat Sentence" ? 0
                         : question.sub_type === "Describe Image" ? 25
                         : 0}
              maxSeconds={question.sub_type === "Read Aloud" ? 40
                        : question.sub_type === "Repeat Sentence" ? 15
                        : question.sub_type === "Describe Image" ? 40
                        : question.sub_type === "Re-tell Lecture" ? 40
                        : 10}
              onSubmit={handleAudioSubmit}
              disabled={isScoringAudio}
            />
            {isScoringAudio && (
              <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-semibold">Analysing with AssemblyAI…</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Score result */}
        <AnimatePresence>
          {scoreResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 space-y-4"
            >
              {/* Score Card */}
              <div className="rounded-2xl border-2 bg-card p-6 space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-foreground">🤖 AI Score Result</h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Based on PTE Academic scoring criteria</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-black ${
                      (scoreResult.overall_score as number) >= 79 ? "text-primary" :
                      (scoreResult.overall_score as number) >= 65 ? "text-amber-500" : "text-destructive"
                    }`}>
                      {scoreResult.overall_score as number}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground">out of 90</div>
                  </div>
                </div>

                {/* Overall progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Overall</span>
                    <span>{Math.round(((scoreResult.overall_score as number) / 90) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((scoreResult.overall_score as number) / 90) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        (scoreResult.overall_score as number) >= 79 ? "bg-primary" :
                        (scoreResult.overall_score as number) >= 65 ? "bg-amber-500" : "bg-destructive"
                      }`}
                    />
                  </div>
                </div>

                {/* Per-criterion breakdown */}
                {scoreResult.breakdown && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Score Breakdown by Criterion</h4>
                    {Object.entries(scoreResult.breakdown as Record<string, number>).map(([key, value]) => {
                      const pct = Math.round((value / 90) * 100);
                      const barColor = value >= 70 ? "bg-primary" : value >= 50 ? "bg-amber-500" : "bg-destructive";
                      const textColor = value >= 70 ? "text-primary" : value >= 50 ? "text-amber-500" : "text-destructive";
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                            <span className={`text-sm font-black ${textColor}`}>{value}<span className="text-xs text-muted-foreground font-semibold">/90</span></span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Feedback */}
                {scoreResult.feedback && (
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm font-semibold text-foreground leading-relaxed">{scoreResult.feedback as string}</p>
                  </div>
                )}

                {/* Suggestions */}
                {scoreResult.suggestions && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">💡 Improvement Tips</h4>
                    <ul className="space-y-1.5">
                      {(scoreResult.suggestions as string[]).map((s, i) => (
                        <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                          <span className="text-primary mt-0.5 shrink-0">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* Model Answer */}
              {scoreResult.model_answer && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <h3 className="text-base font-bold text-primary">Model Answer (90/90)</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {scoreResult.model_answer as string}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Compare your answer with this model to identify areas for improvement.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between border-t bg-card px-4 sm:px-6 py-3 gap-2 sm:gap-0">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="gap-2 w-full sm:w-auto order-2 sm:order-1">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto justify-center">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {question?.skill && question.skill.charAt(0).toUpperCase() + question.skill.slice(1)} · {question?.sub_type}
          </span>
          {/* Only show text Submit for non-speaking questions */}
          {!isSpeakingQuestion && (
            <Button
              onClick={handleSubmitAnswer}
              disabled={scoreAnswer.isPending || !answer.trim()}
              variant="default"
              className="gap-2 flex-1 sm:flex-none"
            >
              {scoreAnswer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit &amp; Score
            </Button>
          )}
        </div>
        <Button onClick={goNext} disabled={currentIndex === total - 1} className="gap-2 w-full sm:w-auto order-3">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
};

export default PracticePage;
