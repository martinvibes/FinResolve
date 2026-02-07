"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect to onboarding when user is authenticated
  useEffect(() => {
    if (user && success) {
      router.push("/onboarding");
    }
  }, [user, success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!name.trim()) {
      setError("Please enter your name");
      setIsLoading(false);
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, name);

    if (signUpError) {
      setError(signUpError);
      setIsLoading(false);
      return;
    }

    // Show success message - redirect will happen via useEffect when user is set
    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Account created!
          </h2>
          <p className="text-slate-500 mb-4">
            Redirecting you to get started...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

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
            Create an account
          </h1>
          <p className="text-slate-500">
            Start your journey to financial freedom.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="john@example.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Create a strong password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Must be at least 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              "Get Started"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>

      {/* Right: Image/Visual */}
      <div className="hidden md:block relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-slate-900/90 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />

        <div className="relative z-20 h-full flex flex-col justify-end p-20 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            "The best investment you can make is in yourself."
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-300" />
            <div>
              <p className="font-semibold">Warren Buffet</p>
              <p className="text-sm text-gray-400">Investor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
