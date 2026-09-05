"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SkiperDevouringButtonProps {
  loading: boolean;
  onDevourAndSubmit: () => void;
  textToDevour: string;
  label?: string;
}

export function SkiperDevouringButton({
  loading,
  onDevourAndSubmit,
  textToDevour,
  label = "Sign In",
}: SkiperDevouringButtonProps) {
  const [isDevouring, setIsDevouring] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || isDevouring) return;

    setIsDevouring(true);
    // Trigger submit and clear inputs instantly
    onDevourAndSubmit();

    setTimeout(() => {
      setIsDevouring(false);
    }, 600);
  };

  const letters = textToDevour.slice(0, 18).split("");

  return (
    <div className="relative w-full">
      {/* Devouring Vortex Particles falling into button */}
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
        onClick={handleClick}
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
            <span>{isDevouring ? "Consuming credentials..." : "Authenticating..."}</span>
          </div>
        ) : (
          <span>{label}</span>
        )}
      </motion.button>
    </div>
  );
}