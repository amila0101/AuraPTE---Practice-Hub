import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, RotateCcw, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  /** PTE preparation time in seconds before recording starts (default: 0) */
  prepSeconds?: number;
  /** Max recording seconds — auto-stops when reached */
  maxSeconds?: number;
  /** Called with the audio Blob when user clicks "Submit Recording" */
  onSubmit: (blob: Blob) => void;
  /** Disable submit while parent is processing */
  disabled?: boolean;
  /** Automatically start the preparation countdown when mounted */
  autoStart?: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioRecorder({
  prepSeconds = 0,
  maxSeconds = 40,
  onSubmit,
  disabled = false,
  autoStart = false,
}: AudioRecorderProps) {
  const {
    isRecording, isPreparing, audioBlob, audioUrl,
    durationSec, preparationSec, permissionDenied,
    start, stop, reset,
  } = useAudioRecorder();

  // Auto-stop when maxSeconds reached
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    if (isRecording && durationSec >= maxSeconds) stopRef.current();
  }, [isRecording, durationSec, maxSeconds]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      start(prepSeconds);
    }
  }, [autoStart, prepSeconds, start]);

  const handleSubmit = () => { if (audioBlob) onSubmit(audioBlob); };

  const BAR_COUNT = 28;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);

  return (
    <div className="w-full space-y-4">

      <AnimatePresence>
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3"
          >
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-semibold">
              Microphone access denied. Please allow microphone access in your browser settings and reload.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">

        {/* Waveform area */}
        <div className="relative flex items-center justify-center h-28 bg-gradient-to-b from-card to-muted/30 px-6">

          {!isRecording && !isPreparing && !audioBlob && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mic className="h-5 w-5" />
              <span className="text-sm font-semibold">Ready to record</span>
            </div>
          )}

          <AnimatePresence>
            {isPreparing && (
              <motion.div key="prep"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="text-5xl font-black text-primary">{preparationSec}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prepare to speak</div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRecording && (
              <motion.div key="wave"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-[3px] h-16"
              >
                {bars.map((i) => (
                  <motion.div key={i} className="w-[3px] rounded-full bg-primary"
                    animate={{ height: [`${12 + Math.random() * 40}%`, `${20 + Math.random() * 60}%`, `${8 + Math.random() * 35}%`] }}
                    transition={{ duration: 0.4 + Math.random() * 0.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.04 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {audioBlob && !isRecording && (
            <div className="flex items-center gap-[3px] h-16 opacity-40">
              {bars.map((i) => (
                <div key={i} className="w-[3px] rounded-full bg-primary"
                  style={{ height: `${15 + ((i * 17 + i * i * 3) % 55)}%` }}
                />
              ))}
            </div>
          )}

          {isRecording && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <motion.div className="h-2 w-2 rounded-full bg-destructive"
                animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <span className="text-xs font-black text-foreground tabular-nums">{formatTime(durationSec)}</span>
              <span className="text-xs text-muted-foreground">/ {formatTime(maxSeconds)}</span>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="absolute bottom-2 left-4 right-4">
              <audio src={audioUrl} controls className="w-full h-7 opacity-80" />
            </div>
          )}
        </div>

        {/* Time progress bar */}
        {isRecording && (
          <div className="h-1 bg-muted">
            <motion.div className="h-full bg-destructive" style={{ width: `${(durationSec / maxSeconds) * 100}%` }} />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <Button size="sm" variant="ghost" onClick={reset}
            disabled={!audioBlob && !isRecording && !isPreparing}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>

          <div className="flex-1 flex justify-center">
            {!isRecording && !isPreparing && !audioBlob && (
              <Button onClick={() => start(prepSeconds)} disabled={disabled || permissionDenied}
                className="gap-2 px-8 rounded-xl font-bold"
              >
                <Mic className="h-4 w-4" /> Start Recording
              </Button>
            )}

            {(isRecording || isPreparing) && (
              <Button onClick={stop} variant="destructive" className="gap-2 px-8 rounded-xl font-bold">
                <Square className="h-4 w-4 fill-current" /> Stop
              </Button>
            )}

            {audioBlob && !isRecording && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 text-xs">
                  <MicOff className="h-3.5 w-3.5" /> Re-record
                </Button>
                <Button onClick={handleSubmit} disabled={disabled} className="gap-2 px-6 rounded-xl font-bold">
                  <Send className="h-4 w-4" /> Submit Recording
                </Button>
              </div>
            )}
          </div>

          <div className="w-16 text-right">
            {audioBlob && !isRecording && (
              <span className="text-xs font-bold text-muted-foreground tabular-nums">{formatTime(durationSec)}</span>
            )}
          </div>
        </div>
      </div>

      {!audioBlob && !isRecording && !isPreparing && (
        <p className="text-xs text-muted-foreground text-center">
          🎤 Microphone activates when you click Start Recording.
          {prepSeconds > 0 && ` ${prepSeconds}s preparation time before recording begins.`}
        </p>
      )}
    </div>
  );
}
