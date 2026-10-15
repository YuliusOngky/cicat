"use client";

// Browser-native speech (Web Speech API): no extra API cost, no server round trip.
// Recognition works in Chrome, Edge and Safari; synthesis in all major browsers.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

// useSyncExternalStore keeps server and first client render identical (false), then updates.
export function useSpeechSupport(): { input: boolean; output: boolean } {
  const input = useSyncExternalStore(noopSubscribe, () => getRecognitionCtor() !== null, () => false);
  const output = useSyncExternalStore(
    noopSubscribe,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );
  return { input, output };
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone is blocked. Allow mic access for this site in your browser settings.",
  "service-not-allowed": "Microphone is blocked. Allow mic access for this site in your browser settings.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs an internet connection.",
};

// onTranscript gets the live text while speaking (final=false) and the full sentence once you stop (final=true).
export function useSpeechInput(onTranscript: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const callbackRef = useRef(onTranscript);

  useEffect(() => {
    callbackRef.current = onTranscript;
  });

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recRef.current) return;

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false; // stops after a natural pause, like a conversation turn
    rec.interimResults = true;

    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      callbackRef.current((finalText + interim).trim(), false);
    };
    rec.onerror = (e) => {
      const message = ERROR_MESSAGES[e.error];
      if (message) setError(message);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      if (finalText.trim()) callbackRef.current(finalText.trim(), true);
    };

    recRef.current = rec;
    setError("");
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        rec.onend = null;
        rec.abort();
        recRef.current = null;
      }
    };
  }, []);

  return { listening, error, start, stop };
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /natural|google|samantha|aria|jenny/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
