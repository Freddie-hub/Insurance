"use client";

import { useState, useRef, useEffect } from "react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize
  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="flex items-end gap-2 w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about insurance policies or coverage options..."
        className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150"
        rows={1}
        maxLength={4000}
        disabled={disabled}
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        className={`p-2 rounded-xl transition-transform duration-150 ${
          canSend
            ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        aria-label="Send message"
      >
        <svg
          className="w-5 h-5 transform rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 19l9-7-9-7-4 7 4 7z"
          />
        </svg>
      </button>
    </div>
  );
}
