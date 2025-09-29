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

  // Auto-grow textarea but stop after ~6–7 lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + "px"; // Slightly taller for mobile
    }
  }, [value]);

  return (
    <div className="w-full border-t border-gray-700 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 p-3 sm:p-4">
      <div className="relative">
        {/* Textarea with icons inside */}
        <textarea
          ref={textareaRef}
          rows={1}
          className="w-full resize-none bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 
                     text-white placeholder-gray-400 outline-none 
                     pl-4 pr-20 py-3 sm:py-3.5 rounded-xl
                     min-h-[44px] sm:min-h-[48px] max-h-36 overflow-y-auto
                     focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                     transition-all duration-200 text-sm sm:text-base
                     leading-relaxed"
          placeholder="Message PolicyPilot AI..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          style={{ 
            // Prevent zoom on iOS
            fontSize: '16px',
          }}
        />

        {/* Icons container - positioned inside textarea */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* Attach button */}
          <button
            className="p-2 sm:p-2.5 text-gray-400 hover:text-white disabled:opacity-50 
                       rounded-lg hover:bg-gray-700/50 transition-all duration-200
                       touch-manipulation min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]
                       flex items-center justify-center"
            onClick={() => {}}
            disabled={disabled}
            type="button"
          >
            <Paperclip size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Send button */}
          <button
            className={`p-2 sm:p-2.5 rounded-lg text-white transition-all duration-200
                       touch-manipulation min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]
                       flex items-center justify-center
                       ${value.trim() && !disabled 
                         ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg' 
                         : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            type="button"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Subtle hint text for mobile users */}
        {value.length === 0 && (
          <div className="absolute left-4 bottom-1 text-xs text-gray-500 pointer-events-none">
            Enter to send • Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  );
}