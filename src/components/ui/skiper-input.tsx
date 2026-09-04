"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface SkiperSmoothInputProps {
  label: string;
  icon: React.ReactNode;
  type?: "text" | "password";
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SkiperSmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
}: SkiperSmoothInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [caretLeft, setCaretLeft] = useState(0);

  // Measure cursor position based on text width for the smooth gliding caret
  useEffect(() => {
    if (!containerRef.current) return;
    const textSpan = containerRef.current.querySelector(".rendered-text") as HTMLElement;
    if (textSpan) {
      setCaretLeft(textSpan.offsetWidth);
    } else {
      setCaretLeft(0);
    }
  }, [value]);

  const hasValue = value.length > 0;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative w-full cursor-text group"
    >
      {/* Animated Outline Glow */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 2px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.18)"
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

        <div ref={containerRef} className="relative flex-1 flex items-center h-5">
          {/* Floating Label */}
          <motion.label
            animate={{
              y: isFocused || hasValue ? -22 : 0,
              scale: isFocused || hasValue ? 0.85 : 1,
              color: isFocused ? "#059669" : hasValue ? "#374151" : "#9ca3af",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-0 origin-left select-none text-xs font-semibold pointer-events-none"
          >
            {label}
          </motion.label>

          {/* Hidden Actual Input */}
          <input
            ref={inputRef}
            type={type}
            required={required}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
          />

          {/* Visible Rendered Characters */}
          <div className="relative flex items-center font-mono text-xs font-semibold text-gray-900 select-none pointer-events-none">
            <span className="rendered-text inline-block whitespace-pre">
              {type === "password" ? "•".repeat(value.length) : value}
            </span>

            {/* Skiper 56: Smooth Caret (spring glide bar) */}
            {isFocused && (
              <motion.span
                layoutId={`caret-${label}`}
                animate={{
                  opacity: [1, 0, 1],
                  x: caretLeft,
                }}
                transition={{
                  x: { type: "spring", stiffness: 500, damping: 30 },
                  opacity: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
                }}
                className="absolute left-0 w-[2.5px] h-4 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}