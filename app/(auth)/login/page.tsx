"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Send, Play } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const verify = searchParams.get("verify");
    
    if (error) {
      if (error === "OAuthSignin" || error === "OAuthCallback") {
        toast.error("Failed to sign in with OAuth provider. Please try again.");
      } else {
        toast.error("An error occurred during authentication.");
      }
    }

    if (verify) {
      toast.success("Magic link sent! Please check your email inbox.");
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setIsEmailLoading(true);
    try {
      // Direct login with Credentials provider to bypass Resend SMTP configuration locally
      const res = await signIn("credentials", {
        email,
        name: email.split("@")[0],
        callbackUrl: "/dashboard",
        redirect: false,
      });
      
      if (res?.error) {
        toast.error(res.error || "Failed to sign in.");
      } else {
        toast.success("Successfully signed in!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const res = await signIn("credentials", {
        email: "demo@billflow.com",
        name: "Demo Developer",
        callbackUrl: "/dashboard",
        redirect: false,
      });
      
      if (res?.error) {
        toast.error(res.error || "Failed to sign in.");
      } else {
        toast.success("Logged in as Demo Developer!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    if (provider === "google") setIsGoogleLoading(true);
    if (provider === "github") setIsGithubLoading(true);

    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      toast.error(`Failed to login with ${provider}`);
      setIsGoogleLoading(false);
      setIsGithubLoading(false);
    }
  };

  const isAnyLoading = isEmailLoading || isGoogleLoading || isGithubLoading || isDemoLoading;

  return (
    <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md shadow-violet-500/20 mb-3">
          BF
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Welcome to BillFlow</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
          Sign in to manage your invoices and clients
        </p>
      </div>

      {/* Demo Sign-In Button */}
      <div className="mb-5">
        <button
          onClick={handleDemoLogin}
          disabled={isAnyLoading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-500 text-white rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition-all active:scale-98 shadow-md shadow-violet-500/20 border border-violet-500 hover:border-violet-600"
        >
          {isDemoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          🚀 Quick Demo Login (Skip API Keys)
        </button>
      </div>

      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold">
            Or register / sign in
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleOAuthLogin("google")}
          disabled={isAnyLoading}
          className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2.5 text-sm font-semibold transition-all active:scale-98 disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.41 7.59l3.79 2.94C6.12 7.55 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.24-2.06 3.59-5.1 3.59-8.66z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.73c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.41 7.17C.51 8.97 0 11.02 0 13.19c0 2.17.51 4.22 1.41 6.02l3.79-2.94-.01.56z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.84-2.98c-1.09.73-2.48 1.17-4.12 1.17-3.16 0-5.88-2.51-6.84-5.49L1.37 15.7C3.33 19.62 7.31 23 12 23z"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <button
          onClick={() => handleOAuthLogin("github")}
          disabled={isAnyLoading}
          className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2.5 text-sm font-semibold transition-all active:scale-98 disabled:opacity-50"
        >
          {isGithubLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <svg className="h-4 w-4 text-zinc-800 dark:text-zinc-200" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          )}
          Continue with GitHub
        </button>
      </div>

      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold">
            Or sign in with custom email
          </span>
        </div>
      </div>

      {/* Magic Link Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="email" className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-450">
              Email Address
            </label>
            <span className="text-[10px] text-violet-500 font-semibold bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded">
              Instant Local Login
            </span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAnyLoading}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all disabled:opacity-50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnyLoading}
          className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-500 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          {isEmailLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Sign In Instantly
        </button>
      </form>

      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 mt-6 leading-relaxed">
        By signing in, you agree to our Terms of Service and Privacy Policy. Demo accounts bypass active email sending configurations.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">Loading login page...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
