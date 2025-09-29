"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip } from "lucide-react";

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; // allow new line
      } else if (!isComposing) {
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
  const showCharacterCount = charactersUsed > maxLength * 0.8;

  return (
    <div className="px-3 pb-2 pt-1 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
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
                  : "text-gray-400"
              }`}
            >
              {charactersUsed}/{maxLength}
            </span>
          </div>
        )}

        {/* Main input container */}
        <div
          className={`relative flex items-end bg-white/90 backdrop-blur-sm border rounded-2xl transition-all duration-200 ${
            disabled
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 focus-within:border-blue-500"
          }`}
        >
          {/* Attachment button */}
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
                maxHeight: "200px",
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
                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
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
        <div className="mt-1 text-center">
          <p className="text-xs text-gray-400">
            InsureAssist AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
