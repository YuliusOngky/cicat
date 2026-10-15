"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProfiles,
  getActiveProfileId,
  getSessionsByUser,
  getAllVocabByUser,
} from "@/lib/storage";
import type { UserProfile, ConversationSession, VocabItem } from "@/lib/types";
import { TOPICS } from "@/lib/topics";

export default function ProgressPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "vocab">("overview");

  useEffect(() => {
    const id = getActiveProfileId();
    if (!id) { router.push("/"); return; }
    const p = getProfiles().find((x) => x.id === id);
    if (!p) { router.push("/"); return; }
    setProfile(p);
    setSessions(getSessionsByUser(id));
    setVocab(getAllVocabByUser(id));
  }, [router]);

  if (!profile) return null;

  const completedSessions = sessions.filter((s) => s.endedAt);
  const totalMessages = completedSessions.reduce((sum, s) => sum + s.messageCount, 0);
  const totalCorrections = completedSessions.reduce(
    (sum, s) => sum + s.messages.filter((m) => m.correction).length,
    0
  );

  // Topic breakdown
  const topicBreakdown = TOPICS.map((t) => ({
    ...t,
    count: completedSessions.filter((s) => s.topicId === t.id).length,
  })).filter((t) => t.count > 0);

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/topics")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold">Your Progress</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {profile.avatar} {profile.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {(["overview", "sessions", "vocab"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={
              activeTab === tab
                ? { background: "var(--accent)", color: "#fff" }
                : { color: "var(--text-muted)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sessions", value: completedSessions.length, emoji: "🗣️" },
              { label: "Day Streak", value: profile.streak, emoji: "🔥" },
              { label: "Messages Sent", value: totalMessages, emoji: "💬" },
              { label: "Vocab Learned", value: vocab.length, emoji: "📚" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="text-3xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {totalCorrections > 0 && (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold mb-1">
                💡 {totalCorrections} correction{totalCorrections !== 1 ? "s" : ""} so far
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Each tip is a chance to level up your English naturalness.
              </p>
            </div>
          )}

          {/* Topics practiced */}
          {topicBreakdown.length > 0 && (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3 className="font-semibold mb-3">Topics Practiced</h3>
              <div className="space-y-2">
                {topicBreakdown.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-lg w-7">{t.emoji}</span>
                    <span className="flex-1 text-sm">{t.name}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                    >
                      {t.count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedSessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">💭</div>
              <p className="font-semibold mb-2">No sessions yet</p>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                Start your first conversation to see your progress here.
              </p>
              <button
                onClick={() => router.push("/topics")}
                className="px-6 py-3 rounded-xl font-medium text-white text-sm"
                style={{ background: "var(--accent)" }}
              >
                Start Practicing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-3">
          {completedSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No completed sessions yet.
              </p>
            </div>
          ) : (
            completedSessions.map((s) => {
              const topic = TOPICS.find((t) => t.id === s.topicId);
              const date = new Date(s.startedAt);
              const duration = s.endedAt
                ? Math.round((new Date(s.endedAt).getTime() - date.getTime()) / 60000)
                : null;
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{topic?.emoji}</span>
                      <span className="font-semibold text-sm">{s.topicName}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {date.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>💬 {s.messageCount} messages</span>
                    <span>📚 {s.vocabLearned.length} vocab</span>
                    {duration !== null && <span>⏱ {duration}m</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vocab Tab */}
      {activeTab === "vocab" && (
        <div>
          {vocab.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Vocabulary from your sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {vocab.length} word{vocab.length !== 1 ? "s" : ""} collected
              </p>
              {vocab.map((v, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <p className="font-semibold text-sm" style={{ color: "var(--accent)" }}>
                    {v.word}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {v.definition}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
