"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";

export default function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-white to-gray-100 border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold">Family Funeral Cover Options</div>
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
              <Avatar initials="F" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48">
                <Dropdown
                  items={[
                    { label: "My Profile", onClick: () => alert("Open profile (placeholder)") },
                    { label: "Account Settings", onClick: () => alert("Open settings (placeholder)") },
                    { label: "Log Out", onClick: () => alert("Log out (placeholder)") },
                  ]}
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
