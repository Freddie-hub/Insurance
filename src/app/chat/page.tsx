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

Please tell me what type of insurance you are interested in (Health, Life, Motor, Home, Business, etc.), or ask a specific question about coverage options.`;

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
    setChatLoading(true);
    try {
      const ensuredChatId = await createChatIfNeeded(text);

      // Save user message
      await saveUserMessage(text, ensuredChatId);

      // Trigger backend AI response (writes to Firestore)
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, chatId: ensuredChatId }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setChatLoading(false);
    }
  };

  // Regenerate last AI response
  const regenerateLast = async () => {
    if (!chatId) return;

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    setChatLoading(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lastUser.content, chatId }),
      });
    } catch (error) {
      console.error("Failed to regenerate response:", error);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div className="text-gray-600 font-medium">Loading InsureAssist...</div>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) return null;

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Topbar user={user} />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none" />
          
          <div className="relative flex-1 flex flex-col">
            <ChatWindow messages={messages} loading={chatLoading} onRegenerate={regenerateLast} />
            <MessageInput onSend={addUserMessage} disabled={chatLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}