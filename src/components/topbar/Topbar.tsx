"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, User } from "firebase/auth";
import Avatar from "../ui/Avatar";
import { auth } from "@/lib/firebase";
import { ChevronDown } from "lucide-react";

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

  return (
    <header
      className="
        sticky top-0 z-30 border-b border-white/20
        bg-gray-800
        md:bg-gradient-to-r md:from-gray-900 md:via-gray-800 md:to-gray-500
      "
    >
      <div className="px-4 md:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"></div>

            <div className="hidden md:block">
              <p className="text-xs text-white/70 font-medium">
                Recommendations from Kenya&apos;s top insurers
              </p>
            </div>
          </div>

          {/* User Section */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20 hover:shadow-sm"
                  aria-label="Open account menu"
                >
                  <Avatar initials={user?.email?.[0] || "U"} />
                  <ChevronDown
                    size={16}
                    className={`text-white/70 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && (
                  <>
                    {/* Mobile overlay */}
                    <div
                      className="md:hidden fixed inset-0 bg-black/20 z-40"
                      onClick={() => setOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 z-50">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/20 flex items-center gap-3">
                          <Avatar initials={user?.email?.[0] || "U"} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/20 py-2">
                          <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
