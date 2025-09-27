"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatBubble({ 
  role, 
  content 
}: { 
  role: "user" | "assistant"; 
  content: string 
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? "bg-blue-600 text-white rounded-br-none" 
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        }`}
      >
        {isUser ? (
          <div 
            className="whitespace-pre-wrap break-words"
            style={{ wordBreak: "break-word" }}
          >
            {content}
          </div>
        ) : (
          <div className="chat-prose">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom table rendering for better mobile support
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto">
                    <table {...props}>{children}</table>
                  </div>
                ),
                // Ensure links open in new tab
                a: ({ href, children, ...props }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // Better code block styling
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return <code className={className} {...props}>{children}</code>;
                  }
                  return (
                    <pre>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}