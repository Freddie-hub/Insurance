"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendEmailVerification, signOut, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

function VerifyEmailInner() {
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
        .catch(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify your email
          </h1>
          <p className="text-gray-600">
            We’ve sent a verification link to your inbox
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-8">
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-blue-600 text-sm">{message}</p>
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

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700 font-medium">
                Didn’t receive the email? Check your{" "}
                <span className="font-semibold">Spam</span> or{" "}
                <span className="font-semibold">Junk</span> folder.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

export default function VerifyEmailContent() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
