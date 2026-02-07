"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard");
  };

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

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

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
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
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
