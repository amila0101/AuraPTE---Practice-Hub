import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PrepCountdownProps {
  prepSeconds: number;
  recordSeconds: number;
  onPrepEnd?: () => void;
  onRecordEnd?: () => void;
}

const PrepCountdown = ({ prepSeconds, recordSeconds, onPrepEnd, onRecordEnd }: PrepCountdownProps) => {
  const [phase, setPhase] = useState<"prep" | "recording" | "done">("prep");
  const [timeLeft, setTimeLeft] = useState(prepSeconds);

  const totalTime = phase === "prep" ? prepSeconds : recordSeconds;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (phase === "done") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (phase === "prep") {
            setPhase("recording");
            setTimeLeft(recordSeconds);
            onPrepEnd?.();
          } else {
            setPhase("done");
            onRecordEnd?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, recordSeconds, onPrepEnd, onRecordEnd]);

  if (phase === "done") {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="h-3 w-3 rounded-full bg-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">Time's up</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Circular timer */}
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="48" cy="48" r="42"
            fill="none"
            stroke={phase === "prep" ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground tabular-nums">{timeLeft}</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-sm">
        {phase === "prep" ? (
          <span className="font-semibold text-foreground">
            Recording in <span className="text-primary font-bold">{timeLeft}</span> seconds
          </span>
        ) : (
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Recording… <span className="text-destructive font-bold">{timeLeft}s</span> left
          </span>
        )}
      </div>
    </div>
  );
};

export default PrepCountdown;
