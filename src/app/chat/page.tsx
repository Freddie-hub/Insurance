"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import ChatWindow from "@/components/chat/ChatWindow";
import MessageInput from "@/components/chat/MessageInput";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

const initialMessage: Message = {
  id: "m1",
  role: "assistant",
  content:
    "Hello! I'm InsureAssist AI, your personal insurance advisor. I can help you compare policies across insurers like Britam, Jubilee, CIC, Heritage and Liberty. What type of insurance would you like to explore today?",
  timestamp: new Date().toISOString(),
};

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(
    chatIdFromUrl ?? undefined
  );

  // Redirect if not logged in or email not verified
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  // Subscribe to messages if chatId is set
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        timestamp: doc.data().timestamp?.toDate().toISOString(),
      })) as Message[];
      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([initialMessage]);
      }
    });

    return () => unsub();
  }, [chatId, user]);

  // Create chat via API (return chatId)
  const createChatIfNeeded = async (firstMessage: string): Promise<string> => {
    if (!user) throw new Error("No user");

    if (chatId) return chatId;

    const words = firstMessage.split(" ").slice(0, 6).join(" ");
    const chatName =
      words + (firstMessage.split(" ").length > 6 ? "..." : "");

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        chat_name: chatName,
      }),
    });

    if (!res.ok) throw new Error("Failed to create chat");
    const data = await res.json();

    setChatId(data.id);
    router.push(`/chat?chatId=${data.id}`);

    return data.id;
  };

  // Save message via API
  const saveMessage = async (msg: Message, activeChatId?: string) => {
    if (!activeChatId) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: activeChatId,
        role: msg.role,
        content: msg.content,
      }),
    });
  };

  // Add user message
  const addUserMessage = async (text: string) => {
    const ensuredChatId = await createChatIfNeeded(text);

    const msg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((m) => [...m, msg]);
    await saveMessage(msg, ensuredChatId);
    await getAssistantReply(text, ensuredChatId);
  };

  // Fetch assistant reply from API
  const getAssistantReply = async (userText: string, activeChatId?: string) => {
    if (!activeChatId) return;
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText, chatId: activeChatId }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();

      const assistantMsg: Message = {
        id: "a-" + Date.now(),
        role: "assistant",
        content:
          data.answer || "Sorry, I couldn’t find relevant information.",
        timestamp: new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMsg]);
      await saveMessage(assistantMsg, activeChatId);
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, errorMsg]);
      await saveMessage(errorMsg, activeChatId);
    } finally {
      setChatLoading(false);
    }
  };

  // Regenerate last assistant response
  const regenerateLast = async () => {
    const lastAssistantIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === "assistant");
    if (lastAssistantIndex === -1) return;

    const idx = messages.length - 1 - lastAssistantIndex;
    const before = messages.slice(0, idx);
    const latestUser = messages
      .slice(idx - 1, idx)
      .find((m) => m.role === "user");
    if (!latestUser) return;

    setMessages(before);
    await getAssistantReply(latestUser.content, chatId);
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
            <ChatWindow
              messages={messages}
              loading={chatLoading}
              onRegenerate={regenerateLast}
            />
            <MessageInput onSend={addUserMessage} disabled={chatLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
