"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

const PASSWORD_CHAR =
  typeof navigator !== "undefined" && navigator.userAgent.match(/firefox|fxios/i)
    ? "\u25CF"
    : "\u2022";

interface SkiperSmoothInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "onChange" | "type"> {
  label?: string;
  icon?: React.ReactNode;
  type?: "text" | "password" | "tel" | "email";
  value: string;
  onChange: (val: string) => void;
  wrapperClassName?: string;
}

export function SkiperSmoothInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  className,
  wrapperClassName,
  onBlur,
  onFocus,
  disabled,
  required,
  ...props
}: SkiperSmoothInputProps) {
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
    const isPassword = type === "password";

    let fontSize = styles.fontSize;
    if (
      PASSWORD_CHAR === "\u2022" &&
      isPassword &&
      typeof navigator !== "undefined" &&
      !navigator.userAgent.match(/chrome|chromium|crios/i)
    ) {
      fontSize = `${parseFloat(fontSize) + 6.25}px`;
    }

    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
    measureSpan.style.letterSpacing = styles.letterSpacing;
    measureSpan.style.fontFeatureSettings = styles.fontFeatureSettings;
    measureSpan.style.fontVariationSettings = styles.fontVariationSettings;
  };

  const measurePrefixWidth = (text: string) => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;

    const paddingLeft =
      parseFloat(window.getComputedStyle(input).paddingLeft) || 0;

    return text.length > 0
      ? measureSpan.offsetWidth + paddingLeft
      : paddingLeft;
  };

  const scrollCaretIntoView = (
    target: HTMLInputElement,
    absoluteWidth: number
  ) => {
    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
    const visibleLeft = target.scrollLeft + paddingLeft;

    if (absoluteWidth > visibleRight) {
      target.scrollLeft = Math.min(
        absoluteWidth - target.clientWidth + paddingRight,
        maxScroll
      );
      return;
    }

    if (absoluteWidth < visibleLeft) {
      target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
    }
  };

  const getCaretIndex = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;

    if (selectionStart === selectionEnd) {
      return selectionStart;
    }

    return target.selectionDirection === "backward"
      ? selectionStart
      : selectionEnd;
  };

  const updateCaretFromInput = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = getCaretIndex(target);
    const isPassword = type === "password";
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : target.value.slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    scrollCaretIntoView(target, absoluteWidth);

    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible =
      caretPosition >= minX && caretPosition <= maxX + 1;

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
    document.fonts?.addEventListener?.("loadingdone", updateCaretIfFocused);
    void document.fonts?.ready?.then(updateCaretIfFocused);
    input.addEventListener("scroll", updateCaretIfFocused);

    const resizeObserver = new ResizeObserver(updateCaretIfFocused);
    resizeObserver.observe(container);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.fonts?.removeEventListener?.("loadingdone", updateCaretIfFocused);
      input.removeEventListener("scroll", updateCaretIfFocused);
      resizeObserver.disconnect();
    };
  }, []);

  const hasValue = value.length > 0;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn("relative w-full cursor-text group", wrapperClassName)}
    >
      {/* Animated Outline Glow */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 2px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.18)"
            : "0 0 0 1px rgba(229, 231, 235, 1)",
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 rounded-2xl bg-white pointer-events-none"
      />

      <div className="relative flex items-center px-4 py-3.5 z-10">
        {icon && (
          <span
            className={`mr-3 transition-colors duration-200 shrink-0 pointer-events-none ${
              isFocused ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            {icon}
          </span>
        )}

        <div
          ref={containerRef}
          className="relative flex-1 grid grid-cols-1 items-center h-5 overflow-hidden"
          style={{ caretColor: "transparent" }}
        >
          {/* Floating Label */}
          {label && (
            <motion.label
              animate={{
                y: isFocused || hasValue ? -22 : 0,
                scale: isFocused || hasValue ? 0.85 : 1,
                color: isFocused ? "#059669" : hasValue ? "#374151" : "#9ca3af",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute left-0 origin-left select-none text-xs font-semibold pointer-events-none z-10"
            >
              {label}
            </motion.label>
          )}

          {/* Actual Input - caret-transparent eliminates double cursor */}
          <input
            {...props}
            ref={inputRef}
            type={type}
            disabled={disabled}
            required={required}
            value={value}
            placeholder={isFocused || !label ? placeholder : ""}
            onChange={(e) => {
              onChange(e.target.value);
              requestAnimationFrame(() => {
                if (inputRef.current) {
                  updateCaretRef.current(inputRef.current);
                }
              });
            }}
            onFocus={(e) => {
              setIsFocused(true);
              updateCaretRef.current(e.target);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              caretOpacity.set(0);
              onBlur?.(e);
            }}
            className={cn(
              "col-start-1 col-end-2 row-start-1 row-end-2 w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 caret-transparent selection:bg-emerald-100 selection:text-emerald-900",
              className
            )}
          />

          {/* Measurement Span */}
          <span
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
          />

          {/* Single Animated Spring Caret Bar */}
          <motion.div
            className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 h-4 w-[2.5px] rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.9)] self-center"
            style={{ x: springCaretX, opacity: caretOpacity }}
          />
        </div>
      </div>
    </div>
  );
}