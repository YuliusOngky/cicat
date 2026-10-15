"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProfiles,
  getActiveProfileId,
  saveProfile,
  saveSession,
  generateId,
  updateStreak,
} from "@/lib/storage";
import { getTopicById } from "@/lib/topics";
import type { Message, ConversationSession, UserProfile, VocabItem } from "@/lib/types";

export default function ConversationPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-muted)" }}>Loading…</div>}>
      <ConversationPage />
    </Suspense>
  );
}

function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const topic = getTopicById(topicId);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [sessionVocab, setSessionVocab] = useState<VocabItem[]>([]);
  const [correctionCount, setCorrectionCount] = useState(0);
  const [ended, setEnded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!topic) { router.push("/topics"); return; }
    const id = getActiveProfileId();
    if (!id) { router.push("/"); return; }
    const p = getProfiles().find((x) => x.id === id);
    if (!p) { router.push("/"); return; }

    // Hydrating from localStorage on mount is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(p);

    // Create session
    const newSession: ConversationSession = {
      id: generateId(),
      userId: p.id,
      topicId,
      topicName: topic.name,
      messages: [],
      startedAt: new Date().toISOString(),
      endedAt: null,
      messageCount: 0,
      vocabLearned: [],
    };
    setSession(newSession);

    // Opening message from AI
    const opener: Message = {
      id: generateId(),
      role: "assistant",
      content: topic.prompts[Math.floor(Math.random() * topic.prompts.length)],
      timestamp: new Date().toISOString(),
    };
    setMessages([opener]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading || ended || !session || !profile) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Build history for API (exclude correction/vocab metadata)
      const apiMessages = newMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topicId, topicName: topic?.name }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      const newVocab: VocabItem[] = (data.vocab || []).map(
        (v: { word: string; definition: string }) => ({
          ...v,
          learnedAt: new Date().toISOString(),
          topicId,
        })
      );

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.message,
        correction: data.correction,
        vocab: newVocab.length > 0 ? newVocab : undefined,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      if (data.correction) setCorrectionCount((c) => c + 1);
      if (newVocab.length > 0) {
        setSessionVocab((v) => [...v, ...newVocab]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          content: "Sorry, something went wrong. Try again?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function endSession() {
    if (!session || !profile) return;

    const updatedSession: ConversationSession = {
      ...session,
      messages,
      endedAt: new Date().toISOString(),
      messageCount: messages.filter((m) => m.role === "user").length,
      vocabLearned: sessionVocab,
    };
    saveSession(updatedSession);

    const updatedProfile = updateStreak(profile);
    saveProfile(updatedProfile);

    setEnded(true);
  }

  if (!topic) return null;

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/topics")}
            className="text-lg w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-60"
            style={{ color: "var(--text-muted)" }}
          >
            ←
          </button>
          <span className="text-xl">{topic.emoji}</span>
          <div>
            <p className="font-semibold text-sm">{topic.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cam · AI conversation partner
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70"
            style={{
              background: showPanel ? "var(--accent-light)" : "var(--border)",
              color: showPanel ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            📋 {sessionVocab.length > 0 ? sessionVocab.length + " vocab" : "Notes"}
          </button>
          {!ended && userMessageCount >= 2 && (
            <button
              onClick={endSession}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "#ef4444" }}
            >
              End
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Ended state */}
          {ended ? (
            <div
              className="mx-4 mb-4 p-5 rounded-2xl text-center border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-semibold mb-1">Great session!</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {userMessageCount} message{userMessageCount !== 1 ? "s" : ""} ·{" "}
                {sessionVocab.length} vocab · {correctionCount} correction
                {correctionCount !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/topics")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--border)" }}
                >
                  Topics
                </button>
                <button
                  onClick={() => router.push("/progress")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: "var(--accent)" }}
                >
                  View Progress
                </button>
              </div>
            </div>
          ) : (
            /* Input */
            <div
              className="px-4 pb-4 pt-2 border-t shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  disabled={loading || ended}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || ended}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold transition-opacity disabled:opacity-40 shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  ↑
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {userMessageCount < 2
                  ? `Send ${2 - userMessageCount} more message${2 - userMessageCount !== 1 ? "s" : ""} to unlock End Session`
                  : "Press End when you're done"}
              </p>
            </div>
          )}
        </div>

        {/* Side panel */}
        {showPanel && (
          <div
            className="w-72 border-l shrink-0 overflow-y-auto scrollbar-hide"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-4">Session Notes</h3>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Messages", value: userMessageCount },
                  { label: "Vocab", value: sessionVocab.length },
                  { label: "Fixes", value: correctionCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-2 rounded-xl text-center"
                    style={{ background: "var(--bg)" }}
                  >
                    <p className="font-bold text-lg">{s.value}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Vocab list */}
              {sessionVocab.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                    Vocabulary
                  </h4>
                  <div className="space-y-2">
                    {sessionVocab.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl"
                        style={{ background: "var(--accent-light)" }}
                      >
                        <p className="font-semibold text-sm" style={{ color: "var(--accent)" }}>
                          {v.word}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {v.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Corrections from messages */}
              {messages.some((m) => m.correction) && (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mt-5 mb-3" style={{ color: "var(--text-muted)" }}>
                    Corrections
                  </h4>
                  <div className="space-y-2">
                    {messages
                      .filter((m) => m.correction)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl text-xs"
                          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                        >
                          <p className="line-through mb-1" style={{ color: "var(--text-muted)" }}>
                            &ldquo;{m.correction!.original}&rdquo;
                          </p>
                          <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                            &ldquo;{m.correction!.corrected}&rdquo;
                          </p>
                          <p style={{ color: "var(--text-muted)" }}>{m.correction!.explanation}</p>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {sessionVocab.length === 0 && !messages.some((m) => m.correction) && (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                  Vocab and corrections will appear here as you chat.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-1"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        >
          C
        </div>
      )}
      <div className={`max-w-[75%] space-y-2`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? { background: "var(--accent)", color: "#fff" }
              : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }
          }
        >
          {message.content}
        </div>

        {message.correction && (
          <div
            className="px-3 py-2 rounded-xl text-xs border-l-2"
            style={{
              background: "var(--surface)",
              borderLeftColor: "#f59e0b",
              border: "1px solid var(--border)",
              borderLeft: "3px solid #f59e0b",
            }}
          >
            <p className="font-semibold mb-1" style={{ color: "#f59e0b" }}>
              💡 Quick tip
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              <span className="line-through">&ldquo;{message.correction.original}&rdquo;</span>
              {" → "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                &ldquo;{message.correction.corrected}&rdquo;
              </span>
            </p>
            <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
              {message.correction.explanation}
            </p>
          </div>
        )}

        {message.vocab && message.vocab.length > 0 && (
          <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}
          >
            {message.vocab.map((v, i) => (
              <div key={i}>
                <span className="font-semibold" style={{ color: "var(--accent)" }}>
                  📚 {v.word}
                </span>
                <span style={{ color: "var(--text-muted)" }}> — {v.definition}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
      >
        C
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex items-center gap-1"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: "var(--text-muted)",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
