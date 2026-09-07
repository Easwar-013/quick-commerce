'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

export interface CompactStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  className?: string;
}

const digitVariants = {
  initial: (dir: number) => ({
    y: dir > 0 ? 12 : -12,
    opacity: 0,
    scale: 0.6,
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -12 : 12,
    opacity: 0,
    scale: 0.6,
  }),
};

export function CompactStepper({
  value,
  min = 0,
  max = 99,
  onChange,
  className = '',
}: CompactStepperProps) {
  const [direction, setDirection] = React.useState(0);
  const digits = value.toString().split('');

  const [prevDigits, setPrevDigits] = React.useState<string[]>(digits);
  const [prevTicks, setPrevTicks] = React.useState<number[]>([]);

  const len = digits.length;
  const lenDiff = len - prevDigits.length;

  const nextTicks = digits.map((digit, i) => {
    const prevI = i - lenDiff;
    const prevDigit = prevI >= 0 ? prevDigits[prevI] : undefined;
    const prevTick = prevI >= 0 ? prevTicks[prevI] : 0;
    return digit !== prevDigit ? (prevTick ?? 0) + 1 : (prevTick ?? 0);
  });

  if (prevDigits.join('') !== digits.join('')) {
    setPrevTicks(nextTicks);
    setPrevDigits(digits);
  }

  const handleStep = (e: React.MouseEvent, dir: number) => {
    e.stopPropagation();
    const next = Math.min(max, Math.max(min, value + dir));
    if (next === value) return;
    setDirection(dir);
    onChange(next);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center bg-emerald-600 text-white rounded-xl shadow-xs p-0.5 select-none ${className}`}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => handleStep(e, -1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors cursor-pointer"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </motion.button>

      <div className="relative flex items-center justify-center min-w-[22px] px-1 text-xs font-black tracking-tight overflow-hidden h-5">
        {digits.map((digit, index) => (
          <div key={`${index}-${len}`} className="relative w-2.5 h-4">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={nextTicks[index]}
                custom={direction}
                variants={digitVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 24,
                }}
                className="absolute inset-0 flex items-center justify-center tabular-nums"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => handleStep(e, 1)}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-40 cursor-pointer"
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </motion.button>
    </div>
  );
}