
"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import ChatWindow from "@/components/chat/ChatWindow";
import MessageInput from "@/components/chat/MessageInput";

/**
 * This page composes the chat UI.
 * It holds the message state and a simple mock response generator (for now).
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

const initialMessages: Message[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Hello! I'm InsureAssist AI, your personal insurance advisor. I can help you compare policies across insurers like Britam, Jubilee, CIC, Heritage and Liberty. What type of insurance would you like to explore today?",
    timestamp: new Date().toISOString(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);

  const addUserMessage = (text: string) => {
    const msg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, msg]);
    // Kick off assistant response
    getAssistantReply(text);
  };

  const getAssistantReply = async (userText: string) => {
    setLoading(true);
    // Mock delay to show typing indicator
    await new Promise((r) => setTimeout(r, 900));

    // MOCK NLP-style reply generator (replace later with your RAG/vector DB call)
    const assistantText = generateMockReply(userText);

    const assistantMsg: Message = {
      id: "a-" + Date.now(),
      role: "assistant",
      content: assistantText,
      timestamp: new Date().toISOString(),
    };

    setMessages((m) => [...m, assistantMsg]);
    setLoading(false);
  };

  const generateMockReply = (input: string) => {
    // Basic example to show structured, NLP style output for funeral question
    const q = input.toLowerCase();
    if (q.includes("funeral") || q.includes("funeral cover") || q.includes("families")) {
      return [
        "I’ve reviewed several insurers and here are three strong family funeral cover options you can consider:",
        "",
        "**1. Britam – Family Funeral**",
        "• **Premiums:** ~KES 1,500/month for KES 100,000 per member (entry).",
        "• **Benefits:** Quick payout (typically within 72 hours), covers nuclear family (principal, spouse, children).",
        "• **Notes:** 6-month waiting period for non-accidental death.",
        "",
        "**2. Jubilee – Last Expense Plan**",
        "• **Premiums:** starting ~KES 1,200/month for ~KES 80,000 cover.",
        "• **Benefits:** Good group options and reliable settlement record.",
        "• **Notes:** Some exclusions for pre-existing conditions early in the policy.",
        "",
        "**3. CIC – Family Shield Plan**",
        "• **Premiums:** typically KES 1,000–3,500/month depending on family size & sum assured.",
        "• **Benefits:** Flexible extensions for parents/in-laws; payouts often within 48–72 hours.",
        "• **Notes:** Non-disclosure/fraud considerations can void claims.",
        "",
        "**Summary:** For fastest payouts choose Britam; for lower entry premiums choose Jubilee; for flexible family coverage choose CIC.",
        "",
        "Would you like a side-by-side comparison table for these plans?"
      ].join("\n");
    }

    // generic reply
    return `Thanks — I got your question: "${input}". I can compare plans across insurers (Britam, Jubilee, CIC, Heritage, Liberty). Would you like a short summary, a side-by-side comparison, or recommended single-plan choices based on budget and family size?`;
  };

  const regenerateLast = () => {
    // Remove last assistant message and regenerate
    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === "assistant");
    if (lastAssistantIndex === -1) return;
    // find actual index
    const idx = messages.length - 1 - lastAssistantIndex;
    const before = messages.slice(0, idx);
    const latestUser = messages.slice(idx - 1, idx).find((m) => m.role === "user");
    if (!latestUser) return;
    setMessages(before);
    getAssistantReply(latestUser.content);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <ChatWindow messages={messages} loading={loading} onRegenerate={regenerateLast} />
            <MessageInput onSend={addUserMessage} disabled={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
