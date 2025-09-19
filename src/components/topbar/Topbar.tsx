"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { User } from "firebase/auth";
import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";
import { auth } from "@/lib/firebase";

export default function Topbar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const dropdownItems = user
    ? [
        { label: "My Profile", onClick: () => alert("Open profile (placeholder)") },
        { label: "Account Settings", onClick: () => alert("Open settings (placeholder)") },
        { label: "Log Out", onClick: handleSignOut },
      ]
    : [
        { label: "Log In", onClick: () => router.push("/login") },
        { label: "Sign Up", onClick: () => router.push("/signup") },
      ];

  return (
    <header className="bg-gradient-to-r from-white to-gray-100 border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">AI-powered insurance recommendations from Kenya's top insurers</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile Avatar + Dropdown */}
          <div className="relative">
            <button
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={() => setOpen((s) => !s)}
              aria-label="Open account menu"
            >
              <Avatar initials={user?.displayName?.[0] || user?.email?.[0] || "G"} />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48">
                <Dropdown
                  items={dropdownItems}
                  onClose={() => setOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}