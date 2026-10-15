"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfiles, getActiveProfileId, getSessionsByUser } from "@/lib/storage";
import { TOPICS } from "@/lib/topics";
import type { UserProfile } from "@/lib/types";

export default function TopicsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const id = getActiveProfileId();
    if (!id) { router.push("/"); return; }
    const profiles = getProfiles();
    const p = profiles.find((x) => x.id === id);
    if (!p) { router.push("/"); return; }
    setProfile(p);

    const sessions = getSessionsByUser(id);
    const counts: Record<string, number> = {};
    for (const s of sessions) {
      counts[s.topicId] = (counts[s.topicId] || 0) + 1;
    }
    setSessionCounts(counts);
  }, [router]);

  if (!profile) return null;

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Good to see you,</p>
          <h1 className="text-2xl font-bold">
            {profile.avatar} {profile.name}
          </h1>
        </div>
        <button
          onClick={() => router.push("/progress")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          📊 Progress
        </button>
      </div>

      {profile.streak > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-semibold">{profile.streak} day streak!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Keep it up — consistency is key.
            </p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Choose a topic to practice</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOPICS.map((topic) => {
          const count = sessionCounts[topic.id] || 0;
          return (
            <button
              key={topic.id}
              onClick={() => router.push(`/conversation/${topic.id}`)}
              className="flex flex-col p-5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topic.color}`} />
              <span className="text-3xl mb-3">{topic.emoji}</span>
              <h3 className="font-semibold text-base mb-1">{topic.name}</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
                {topic.description}
              </p>
              {count > 0 && (
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full self-start"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {count} session{count > 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm mt-8" style={{ color: "var(--text-muted)" }}>
        Not you?{" "}
        <button
          onClick={() => router.push("/")}
          className="underline"
          style={{ color: "var(--accent)" }}
        >
          Switch profile
        </button>
      </p>
    </div>
  );
}
