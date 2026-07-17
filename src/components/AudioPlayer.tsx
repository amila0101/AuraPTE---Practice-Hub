import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Play, Pause, RotateCcw, Volume2, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerProps {
  text: string;
  label?: string;
  autoPlay?: boolean;
  rate?: number;
  maxPlays?: number; // undefined = unlimited, 1 = once only (real PTE listening)
}

const AudioPlayer = ({
  text,
  label = "Listen to Audio",
  autoPlay = false,
  rate = 0.9,
  maxPlays,
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  const playsLeft = maxPlays !== undefined ? maxPlays - playCount : null;
  const isExhausted = playsLeft !== null && playsLeft <= 0;

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const trackProgress = useCallback(() => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.duration) {
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(pct);
      }
    }, 100);
  }, [stopTracking]);

  const fetchAndPlay = useCallback(async () => {
    if (isExhausted) return;

    // Reuse cached blob
    if (audioBlobUrlRef.current) {
      const audio = audioRef.current || new Audio(audioBlobUrlRef.current);
      audioRef.current = audio;
      audio.currentTime = 0;
      audio.playbackRate = rate;
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
        setIsDone(true);
        stopTracking();
      };
      audio.onerror = () => { setIsPlaying(false); stopTracking(); };
      setIsPlaying(true);
      setPlayCount((c) => c + 1);
      trackProgress();
      await audio.play();
      return;
    }

    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.warn("ElevenLabs TTS failed, falling back to browser TTS");
        fallbackBrowserTTS();
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = rate;
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
        setIsDone(true);
        stopTracking();
      };
      audio.onerror = () => { setIsPlaying(false); stopTracking(); };

      setIsPlaying(true);
      setPlayCount((c) => c + 1);
      trackProgress();
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      fallbackBrowserTTS();
    } finally {
      setIsLoading(false);
    }
  }, [text, rate, stopTracking, trackProgress, isExhausted]);

  const fallbackBrowserTTS = useCallback(() => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en-") && !v.localService) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    const wordCount = text.split(/\s+/).length;
    const dur = wordCount / 2.5 / rate;
    const start = Date.now();

    utterance.onstart = () => {
      setIsPlaying(true);
      setPlayCount((c) => c + 1);
      setIsLoading(false);
      intervalRef.current = setInterval(() => {
        const pct = Math.min(((Date.now() - start) / 1000 / dur) * 100, 100);
        setProgress(pct);
      }, 100);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      setIsDone(true);
      stopTracking();
    };
    utterance.onerror = () => { setIsPlaying(false); setIsLoading(false); stopTracking(); };
    window.speechSynthesis.speak(utterance);
  }, [text, rate, stopTracking]);

  const stop = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    stopTracking();
  }, [stopTracking]);

  const replay = useCallback(() => {
    if (isExhausted) return;
    setProgress(0);
    setIsDone(false);
    fetchAndPlay();
  }, [fetchAndPlay, isExhausted]);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      window.speechSynthesis.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
      stopTracking();
    };
  }, [stopTracking]);

  useEffect(() => {
    if (autoPlay && playCount === 0) {
      const timer = setTimeout(fetchAndPlay, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, playCount, fetchAndPlay]);

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">{label}</span>
        </div>
        {/* Play counter badge */}
        {maxPlays !== undefined && (
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full ${
              isExhausted
                ? "bg-destructive/15 text-destructive"
                : playsLeft === 1
                ? "bg-accent/20 text-accent-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isExhausted ? "⚠️ No replays" : `🎧 ${playsLeft} play${playsLeft !== 1 ? "s" : ""} left`}
          </span>
        )}
      </div>

      {/* Progress bar with waveform */}
      <div className="relative h-8 rounded-lg bg-muted/60 overflow-hidden">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-primary/20 rounded-lg transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
        {/* Waveform bars (animated while playing) */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-3">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary/60"
              animate={
                isPlaying
                  ? { height: [4, Math.random() * 20 + 6, 4] }
                  : { height: isDone ? 4 : 4 }
              }
              transition={
                isPlaying
                  ? { duration: 0.6, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
              style={{ height: 4 }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {isLoading ? (
          <Button size="sm" variant="default" disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        ) : isPlaying ? (
          <Button size="sm" variant="outline" onClick={stop} className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : isExhausted ? (
          <Button size="sm" variant="outline" disabled className="gap-2 text-destructive border-destructive/30">
            <AlertTriangle className="h-4 w-4" />
            No Replays Allowed
          </Button>
        ) : (
          <Button size="sm" variant="default" onClick={playCount > 0 ? replay : fetchAndPlay} className="gap-2">
            {playCount > 0 ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playCount > 0 ? "Replay" : "Play Audio"}
          </Button>
        )}

        <span className="text-xs text-muted-foreground">
          {isLoading
            ? "Generating audio..."
            : isPlaying
            ? "Playing..."
            : isExhausted
            ? "In the real exam, you cannot replay this audio."
            : isDone
            ? maxPlays !== undefined
              ? `Played ${playCount}/${maxPlays} time${maxPlays > 1 ? "s" : ""}`
              : "Audio finished"
            : "Click to listen"}
        </span>
      </div>

      {/* Real exam warning */}
      <AnimatePresence>
        {isExhausted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-destructive">
              Real PTE exam: Audio plays only {maxPlays} time{maxPlays !== 1 ? "s" : ""}. Practise answering without replaying!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioPlayer;
