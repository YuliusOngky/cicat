"use client";

import type { UserProfile, ConversationSession, VocabItem } from "./types";

const PROFILES_KEY = "cicat_profiles";
const SESSIONS_KEY = "cicat_sessions";
const ACTIVE_PROFILE_KEY = "cicat_active_profile";

// Profiles
export function getProfiles(): UserProfile[] {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProfile(profile: UserProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  const sessions = getSessions().filter((s) => s.userId !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// Sessions
export function getSessions(): ConversationSession[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSessionsByUser(userId: string): ConversationSession[] {
  return getSessions()
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function saveSession(session: ConversationSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessionById(id: string): ConversationSession | undefined {
  return getSessions().find((s) => s.id === id);
}

// Vocab
export function getAllVocabByUser(userId: string): VocabItem[] {
  const sessions = getSessionsByUser(userId);
  const seen = new Set<string>();
  const vocab: VocabItem[] = [];
  for (const session of sessions) {
    for (const item of session.vocabLearned) {
      if (!seen.has(item.word.toLowerCase())) {
        seen.add(item.word.toLowerCase());
        vocab.push(item);
      }
    }
  }
  return vocab;
}

// Streak
export function updateStreak(profile: UserProfile): UserProfile {
  const today = new Date().toDateString();
  const last = profile.lastSessionDate;

  if (last === today) return profile;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = last === yesterday ? profile.streak + 1 : 1;

  return { ...profile, streak, lastSessionDate: today };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
