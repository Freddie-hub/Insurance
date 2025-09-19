"use client";

import { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; // max ~160px (~5 lines)
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value.trim()) return;
      onSend(value.trim());
      setValue("");
    }
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about insurance policies, coverage options, or get personalized recommendations..."
          className="flex-1 resize-none rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          rows={1}
          maxLength={4000}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-7-9-7-4 7 4 7z" />
          </svg>
        </button>
      </div>
      <div className="max-w-3xl mx-auto text-xs text-gray-400 mt-2">Press Enter to send, Shift + Enter for new line</div>
    </div>
  );
}
