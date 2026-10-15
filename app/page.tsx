"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProfiles,
  saveProfile,
  setActiveProfileId,
  generateId,
  deleteProfile,
} from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

const AVATARS = ["😊", "🦁", "🐯", "🦊", "🐼", "🦅", "🌟", "🎯", "🚀", "🎸"];

export default function HomePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(AVATARS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  function selectProfile(profile: UserProfile) {
    setActiveProfileId(profile.id);
    router.push("/topics");
  }

  function createProfile() {
    if (!newName.trim()) return;
    const profile: UserProfile = {
      id: generateId(),
      name: newName.trim(),
      avatar: newAvatar,
      createdAt: new Date().toISOString(),
      streak: 0,
      lastSessionDate: null,
    };
    saveProfile(profile);
    setProfiles(getProfiles());
    setCreating(false);
    setNewName("");
    setActiveProfileId(profile.id);
    router.push("/topics");
  }

  function confirmDelete(id: string) {
    deleteProfile(id);
    setProfiles(getProfiles());
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-5xl mb-3">🗣️</div>
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Cicat
        </h1>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          Build your English confidence through real conversation
        </p>
      </div>

      {/* Profiles */}
      <div className="w-full max-w-md">
        <p className="text-sm font-medium mb-4 text-center" style={{ color: "var(--text-muted)" }}>
          {profiles.length === 0 ? "Create a profile to get started" : "Who's practicing today?"}
        </p>

        <div className="grid gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="relative group">
              <button
                onClick={() => selectProfile(p)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <span className="text-3xl">{p.avatar}</span>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {p.streak > 0 ? `🔥 ${p.streak} day streak` : "Ready to start practicing"}
                  </div>
                </div>
                <span className="text-xl" style={{ color: "var(--text-muted)" }}>›</span>
              </button>
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg"
                style={{ color: "var(--text-muted)", background: "var(--border)" }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Create new profile */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <span className="text-xl">+</span>
              <span className="font-medium">New Profile</span>
            </button>
          ) : (
            <div
              className="p-4 rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                Choose an avatar
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setNewAvatar(a)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      newAvatar === a ? "scale-110 ring-2 ring-indigo-500" : "hover:scale-105"
                    }`}
                    style={{ background: newAvatar === a ? "var(--accent-light)" : "var(--border)" }}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProfile()}
                className="w-full px-4 py-3 rounded-xl border outline-none mb-3 text-sm"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={createProfile}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 rounded-xl font-medium text-sm text-white transition-opacity disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  Create & Start
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(""); }}
                  className="px-4 py-2 rounded-xl text-sm transition-opacity"
                  style={{ background: "var(--border)", color: "var(--text-muted)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div
            className="rounded-2xl p-6 max-w-sm w-full text-center"
            style={{ background: "var(--surface)" }}
          >
            <p className="font-semibold mb-2">Delete this profile?</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              All conversation history and progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{ background: "var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 py-2 rounded-xl text-sm text-white bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
