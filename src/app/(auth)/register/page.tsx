"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Loader2, ArrowLeft } from "lucide-react";

// Skiper 56: Smooth Caret & Individual Character Spring Physics
function Skiper56SmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  required = false,
  minLength,
  isDevouring = false,
}: {
  label: string;
  icon: React.ReactNode;
  type?: "text" | "password" | "email";
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  minLength?: number;
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
            minLength={minLength}
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
            <span>{isDevouring ? "Consuming details..." : "Registering..."}</span>
          </div>
        ) : (
          <span>Create Account</span>
        )}
      </motion.button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDevouring, setIsDevouring] = useState(false);
  const [error, setError] = useState("");

  const executeRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all registration fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Preserve the credentials for API dispatch
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    // Run the devour animation
    setIsDevouring(true);
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Permanently wipe the input fields
    setName("");
    setEmail("");
    setPassword("");
    setIsDevouring(false);

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
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
          <p className="mt-2 text-xs text-gray-500 font-medium">Create your customer account</p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Skiper56SmoothInput
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              value={name}
              onChange={setName}
              isDevouring={isDevouring}
              required
            />

            <Skiper56SmoothInput
              label="Email Address"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={setEmail}
              isDevouring={isDevouring}
              required
            />

            <Skiper56SmoothInput
              label="Password (min 6 characters)"
              type="password"
              minLength={6}
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
                textToDevour={name || email || "Details"}
                onDevourAndSubmit={executeRegister}
              />
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}