// src/components/ui/Avatar.tsx
"use client";

export default function Avatar({ initials }: { initials?: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
      {initials ?? "U"}
    </div>
  );
}
