"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import ChatWindow from "@/components/chat/ChatWindow";
import MessageInput from "@/components/chat/MessageInput";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc } from "firebase/firestore";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

const initialGreeting = `Hello! I'm InsureAssist AI, your professional insurance advisor for the Kenyan market.
I can help you compare policies across insurers like Britam, Jubilee, CIC, Heritage, and Liberty. 
Please tell me what type of insurance you are interested in (Health, Life, Motor, Home, Business, etc.), or ask a specific question.`;

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | undefined>(chatIdFromUrl ?? undefined);
  const [chatLoading, setChatLoading] = useState(false);

  // Redirect if not logged in or email not verified
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (!loading && user && !user.emailVerified) router.push("/verify-email");
  }, [user, loading, router]);

  // Reset messages when chatId changes
  useEffect(() => {
    if (chatIdFromUrl && chatIdFromUrl !== chatId) {
      setChatId(chatIdFromUrl);
      setMessages([]); // start empty; Firestore will populate
    }
  }, [chatIdFromUrl, chatId]);

  // Subscribe to messages in Firestore
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        timestamp: doc.data().timestamp?.toDate().toISOString(),
      })) as Message[];

      setMessages(msgs);
    });

    return () => unsub();
  }, [chatId, user]);

  // Create a new chat if needed
  const createChatIfNeeded = async (firstMessage: string): Promise<string> => {
    if (!user) throw new Error("No user");

    if (chatId) return chatId;

    try {
      const chatRef = doc(collection(db, "chats"));
      await setDoc(chatRef, {
        userId: user.uid,
        chat_name: firstMessage.length > 30 ? firstMessage.slice(0, 30) + "..." : firstMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add initial greeting from AI
      await addDoc(collection(chatRef, "messages"), {
        role: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      });

      setChatId(chatRef.id);
      router.push(`/chat?chatId=${chatRef.id}`);

      return chatRef.id;
    } catch (err) {
      console.error("createChatIfNeeded error:", err);
      throw err;
    }
  };

  // Save user message to Firestore
  const saveUserMessage = async (text: string, activeChatId: string) => {
    const chatRef = doc(db, "chats", activeChatId);
    await addDoc(collection(chatRef, "messages"), {
      role: "user",
      content: text,
      timestamp: new Date(),
    });
  };

  // Handle user sending a message
  const addUserMessage = async (text: string) => {
    const ensuredChatId = await createChatIfNeeded(text);

    // Save user message
    await saveUserMessage(text, ensuredChatId);

    // Trigger backend AI response (writes to Firestore)
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, chatId: ensuredChatId }),
    });
  };

  // Regenerate last AI response
  const regenerateLast = async () => {
    if (!chatId) return;

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: lastUser.content, chatId }),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !user.emailVerified) return null;

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Topbar user={user} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} loading={chatLoading} onRegenerate={regenerateLast} />
          <MessageInput onSend={addUserMessage} disabled={chatLoading} />
        </main>
      </div>
    </div>
  );
}
