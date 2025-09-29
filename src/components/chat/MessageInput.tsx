"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <div className="w-full border-t border-gray-700 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 px-4 py-3 flex items-center gap-2 h-14">
      {/* Attach button */}
      <button
        className="p-2 text-gray-300 hover:text-white disabled:opacity-50"
        onClick={() => {}}
        disabled={disabled}
      >
        <Paperclip size={20} />
      </button>

      {/* Textarea with gradient and ~85% height */}
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 resize-none bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 text-white placeholder-gray-400 outline-none px-3 py-2 rounded-lg h-[85%] min-h-[36px]"
        placeholder="Message PolicyPilot AI... (Enter to send, Shift+Enter for new line)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={disabled}
      />

      {/* Send button */}
      <button
        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
        onClick={handleSend}
        disabled={disabled}
      >
        <Send size={18} />
      </button>
    </div>
  );
}
