"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white px-4 py-3 rounded-2xl shadow-sm rounded-bl-none">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">Assistant is finding the best policies for you</div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-150" />
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
