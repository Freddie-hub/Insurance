"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleResendVerification = async () => {
    setMessage("");
    setError("");
    if (!user) {
      setError("No user is signed in.");
      return;
    }
    try {
      await sendEmailVerification(user);
      setMessage("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Verify Your Email</h2>
        <p className="text-gray-600 mb-4">
          A verification email has been sent to {user?.email || "your email"}. Please check your inbox and click the link to verify your account.
        </p>
        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          onClick={handleResendVerification}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow mb-4"
        >
          Resend Verification Email
        </button>
        <p className="text-sm text-gray-500 text-center">
          Not your account?{" "}
          <button
            onClick={handleSignOut}
            className="text-blue-600 hover:underline"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}