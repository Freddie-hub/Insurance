"use client";

export default function Button({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button {...rest} className={`px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 ${className}`}>
      {children}
    </button>
  );
}
