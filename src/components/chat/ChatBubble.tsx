"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mt-2 mb-4`}
    >
      <div
        className={`${
          isUser ? "max-w-[85%]" : "w-full sm:max-w-[85%]"
        } px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-slate-700 text-gray-100 rounded-br-none"
            : "bg-slate-700 text-gray-100 rounded-bl-none"
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
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto">
                    <table {...props}>{children}</table>
                  </div>
                ),
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-200 underline hover:text-teal-100"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;

                  if (isInline) {
                    return (
                      <code
                        className={`${className} bg-slate-800 px-1 rounded text-teal-100`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-sm">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
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
