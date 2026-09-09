"use client";
import type React from "react";
import { Sparkles } from "lucide-react";

interface Props {
  onClick?: () => void;
  size?: number;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function BorderBeamButton({ onClick, size = 48, icon, className = "", style }: Props) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        isolation: "isolate",
        padding: 0,
        background: "transparent",
        ...style,
      }}
    >
      {/* Rotating beam ring */}
      <span style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        padding: "1.5px",
        background: "conic-gradient(from var(--beam-angle), transparent 60%, #a855f7 75%, #818cf8 85%, #38bdf8 92%, transparent 100%)",
        animation: "beam-spin 2.4s linear infinite",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      } as React.CSSProperties} />

      {/* Dark inner fill */}
      <span style={{
        position: "absolute",
        inset: 1.5,
        borderRadius: "50%",
        background: "rgba(10, 8, 22, 0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }} />

      {/* Ambient glow */}
      <span style={{
        position: "absolute",
        inset: -4,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(200,180,255,0.9)" }}>
        {icon ?? <Sparkles style={{ width: size * 0.38, height: size * 0.38 }} strokeWidth={1.5} />}
      </span>
    </button>
  );
}
