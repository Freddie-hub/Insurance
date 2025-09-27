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
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = lastMessage && lastMessage.role === "assistant";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mx-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to InsureAssist AI</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your professional insurance advisor for the Kenyan market. Ask me about policies, compare options, or get personalized recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} content={message.content} />
          ))}
        </div>

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <TypingIndicator />
          </div>
        )}

        {/* Regenerate button */}
        {canRegenerate && !loading && (
          <div className="flex justify-end mt-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={onRegenerate}
                className="text-sm px-4 py-2 rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Regenerate Response
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}