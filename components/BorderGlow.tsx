"use client";
import React from "react";

type BorderGlowProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;      // HSL string e.g. "258 78% 68%"
  backgroundColor?: string;
  borderRadius?: number;
  glowIntensity?: number;
};

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export default function BorderGlow({
  children,
  className = "",
  style,
  glowColor = "258 78% 68%",
  backgroundColor = "#ffffff",
  borderRadius = 12,
  glowIntensity = 1.0,
}: BorderGlowProps) {
  const lightSurface = isLightColor(backgroundColor);

  return (
    <div
      className={`border-glow-card${lightSurface ? " border-glow-card--light" : ""}${className ? ` ${className}` : ""}`}
      style={{
        "--card-bg": backgroundColor,
        "--border-radius": `${borderRadius}px`,
        "--glow-hi": `hsl(${glowColor} / ${glowIntensity.toFixed(2)})`,
        "--glow-mid": `hsl(${glowColor} / ${(glowIntensity * 0.5).toFixed(2)})`,
        "--glow-lo": `hsl(${glowColor} / ${(glowIntensity * 0.15).toFixed(2)})`,
        ...style,
      } as React.CSSProperties}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
