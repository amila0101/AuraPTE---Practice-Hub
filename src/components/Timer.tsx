import { useState, useEffect, useCallback } from "react";

interface TimerProps {
  initialMinutes: number;
  onTimeUp?: () => void;
  isRunning?: boolean;
}

const Timer = ({ initialMinutes, onTimeUp, isRunning = true }: TimerProps) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);

  useEffect(() => {
    if (!isRunning || seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, seconds, onTimeUp]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds < 60;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums ${isLow ? "text-destructive" : "text-foreground"}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
};

export default Timer;
