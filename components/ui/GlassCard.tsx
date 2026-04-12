"use client";

import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "pink" | "none";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  glowColor = "none",
  onClick,
}: GlassCardProps) {
  const glowStyles = {
    cyan: "shadow-[0_0_20px_rgba(0,229,255,0.15)] border-[rgba(0,229,255,0.15)]",
    pink: "shadow-[0_0_20px_rgba(255,0,127,0.15)] border-[rgba(255,0,127,0.15)]",
    none: "border-white/5",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white/[0.02] backdrop-blur-xl border rounded-2xl
        transition-all duration-300
        ${glowColor !== "none" ? glowStyles[glowColor] : glowStyles.none}
        ${onClick ? "cursor-pointer hover:bg-white/[0.04]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
