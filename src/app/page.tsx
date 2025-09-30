"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gray-100 pointer-events-none" />
      
      {/* Decorative Blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-30 animate-pulse delay-700" />

      <div className="relative w-full max-w-5xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-semibold text-gray-800 mb-2">
              PolicyPilot AI
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Your Personal Insurance Advisor
            </p>
          </div>

          {/* Description */}
          <div className="max-w-3xl mx-auto mb-8">
            <p className="text-gray-700 text-center leading-relaxed">
              Navigate the complex world of insurance with confidence. Compare policies from top providers in Kenya like{" "}
              <span className="font-semibold text-gray-800">Britam, Jubilee, CIC, Heritage</span> and more all in one platform.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { title: "Compare Policies", desc: "Side-by-side comparison of premiums, benefits, and coverage", color: "blue" },
              { title: "Clear Explanations", desc: "Understand exclusions, waiting periods, and terms easily", color: "indigo" },
              { title: "Quick Decisions", desc: "Get instant answers and make informed choices faster", color: "purple" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className={`w-9 h-9 mb-2 rounded-lg flex items-center justify-center bg-${feature.color}-600 text-white`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Insurance Types */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['Life', 'Health', 'Motor', 'Funeral', 'General'].map((type) => (
              <span
                key={type}
                className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700"
              >
                {type} Insurance
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 flex-wrap justify-center mb-6">
            {user ? (
              <Link
                href="/chat"
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                Go to Chat
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  Get Started
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 rounded-lg bg-white border border-blue-600 text-blue-600 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-500">
              {['Secure & Private', 'Unbiased Recommendations', '24/7 Available'].map((text) => (
                <div key={text} className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
