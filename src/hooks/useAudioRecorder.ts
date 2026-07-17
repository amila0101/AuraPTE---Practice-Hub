import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPreparing: boolean;   // countdown before recording starts
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationSec: number;
  preparationSec: number; // countdown value
  permissionDenied: boolean;
  start: (prepSeconds?: number) => void;
  stop: () => void;
  reset: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording]       = useState(false);
  const [isPreparing, setIsPreparing]       = useState(false);
  const [audioBlob, setAudioBlob]           = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl]             = useState<string | null>(null);
  const [durationSec, setDurationSec]       = useState(0);
  const [preparationSec, setPreparationSec] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (prepTimerRef.current)     clearInterval(prepTimerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = useCallback(async () => {
    try {
      // Request mic access — browser will prompt if not already granted
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,        // AssemblyAI optimal sample rate
        },
      });
      streamRef.current = stream;

      // Pick best supported MIME type (WebM preferred, fallback to OGG)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg;codecs=opus";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        // Stop all mic tracks so browser indicator disappears
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      // Collect chunks every 250ms for smooth streaming
      mediaRecorder.start(250);
      setIsRecording(true);
      setDurationSec(0);

      // Duration counter
      durationTimerRef.current = setInterval(() => {
        setDurationSec(prev => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setPermissionDenied(true);
      }
      console.error("Microphone error:", err);
    }
  }, []);

  const start = useCallback((prepSeconds = 0) => {
    if (prepSeconds > 0) {
      // Countdown before recording (simulates PTE beep delay)
      setIsPreparing(true);
      setPreparationSec(prepSeconds);

      let remaining = prepSeconds;
      prepTimerRef.current = setInterval(() => {
        remaining--;
        setPreparationSec(remaining);
        if (remaining <= 0) {
          clearInterval(prepTimerRef.current!);
          setIsPreparing(false);
          startRecording();
        }
      }, 1000);
    } else {
      startRecording();
    }
  }, [startRecording]);

  const stop = useCallback(() => {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      setIsPreparing(false);
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSec(0);
    setPreparationSec(0);
    setPermissionDenied(false);
    chunksRef.current = [];
  }, [stop, audioUrl]);

  return {
    isRecording, isPreparing, audioBlob, audioUrl,
    durationSec, preparationSec, permissionDenied,
    start, stop, reset,
  };
}
