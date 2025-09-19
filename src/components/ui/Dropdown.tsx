// src/components/ui/Dropdown.tsx
"use client";

import type { MouseEvent } from "react";

export default function Dropdown({
  items,
  onClose,
}: {
  items: { label: string; onClick: () => void }[];
  onClose?: () => void;
}) {
  const handleClick = (e: MouseEvent, fn: () => void) => {
    e.preventDefault();
    fn();
    onClose?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
      <ul className="divide-y">
        {items.map((it, i) => (
          <li key={i}>
            <button
              onClick={(e) => handleClick(e, it.onClick)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50"
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
