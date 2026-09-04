"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SkiperDevouringButtonProps {
  loading: boolean;
  onDevourAndSubmit: () => void;
  textToDevour: string;
}

export function SkiperDevouringButton({
  loading,
  onDevourAndSubmit,
  textToDevour,
}: SkiperDevouringButtonProps) {
  const [isDevouring, setIsDevouring] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || isDevouring) return;

    if (!textToDevour) {
      onDevourAndSubmit();
      return;
    }

    // Trigger devouring animation before final API call
    setIsDevouring(true);
    setTimeout(() => {
      setIsDevouring(false);
      onDevourAndSubmit();
    }, 700);
  };

  return (
    <div className="relative w-full">
      {/* Devouring Vortex Particles falling into button */}
      <AnimatePresence>
        {isDevouring && (
          <div className="absolute -top-12 inset-x-0 flex justify-center pointer-events-none z-30">
            {textToDevour.slice(0, 14).split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: -10, scale: 1, opacity: 1 }}
                animate={{
                  y: [0, 20, 48],
                  x: [(i - textToDevour.length / 2) * 8, 0],
                  scale: [1, 0.7, 0],
                  opacity: [1, 0.8, 0],
                  rotate: [0, (i % 2 === 0 ? 1 : -1) * 45],
                }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.03,
                  ease: "easeInOut",
                }}
                className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-1 rounded shadow-xs"
              >
                {char}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleClick}
        animate={{
          scale: isDevouring ? [1, 0.96, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.4 }}
        disabled={loading || isDevouring}
        className="relative overflow-hidden w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
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