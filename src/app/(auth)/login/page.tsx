"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Lock, User, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const PASSWORD_CHAR = "\u2022";

function AnimatedEyeToggle({
  showPassword,
  onToggle,
}: {
  showPassword?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      className="group relative ml-2 p-1 text-gray-400 hover:text-emerald-600 focus:outline-none z-20 cursor-pointer flex items-center justify-center"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: !showPassword ? [0, -12, 6, -3, 0] : [0, 8, -4, 0],
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex items-center justify-center w-5 h-5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rotate-[-45deg] overflow-hidden flex items-center justify-center">
            <motion.div
              animate={{ scaleY: !showPassword ? 1 : 0 }}
              transition={{
                duration: 0.16,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "top" }}
              className="h-[20px] w-[2px] rounded-full bg-current"
            />
          </div>
        </div>
      </motion.div>
    </button>
  );
}

function SkiperSmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  required = false,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
}: {
  label: string;
  icon: React.ReactNode;
  type?: "text" | "password" | "email";
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
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

    const isPassword = type === "password" && !showPassword;
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
  }, [value, type, showPassword]);

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
  const actualType = type === "password" && showPassword ? "text" : type;

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
        className="absolute inset-0 rounded-2xl bg-white pointer-events-none border-0 ring-0 outline-none"
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
          className="relative flex-1 grid grid-cols-1 items-center h-5 overflow-hidden pr-2"
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
            type={actualType}
            required={required}
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
            style={{ border: "none", outline: "none", boxShadow: "none" }}
            className="col-start-1 col-end-2 row-start-1 row-end-2 w-full bg-transparent !border-none !outline-none !ring-0 focus:!outline-none focus:!ring-0 focus:!border-none text-xs sm:text-sm font-medium text-gray-900 caret-transparent selection:bg-emerald-100 selection:text-emerald-900 shadow-none"
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

        {showPasswordToggle && (
          <AnimatedEyeToggle
            showPassword={showPassword}
            onToggle={onTogglePassword}
          />
        )}
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
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isDevouring ? "Consuming credentials..." : "Authenticating..."}</span>
          </span>
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
  const [showPassword, setShowPassword] = useState(false);
  const [devourText, setDevourText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDevouring, setIsDevouring] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const capturedUsername = username.trim().toLowerCase();
    const capturedPassword = password;

    setDevourText(capturedUsername);
    setUsername("");
    setPassword("");
    setIsDevouring(true);
    setError("");
    setSuccessMessage("");

    await new Promise((resolve) => setTimeout(resolve, 550));
    setIsDevouring(false);
    setLoading(true);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
            <SkiperSmoothInput
              label="Email or Username"
              icon={<User className="w-4 h-4" />}
              type="text"
              value={username}
              onChange={setUsername}
              required
            />

            <SkiperSmoothInput
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={setPassword}
              required
              showPasswordToggle={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <div className="pt-2">
              <DevouringButton
                loading={loading}
                isDevouring={isDevouring}
                textToDevour={devourText || username || "Credentials"}
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