"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TextMorphProps = {
  words?: string[];
  interval?: number;
  className?: string;
  charClassName?: string;
  prefix?: string;
};

const defaultWords = [
  "milk",
  "drinks",
  "snacks",
  "chips",
  "bread",
  "fruits",
  "vegetables",
  "eggs",
];

export function TextMorph({
  words = defaultWords,
  interval = 2400,
  className,
  charClassName,
  prefix = "Search for",
}: TextMorphProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!words.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  const chars = useMemo(() => {
    return Array.from(words[index]?.trim() ?? "");
  }, [index, words]);

  if (!words.length) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none text-xs text-gray-600 font-medium pointer-events-none leading-none",
        className
      )}
    >
      <span className="shrink-0 text-gray-600 leading-none">{prefix.trim()}</span>

      <span className="relative inline-flex h-4 items-center overflow-visible">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={index}
            className="flex gap-[0.5px] items-center"
            initial={{ opacity: 0, y: 8, rotateX: 65 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -8, rotateX: -65 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {chars.map((char, i) => (
              <motion.span
                key={i}
                className={cn("inline-block text-gray-600 font-medium", charClassName)}
                initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{
                  delay: i * 0.025,
                  duration: 0.22,
                  ease: "easeOut",
                }}
              >
                {char}
              </motion.span>
            ))}
            <span className="text-gray-600 font-medium">...</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

export default TextMorph;