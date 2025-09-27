"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Bookmark,
  BarChart,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

type Chat = {
  id: string;
  chat_name: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function Sidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);

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
        chat_name: doc.data().chat_name || "Untitled Chat",
        createdAt: doc.data().createdAt || null,
      })) as Chat[];
      setChats(data);
    });

    return () => unsub();
  }, [user]);

  // Create a new chat and redirect
  const handleNewChat = async () => {
    if (!user) return;

    const docRef = await addDoc(collection(db, "chats"), {
      userId: user.uid,
      chat_name: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    router.push(`/chat/${docRef.id}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <aside className="w-80 bg-gray-900 text-white flex-shrink-0 h-screen hidden md:flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              IA
            </div>
            <div>
              <div className="text-lg font-semibold">InsureAssist AI</div>
              <div className="text-xs text-gray-300">
                AI insurance advisor
              </div>
            </div>
          </div>
        </div>

        <button
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2"
          onClick={handleNewChat}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-auto p-4">
        <div className="text-xs text-gray-400 uppercase mb-3">
          Recent chats
        </div>
        <ul className="space-y-2">
          {chats.length === 0 ? (
            <div className="text-gray-400 text-sm">
              No chats yet. Start a new one!
            </div>
          ) : (
            chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/chat/${chat.id}`}
                  className="block p-3 rounded-md hover:bg-gray-800"
                >
                  <div className="font-medium">{chat.chat_name}</div>
                  {chat.createdAt && (
                    <div className="text-xs text-gray-400">
                      {new Date(
                        chat.createdAt.seconds * 1000
                      ).toLocaleDateString()}
                    </div>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="border-t border-gray-800 mt-6 pt-4 space-y-3">
          {/* <Link
            href="#"
            className="flex items-center gap-3 text-sm hover:text-white text-gray-300"
            onClick={(e) => e.preventDefault()}
          >
            <Bookmark size={16} />
            Saved Recommendations
          </Link> */}
          <Link
            href="#"
            className="flex items-center gap-3 text-sm hover:text-white text-gray-300"
            onClick={(e) => e.preventDefault()}
          >
            <BarChart size={16} />
            Compare Plans
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 text-sm hover:text-white text-gray-300"
            onClick={(e) => e.preventDefault()}
          >
            <Settings size={16} />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-sm hover:text-white text-gray-300 w-full text-left"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </nav>
    </aside>
  );
}
