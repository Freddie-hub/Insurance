"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import ChatWindow from "@/components/chat/ChatWindow";
import MessageInput from "@/components/chat/MessageInput";
import { useAuth } from "@/lib/AuthContext";

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  const addUserMessage = async (text: string) => {
    const msg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, msg]);
    await getAssistantReply(text);
  };

  const getAssistantReply = async (userText: string) => {
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: data.answer || "Sorry, I couldn’t find relevant information.",
        timestamp: new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const regenerateLast = async () => {
    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === "assistant");
    if (lastAssistantIndex === -1) return;

    const idx = messages.length - 1 - lastAssistantIndex;
    const before = messages.slice(0, idx);
    const latestUser = messages.slice(idx - 1, idx).find((m) => m.role === "user");
    if (!latestUser) return;

    setMessages(before);
    await getAssistantReply(latestUser.content);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <ChatWindow messages={messages} loading={chatLoading} onRegenerate={regenerateLast} />
            <MessageInput onSend={addUserMessage} disabled={chatLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
