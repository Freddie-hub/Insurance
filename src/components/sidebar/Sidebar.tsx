"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Sidebar() {
  const [recent] = useState([
    { id: "c1", title: "Family Funeral Cover Options", date: "19/09/2025" },
    { id: "c2", title: "Motor Insurance Comparison", date: "18/09/2025" },
    { id: "c3", title: "Health Insurance for Young Families", date: "17/09/2025" },
  ]);
  const router = useRouter();

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
              <div className="text-xs text-gray-300">AI insurance advisor</div>
            </div>
          </div>
        </div>

        <button
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center justify-center"
          onClick={() => router.push("/chat")}
        >
          + New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-auto p-4">
        <div className="text-xs text-gray-400 uppercase mb-3">Recent chats</div>
        <ul className="space-y-2">
          {recent.map((r) => (
            <li key={r.id}>
              <Link
                href="#"
                className="block p-3 rounded-md hover:bg-gray-800"
                onClick={(e) => e.preventDefault()}
              >
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-gray-400">{r.date}</div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-800 mt-6 pt-4 space-y-3">
          <Link href="#" className="flex items-center gap-3 text-sm hover:text-white text-gray-300" onClick={(e) => e.preventDefault()}>
            <span>🔖</span>
            Saved Recommendations
          </Link>
          <Link href="#" className="flex items-center gap-3 text-sm hover:text-white text-gray-300" onClick={(e) => e.preventDefault()}>
            <span>📊</span>
            Compare Plans
          </Link>
          <Link href="#" className="flex items-center gap-3 text-sm hover:text-white text-gray-300" onClick={(e) => e.preventDefault()}>
            <span>⚙️</span>
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-sm hover:text-white text-gray-300 w-full text-left"
          >
            <span>🚪</span>
            Log Out
          </button>
        </div>
      </nav>
    </aside>
  );
}