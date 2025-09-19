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
        { label: "Log Out", onClick: handleSignOut },
      ]
    : [
        { label: "Log In", onClick: () => router.push("/login") },
        { label: "Sign Up", onClick: () => router.push("/signup") },
      ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Tagline Section */}
          <div className="flex items-center">
            <p className="text-sm text-gray-600 font-medium">
              AI-powered insurance recommendations from Kenya's top insurers
            </p>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user.displayName || "User"}
                </span>
                <span className="text-xs text-gray-500">
                  {user.email}
                </span>
              </div>
            )}

            {/* Profile Avatar + Dropdown */}
            <div className="relative">
              <button
                className="p-2 rounded-xl hover:bg-white/80 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200"
                onClick={() => setOpen((s) => !s)}
                aria-label="Open account menu"
              >
                <Avatar 
                  initials={user?.displayName?.[0] || user?.email?.[0] || "G"} 
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-48 z-50">
                  <Dropdown
                    items={dropdownItems}
                    onClose={() => setOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tagline */}
      <div className="md:hidden px-6 pb-2">
        <p className="text-xs text-gray-600 text-center">
          AI-powered insurance recommendations from Kenya's top insurers
        </p>
      </div>
    </header>
  );
}