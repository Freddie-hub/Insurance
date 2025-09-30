"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendEmailVerification, signOut, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (mode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          router.push("/");
        })
        .catch((err) => {
          console.error("Verification failed", err);
          setError("Invalid or expired verification link.");
        });
    }
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    setMessage("");
    setError("");
    if (!user) {
      setError("No user is signed in.");
      return;
    }

    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: "https://insurance-lime-phi.vercel.app/",
        handleCodeInApp: true,
      };

      await sendEmailVerification(user, actionCodeSettings);
      setMessage(
        "Verification email sent successfully! Please check your inbox and spam folder."
      );
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-rose-100/20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg shadow-amber-500/10 mb-4">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600">
            We've sent a verification link to your inbox
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-8">
          {message && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-amber-600 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full mb-4">
              <span className="text-sm text-gray-600 font-medium">
                {user?.email || "your email"}
              </span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Please click the verification link in your email to activate your
              account. The link will expire in 24 hours.
            </p>

            {/* Highlighted spam warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700 font-medium">
                Didn’t receive the email?  
                Check your <span className="font-semibold">Spam</span> or{" "}
                <span className="font-semibold">Junk</span> folder.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-3 rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {isLoading ? "Sending email..." : "Resend verification email"}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-3 rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
