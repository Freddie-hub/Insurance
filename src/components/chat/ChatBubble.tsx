"use client";

import ReactMarkdown from "react-markdown";

export default function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm break-words ${
          isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"
        }`}
      >
        <div className="prose prose-sm max-w-full">
          {isUser ? (
            // render plain text for user
            <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
          ) : (
            // render markdown for assistant
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
