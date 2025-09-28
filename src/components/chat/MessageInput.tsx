"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip, Mic } from "lucide-react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = "auto";
    // Set max height to about 8 lines (24px line height * 8 + padding)
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  // Focus on textarea when not disabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (!value.trim() || disabled || isComposing) return;
    onSend(value.trim());
    setValue("");
    // Reset height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else if (!isComposing) {
        // Send message with Enter (but not during IME composition)
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleComposition = (e: React.CompositionEvent) => {
    if (e.type === "compositionstart") {
      setIsComposing(true);
    } else if (e.type === "compositionend") {
      setIsComposing(false);
    }
  };

  const canSend = value.trim().length > 0 && !disabled && !isComposing;
  const charactersUsed = value.length;
  const maxLength = 4000;
  const showCharacterCount = charactersUsed > maxLength * 0.8; // Show when 80% full

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-4xl mx-auto">
        {/* Character count indicator */}
        {showCharacterCount && (
          <div className="text-right mb-1">
            <span
              className={`text-xs ${
                charactersUsed >= maxLength
                  ? "text-red-500"
                  : charactersUsed > maxLength * 0.9
                  ? "text-amber-500"
                  : "text-gray-500"
              }`}
            >
              {charactersUsed}/{maxLength}
            </span>
          </div>
        )}

        {/* Main input container */}
        <div
          className={`relative flex items-end bg-white border rounded-2xl shadow-lg transition-all duration-200 ${
            disabled
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 focus-within:border-blue-500 focus-within:shadow-blue-100 focus-within:shadow-md"
          }`}
        >
          {/* Attachment button (optional - can be removed if not needed) */}
          <button
            type="button"
            disabled={disabled}
            className="p-2 ml-2 mb-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleComposition}
              onCompositionEnd={handleComposition}
              placeholder={
                disabled
                  ? "Please wait..."
                  : "Message InsureAssist AI... (Press Enter to send, Shift+Enter for new line)"
              }
              className="w-full resize-none bg-transparent px-0 py-3 text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0 leading-6"
              rows={1}
              maxLength={maxLength}
              disabled={disabled}
              style={{ 
                minHeight: "24px",
                maxHeight: "200px"
              }}
            />
          </div>

          {/* Send/Stop button */}
          <div className="p-2 mb-1">
            {disabled ? (
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4" fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                  canSend
                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            InsureAssist AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}