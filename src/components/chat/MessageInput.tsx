"use client";

import { useState, useRef, useEffect } from "react";

export default function MessageInput({ 
  onSend, 
  disabled 
}: { 
  onSend: (text: string) => void; 
  disabled?: boolean; 
}) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value.trim() || disabled) return;
      onSend(value.trim());
      setValue("");
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* Input Container */}
        <div className={`relative flex items-end gap-3 p-2 rounded-2xl border-2 transition-all duration-200 ${
          isFocused 
            ? "border-blue-500 bg-blue-50/30 shadow-lg" 
            : "border-gray-200 bg-gray-50/50"
        }`}>
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Ask about insurance policies, coverage options, or get personalized recommendations..."
              className="w-full resize-none bg-transparent px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
              rows={1}
              maxLength={4000}
              disabled={disabled}
            />
            
            {/* Character Count */}
            {value.length > 3500 && (
              <div className="absolute -bottom-6 right-2 text-xs text-gray-400">
                {value.length}/4000
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-3 rounded-xl shadow-md transition-all duration-200 ${
              canSend
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            {disabled ? (
              // Loading spinner
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              // Send arrow
              <svg 
                className="w-5 h-5 transform rotate-45 transition-transform duration-200" 
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
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="text-xs text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">Enter</kbd> to send, 
            <kbd className="px-2 py-0.5 bg-gray-200 rounded text-gray-700 font-mono ml-1">Shift + Enter</kbd> for new line
          </div>
          
          {/* Quick suggestions */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-400">Try:</span>
            <button
              onClick={() => setValue("Compare health insurance options")}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              disabled={disabled}
            >
              Health Insurance
            </button>
            <button
              onClick={() => setValue("What motor insurance do you recommend?")}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              disabled={disabled}
            >
              Motor Insurance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}