"use client";

import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export default function ChatWindow({
  messages,
  loading,
  onRegenerate,
}: {
  messages: Message[];
  loading: boolean;
  onRegenerate?: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-100">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {loading && <TypingIndicator />}

        <div className="pt-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onRegenerate}
              className="text-sm px-3 py-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
            >
              Regenerate Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
