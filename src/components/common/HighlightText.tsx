"use client";

import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  highlightClassName?: string;
}

export default function HighlightText({
  text,
  query,
  highlightClassName = "bg-amber-100 text-amber-900 rounded-xs px-0.5 font-bold",
}: HighlightTextProps) {
  if (!query || !query.trim()) {
    return <>{text}</>;
  }

  // Escape special regex characters in the query
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}