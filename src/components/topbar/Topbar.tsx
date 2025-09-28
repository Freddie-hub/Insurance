"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { User } from "firebase/auth";
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
    <header className="bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-30">
      <div className="px-4 md:px-6 py-2"> {/* Reduced height */}
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-800">InsureAssist</span>
            </div>

            <div className="hidden md:block">
              <p className="text-xs text-slate-600 font-medium ml-11">
                AI-powered insurance recommendations from Kenya's top insurers
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
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-white/50 transition-all duration-200 border border-transparent hover:border-white/40 hover:shadow-sm backdrop-blur-sm"
                  aria-label="Open account menu"
                >
                  <Avatar initials={user?.displayName?.[0] || user?.email?.[0] || "U"} />
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
                          <Avatar initials={user?.displayName?.[0] || user?.email?.[0] || "U"} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{user.displayName || "User"}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/50 transition-colors">Account Settings</button>
                          <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/50 transition-colors">Help & Support</button>
                        </div>
                        <div className="border-t border-white/20 py-2">
                          <button onClick={handleSignOut} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">Sign Out</button>
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
