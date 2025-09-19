"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      router.push("/verify-email");
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.");
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sign Up</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-600">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-gray-600">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Create a password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow"
          >
            Sign Up
          </button>
        </form>
        <button
          onClick={handleGoogleSignup}
          className="w-full mt-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.24 10.29v2.19h6.47c-.26 1.39-1.03 2.57-2.18 3.37v2.79h3.53c2.07-1.91 3.27-4.73 3.27-8.15 0-.78-.08-1.54-.22-2.27h-10.87z"
            />
            <path
              fill="currentColor"
              d="M12 22.75c-3.03 0-5.76-1.21-7.74-3.17l-3.53 2.79c2.57 2.57 6.12 4.17 10.27 4.17 3.02 0 5.88-1.02 8.15-2.94v-3.53h-3.53c-.66.96-1.53 1.79-2.57 2.38z"
            />
            <path
              fill="currentColor"
              d="M4.73 14.15c-.52-1.56-.81-3.24-.81-5.01s.29-3.45.81-5.01l3.53-2.79c-1.91 2.57-3.03 5.76-3.03 9.8s1.12 7.23 3.03 9.8l-3.53-2.79z"
            />
            <path
              fill="currentColor"
              d="M12 4.75c1.39 0 2.67.34 3.82.94-1.03.59-1.9 1.42-2.57 2.38H8.47v3.53h6.47c-.26 1.39-1.03 2.57-2.18 3.37H8.47v3.53c-3.02-1.02-5.88-3.24-7.74-6.17.52 1.56.81 3.24.81 5.01s-.29 3.45-.81 5.01c2.57-2.57 6.12-4.17 10.27-4.17 3.02 0 5.88 1.02 8.15 2.94-2.57 2.57-6.12 4.17-10.27 4.17z"
            />
          </svg>
          Sign up with Google
        </button>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}