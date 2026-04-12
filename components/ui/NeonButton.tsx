"use client";

import React from "react";

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: "cyan" | "pink" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export function NeonButton({
  children,
  variant = "cyan",
  size = "md",
  onClick,
  className = "",
  disabled = false,
  type = "button",
  fullWidth = false,
}: NeonButtonProps) {
  const variants = {
    cyan: `
      border border-[#00E5FF] text-[#00E5FF]
      hover:bg-[#00E5FF]/10
      shadow-[0_0_10px_rgba(0,229,255,0.3)]
      hover:shadow-[0_0_20px_rgba(0,229,255,0.5),0_0_40px_rgba(0,229,255,0.2)]
    `,
    pink: `
      border border-[#FF007F] text-[#FF007F]
      bg-[#FF007F]/10
      hover:bg-[#FF007F]/20
      shadow-[0_0_15px_rgba(255,0,127,0.4)]
      hover:shadow-[0_0_25px_rgba(255,0,127,0.6),0_0_50px_rgba(255,0,127,0.2)]
    `,
    ghost: `
      border border-white/10 text-white/70
      hover:bg-white/5 hover:border-white/20
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-8 py-3.5 text-base rounded-xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-semibold tracking-wide
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
