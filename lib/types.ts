export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // emoji
  createdAt: string;
  streak: number;
  lastSessionDate: string | null;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabItem {
  word: string;
  definition: string;
  learnedAt: string;
  topicId: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  correction?: Correction;
  vocab?: VocabItem[];
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  messages: Message[];
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  vocabLearned: VocabItem[];
}

export interface Topic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompts: string[];
  color: string;
}

export interface ChatApiRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  topicId: string;
  topicName: string;
}

export interface ChatApiResponse {
  message: string;
  correction?: Correction;
  vocab?: { word: string; definition: string }[];
}
