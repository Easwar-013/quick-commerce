"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const digitVariants: Variants = {
  initial: (dir: number) => ({
    y: dir > 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(2px)",
  }),
  animate: {
    y: "0%",
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    y: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    filter: "blur(2px)",
  }),
};

export function SlidingNumber({
  number,
  className = "",
}: {
  number: number;
  className?: string;
}) {
  const [direction, setDirection] = useState(0);
  const [prevNumber, setPrevNumber] = useState(number);

  useEffect(() => {
    if (number !== prevNumber) {
      setDirection(number > prevNumber ? 1 : -1);
      setPrevNumber(number);
    }
  }, [number, prevNumber]);

  const chars = number.toLocaleString("en-IN").split("");

  return (
    <span className={`inline-flex items-center overflow-hidden tabular-nums ${className}`}>
      {chars.map((char, index) => {
        if (!/\d/.test(char)) {
          return <span key={`sep-${index}`}>{char}</span>;
        }

        return (
          <span key={`digit-${index}`} className="relative inline-block w-[0.62em] h-[1.25em] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={`${char}-${index}`}
                custom={direction}
                variants={digitVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className="absolute inset-0 flex items-center justify-center font-inherit"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}