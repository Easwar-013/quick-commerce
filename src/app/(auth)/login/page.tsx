"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

// Skiper 56: Smooth Caret & Character Physics
function Skiper56SmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  required = false,
  isDevouring = false,
}: {
  label: string;
  icon: React.ReactNode;
  type?: "text" | "password";
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  isDevouring?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [caretOffset, setCaretOffset] = useState(0);

  useEffect(() => {
    if (!textContainerRef.current) return;
    const textSpan = textContainerRef.current.querySelector(".character-trail") as HTMLElement;
    if (textSpan) {
      setCaretOffset(textSpan.offsetWidth);
    } else {
      setCaretOffset(0);
    }
  }, [value]);

  const hasValue = value.length > 0;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative w-full cursor-text group"
    >
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 2px rgba(16, 185, 129, 0.8), 0 0 16px rgba(16, 185, 129, 0.15)"
            : "0 0 0 1px rgba(229, 231, 235, 1)",
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 rounded-2xl bg-white"
      />

      <div className="relative flex items-center px-4 py-3.5 z-10">
        <span
          className={`mr-3 transition-colors duration-200 shrink-0 ${
            isFocused ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          {icon}
        </span>

        <div ref={textContainerRef} className="relative flex-1 flex items-center h-5">
          <motion.label
            animate={{
              y: isFocused || hasValue ? -22 : 0,
              scale: isFocused || hasValue ? 0.82 : 1,
              color: isFocused ? "#059669" : hasValue ? "#374151" : "#9ca3af",
            }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="absolute left-0 origin-left select-none text-xs font-semibold pointer-events-none"
          >
            {label}
          </motion.label>

          <input
            ref={inputRef}
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
          />

          <div className="relative flex items-center font-mono text-xs font-semibold text-gray-900 select-none pointer-events-none overflow-visible">
            <AnimatePresence>
              {!isDevouring && value.length > 0 && (
                <motion.span
                  initial={{ opacity: 1 }}
                  exit={{ y: 22, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.35, ease: "easeIn" }}
                  className="character-trail inline-block whitespace-pre"
                >
                  {type === "password" ? "•".repeat(value.length) : value}
                </motion.span>
              )}
            </AnimatePresence>

            {isFocused && !isDevouring && (
              <motion.span
                animate={{
                  x: caretOffset,
                  opacity: [1, 0, 1],
                }}
                transition={{
                  x: { type: "spring", stiffness: 500, damping: 30 },
                  opacity: { repeat: Infinity, duration: 0.85, ease: "easeInOut" },
                }}
                className="absolute left-0 w-[2.5px] h-4 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skiper 106: Devouring Details Button
function Skiper106DevouringButton({
  loading,
  isDevouring,
  textToDevour,
  onDevourAndSubmit,
}: {
  loading: boolean;
  isDevouring: boolean;
  textToDevour: string;
  onDevourAndSubmit: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const letters = textToDevour.slice(0, 20).split("");

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {isDevouring && (
          <div className="absolute -top-12 inset-x-0 flex justify-center items-center pointer-events-none z-30">
            {letters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: -6, opacity: 1, scale: 1 }}
                animate={{
                  y: [0, 18, 52],
                  x: [(i - letters.length / 2) * 8, 0],
                  scale: [1, 0.7, 0],
                  opacity: [1, 0.8, 0],
                  rotate: [0, (i % 2 === 0 ? 1 : -1) * 35],
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.025,
                  ease: "easeInOut",
                }}
                className="inline-block text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded shadow-xs"
              >
                {char}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        ref={btnRef}
        type="button"
        onMouseMove={handleMouseMove}
        onClick={onDevourAndSubmit}
        disabled={loading || isDevouring}
        animate={{
          scale: isDevouring ? [1, 0.96, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all duration-300 shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        <span
          className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.35), transparent 80%)`,
          }}
        />

        {loading || isDevouring ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isDevouring ? "Consuming credentials..." : "Authenticating..."}</span>
          </div>
        ) : (
          <span>Sign In</span>
        )}
      </motion.button>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDevouring, setIsDevouring] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please sign in.");
    }
  }, [searchParams]);

  const executeSignIn = async () => {
    if (!username.trim() || !password) {
      setError("Please fill in both your email/username and password.");
      return;
    }

    // Capture credentials for NextAuth authentication
    const capturedUsername = username.trim().toLowerCase();
    const capturedPassword = password;

    // Start Devour Animation
    setIsDevouring(true);
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Permanently wipe the input fields so text never returns
    setUsername("");
    setPassword("");
    setIsDevouring(false);

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await signIn("credentials", {
        username: capturedUsername,
        password: capturedPassword,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      const session = await getSession();
      const userRole = (session?.user as any)?.role;

      if (userRole === "delivery") {
        router.push("/delivery");
      } else if (userRole === "staff") {
        router.push("/staff");
      } else if (userRole === "admin") {
        router.push("/admin/products");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-emerald-600">
            flash<span className="text-amber-500">kart</span>
          </h2>
          <p className="mt-2 text-xs text-gray-500 font-medium">
            Sign in to customer, staff, delivery, or admin portal
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-3xl sm:px-10">
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-gray-400">Or with credentials</span>
            </div>
          </div>

          <div className="space-y-4">
            <Skiper56SmoothInput
              label="Email or Username"
              icon={<User className="w-4 h-4" />}
              type="text"
              value={username}
              onChange={setUsername}
              isDevouring={isDevouring}
              required
            />

            <Skiper56SmoothInput
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={setPassword}
              isDevouring={isDevouring}
              required
            />

            <div className="pt-2">
              <Skiper106DevouringButton
                loading={loading}
                isDevouring={isDevouring}
                textToDevour={username || "Credentials"}
                onDevourAndSubmit={executeSignIn}
              />
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link href="/register" className="text-emerald-600 font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}