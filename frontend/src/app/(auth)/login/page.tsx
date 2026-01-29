"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-8 md:px-20 lg:px-32 relative">
        <Link
          href="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-10">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-500">
            Please enter your details to sign in.
          </p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Remember me
            </label>
            <a
              href="#"
              className="font-medium text-primary hover:text-primary/80"
            >
              Forgot password?
            </a>
          </div>

          <Link
            href="/dashboard"
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex justify-center items-center"
          >
            Sign in
          </Link>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don&#39;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Sign up for free
          </Link>
        </p>
      </div>

      {/* Right: Image/Visual */}
      <div className="hidden md:block relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900/90 z-10" />
        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />

        <div className="relative z-20 h-full flex flex-col justify-end p-20 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            &quot;FinResolve changed how I view money forever.&quot;
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-300" />
            <div>
              <p className="font-semibold">Alex Morgan</p>
              <p className="text-sm text-gray-400">Freelance Designer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
