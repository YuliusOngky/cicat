import type { Topic } from "./types";

export const TOPICS: Topic[] = [
  {
    id: "daily-life",
    name: "Daily Life",
    emoji: "🌅",
    description: "Routines, food, hobbies, family — the stuff of everyday talk.",
    color: "from-orange-400 to-amber-500",
    prompts: [
      "What's your morning routine like?",
      "What did you have for dinner last night?",
      "Tell me about a hobby you've been into lately.",
      "What's your neighborhood like?",
    ],
  },
  {
    id: "work-career",
    name: "Work & Career",
    emoji: "💼",
    description: "Job interviews, workplace situations, career goals.",
    color: "from-blue-500 to-indigo-600",
    prompts: [
      "What kind of work do you do?",
      "Tell me about a challenging project you worked on.",
      "What's your dream job?",
      "How do you handle stress at work?",
    ],
  },
  {
    id: "travel-culture",
    name: "Travel & Culture",
    emoji: "✈️",
    description: "Places you've been, dream destinations, cultural experiences.",
    color: "from-teal-400 to-cyan-500",
    prompts: [
      "What's the most interesting place you've visited?",
      "Where would you most like to travel next?",
      "Tell me about an interesting cultural experience you've had.",
      "What's the best food you've tried while traveling?",
    ],
  },
  {
    id: "technology",
    name: "Technology",
    emoji: "💻",
    description: "AI, social media, gadgets, and the digital world.",
    color: "from-violet-500 to-purple-600",
    prompts: [
      "How has technology changed your daily life?",
      "What do you think about AI becoming so widespread?",
      "What's your relationship with social media?",
      "What gadget couldn't you live without?",
    ],
  },
  {
    id: "opinion-debate",
    name: "Opinion & Debate",
    emoji: "🎭",
    description: "Share your views on social issues, ethics, and ideas.",
    color: "from-rose-500 to-pink-600",
    prompts: [
      "What's something you feel strongly about?",
      "Do you think remote work is better than office work?",
      "What change would you most like to see in the world?",
      "Is social media doing more harm than good?",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    description: "Movies, music, books, sports — pop culture chat.",
    color: "from-green-500 to-emerald-600",
    prompts: [
      "What's a show or movie you've really enjoyed recently?",
      "Tell me about your favorite type of music.",
      "Are you into any sports?",
      "What book has stuck with you the most?",
    ],
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
