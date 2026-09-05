"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Lock, Mail, User, Loader2, ArrowLeft } from "lucide-react";

const PASSWORD_CHAR =
  typeof navigator !== "undefined" && navigator.userAgent.match(/firefox|fxios/i)
    ? "\u25CF"
    : "\u2022";

function SkiperSmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  required = false,
  minLength,
}: {
  label: string;
  icon: React.ReactNode;
  type?: "text" | "password" | "email";
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const springCaretX = useSpring(
    caretX,
    prefersReducedMotion
      ? { stiffness: 10000, damping: 100, mass: 0.1 }
      : { stiffness: 500, damping: 30, mass: 0.5 }
  );

  const syncMeasureSpan = () => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return;

    const styles = window.getComputedStyle(input);
    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    measureSpan.style.letterSpacing = styles.letterSpacing;
  };

  const measurePrefixWidth = (text: string) => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;
    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0;
    return text.length > 0 ? measureSpan.offsetWidth + paddingLeft : paddingLeft;
  };

  const updateCaretFromInput = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex =
      selectionStart === selectionEnd
        ? selectionStart
        : target.selectionDirection === "backward"
        ? selectionStart
        : selectionEnd;

    const isPassword = type === "password";
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : target.value.slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

    caretX.set(Math.min(caretPosition, maxX));

    if (!isCaretVisible || hasSelection) {
      caretOpacity.set(0);
      return;
    }

    caretOpacity.set(1);
  };

  const updateCaretRef = useRef(updateCaretFromInput);
  updateCaretRef.current = updateCaretFromInput;

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      updateCaretRef.current(input);
    }
  }, [value, type]);

  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const updateCaretIfFocused = () => {
      if (document.activeElement === input) {
        updateCaretRef.current(input);
      }
    };

    const handleSelectionChange = () => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          updateCaretRef.current(input);
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.fonts?.ready?.then(updateCaretIfFocused);
    input.addEventListener("scroll", updateCaretIfFocused);

    const resizeObserver = new ResizeObserver(updateCaretIfFocused);
    resizeObserver.observe(container);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      input.removeEventListener("scroll", updateCaretIfFocused);
      resizeObserver.disconnect();
    };
  }, []);

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
        className="absolute inset-0 rounded-2xl bg-white pointer-events-none"
      />

      <div className="relative flex items-center px-4 py-3.5 z-10">
        <span
          className={`mr-3 transition-colors duration-200 shrink-0 pointer-events-none ${
            isFocused ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          {icon}
        </span>

        <div
          ref={containerRef}
          className="relative flex-1 grid grid-cols-1 items-center h-5 overflow-hidden"
          style={{ caretColor: "transparent" }}
        >
          <motion.label
            animate={{
              y: isFocused || hasValue ? -22 : 0,
              scale: isFocused || hasValue ? 0.82 : 1,
              color: isFocused ? "#059669" : hasValue ? "#374151" : "#9ca3af",
            }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="absolute left-0 origin-left select-none text-xs font-semibold pointer-events-none z-10"
          >
            {label}
          </motion.label>

          <input
            ref={inputRef}
            type={type}
            required={required}
            minLength={minLength}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              requestAnimationFrame(() => {
                if (inputRef.current) updateCaretRef.current(inputRef.current);
              });
            }}
            onFocus={(e) => {
              setIsFocused(true);
              updateCaretRef.current(e.target);
            }}
            onBlur={() => {
              setIsFocused(false);
              caretOpacity.set(0);
            }}
            className="col-start-1 col-end-2 row-start-1 row-end-2 w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 caret-transparent selection:bg-emerald-100 selection:text-emerald-900"
          />

          <span
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
          />

          <motion.div
            className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 h-4 w-[2.5px] rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.9)] self-center"
            style={{ x: springCaretX, opacity: caretOpacity }}
          />
        </div>
      </div>
    </div>
  );
}

function DevouringButton({
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
  const letters = textToDevour.slice(0, 18).split("");

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
                  duration: 0.55,
                  delay: i * 0.02,
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
        type="button"
        onClick={onDevourAndSubmit}
        disabled={loading || isDevouring}
        animate={{
          scale: isDevouring ? [1, 0.96, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all duration-200 shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
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
  const [devourText, setDevourText] = useState("");
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

    // 1. Capture payload
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    // 2. Set particle text and immediately wipe input fields with 0 delay
    setDevourText(name);
    setName("");
    setEmail("");
    setPassword("");
    setIsDevouring(true);
    setError("");

    // 3. Brief animation duration before network call
    await new Promise((resolve) => setTimeout(resolve, 550));
    setIsDevouring(false);
    setLoading(true);

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
            <SkiperSmoothInput
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              value={name}
              onChange={setName}
              required
            />

            <SkiperSmoothInput
              label="Email Address"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={setEmail}
              required
            />

            <SkiperSmoothInput
              label="Password (min 6 characters)"
              type="password"
              minLength={6}
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={setPassword}
              required
            />

            <div className="pt-2">
              <DevouringButton
                loading={loading}
                isDevouring={isDevouring}
                textToDevour={devourText || name || "Details"}
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