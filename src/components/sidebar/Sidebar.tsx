"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, Plus, Settings, LogOut, Menu, X } from "lucide-react";

type Chat = {
  id: string;
  chat_name: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function Sidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("chatId");
  const [chats, setChats] = useState<Chat[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Load chats for the logged-in user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        chat_name: doc.data().chat_name || "New Chat",
        createdAt: doc.data().createdAt || null,
      })) as Chat[];
      setChats(data);
    });

    return () => unsub();
  }, [user]);

  // Create a new chat and redirect
  const handleNewChat = async () => {
    if (!user) return;
    setIsMobileOpen(false);

    const docRef = await addDoc(collection(db, "chats"), {
      userId: user.uid,
      chat_name: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    router.push(`/chat?chatId=${docRef.id}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const handleChatClick = () => {
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-white">InsureAssist</div>
            <div className="text-xs text-gray-400">AI Insurance Advisor</div>
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white font-medium px-4 py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <Plus size={18} />
          New Conversation
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-250px)]">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Recent Conversations
        </div>

        <div className="space-y-2">
          {chats.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Start your first conversation to see your chat history here
            </div>
          ) : (
            <>
              {(showAll ? chats : chats.slice(0, 4)).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat?chatId=${chat.id}`}
                  onClick={handleChatClick}
                  className={`block p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group ${
                    currentChatId === chat.id
                      ? "bg-white/15 border border-white/20"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate group-hover:text-gray-200">
                        {chat.chat_name}
                      </div>
                      {chat.createdAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(
                            chat.createdAt.seconds * 1000
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {chats.length > 4 && (
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="w-full text-gray-400 hover:text-white text-sm mt-2 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  {showAll ? "Show Less" : "Show More"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-sm">
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 bg-[#0F172B] text-white flex-shrink-0 h-screen flex-col shadow-2xl border-r border-white/10">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-80 bg-[#0F172B] text-white flex-col shadow-2xl z-50 transform transition-transform duration-300 border-r border-white/10 ${
          isMobileOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
        }`}
      >
        {/* Mobile Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
