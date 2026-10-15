"use client";

// Optional "natural" voice: Kokoro-82M (Apache-2.0) running entirely in the browser via WebGPU.
// The model is downloaded once from Hugging Face and cached by the browser; nothing is sent to our server.
// Only offered when WebGPU is available: the WASM fallback is too slow for conversation.

import { useSyncExternalStore } from "react";
import type { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE = "af_heart" as const; // highest-graded American English voice in the Kokoro voice table

export type NaturalVoiceStatus = {
  state: "idle" | "loading" | "ready" | "error";
  progress: number; // 0-100 while loading
};

let status: NaturalVoiceStatus = { state: "idle", progress: 0 };
const listeners = new Set<() => void>();

function setStatus(next: NaturalVoiceStatus) {
  status = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNaturalVoiceStatus(): NaturalVoiceStatus {
  return useSyncExternalStore(subscribe, () => status, () => status);
}

const noopSubscribe = () => () => {};

export function useNaturalVoiceSupport(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && "gpu" in navigator,
    () => false,
  );
}

let ttsPromise: Promise<KokoroTTS> | null = null;

export function loadNaturalVoice(): Promise<KokoroTTS> {
  if (ttsPromise) return ttsPromise;

  setStatus({ state: "loading", progress: 0 });
  const files = new Map<string, { loaded: number; total: number }>();

  ttsPromise = (async () => {
    const { KokoroTTS } = await import("kokoro-js");
    const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: "fp32", // recommended for WebGPU
      device: "webgpu",
      progress_callback: (info) => {
        if (info.status !== "progress" || !info.file) return;
        files.set(info.file, { loaded: info.loaded, total: info.total });
        let loaded = 0;
        let total = 0;
        files.forEach((f) => {
          loaded += f.loaded;
          total += f.total;
        });
        if (total > 0) setStatus({ state: "loading", progress: Math.round((loaded / total) * 100) });
      },
    });
    setStatus({ state: "ready", progress: 100 });
    return tts;
  })().catch((err) => {
    ttsPromise = null;
    setStatus({ state: "error", progress: 0 });
    throw err;
  });

  return ttsPromise;
}

// Playback queue: speak sentence by sentence so the first one starts before the rest is generated.
let runId = 0;
let currentAudio: HTMLAudioElement | null = null;

export function stopNatural(): void {
  runId++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function playBlob(blob: Blob, id: number): Promise<void> {
  return new Promise((resolve) => {
    if (id !== runId) return resolve();
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    currentAudio = el;
    const done = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === el) currentAudio = null;
      resolve();
    };
    el.onended = done;
    el.onerror = done;
    el.play().catch(done);
  });
}

// Resolves when finished or interrupted. Rejects if the model fails to load or generate.
export async function speakNatural(text: string): Promise<void> {
  stopNatural();
  const id = runId;
  const tts = await loadNaturalVoice();
  if (id !== runId) return;

  const { TextSplitterStream } = await import("kokoro-js");
  const splitter = new TextSplitterStream();
  const stream = tts.stream(splitter, { voice: VOICE });
  splitter.push(text);
  splitter.close();

  // Keep generating the next sentence while the previous one plays, so there are no gaps.
  let playing: Promise<void> = Promise.resolve();
  for await (const { audio } of stream) {
    if (id !== runId) return;
    const blob = audio.toBlob();
    playing = playing.then(() => playBlob(blob, id));
  }
  await playing;
}
