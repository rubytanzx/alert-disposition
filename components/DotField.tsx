"use client";
import { useEffect, useRef } from "react";
import type React from "react";

interface Props {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function lerp3(a: [number,number,number], b: [number,number,number], t: number) {
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)})`;
}

export default function DotField({
  dotRadius    = 1.5,
  dotSpacing   = 14,
  bulgeStrength = 67,
  glowRadius   = 160,
  sparkle      = false,
  waveAmplitude = 0,
  cursorRadius = 500,
  cursorForce  = 0.1,
  bulgeOnly    = false,
  gradientFrom = "#A855F7",
  gradientTo   = "#B497CF",
  glowColor    = "#120F17",
  className    = "",
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mouseRef     = useRef({ x: -99999, y: -99999 });
  const rafRef       = useRef(0);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas    = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    const cA = hexToRgb(gradientFrom);
    const cB = hexToRgb(gradientTo);
    const [gr, gg, gb] = hexToRgb(glowColor);

    const resize = () => {
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const draw = (time: number) => {
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hasMouse = mx > -9999;

      const cols = Math.ceil(w / dotSpacing) + 2;
      const rows = Math.ceil(h / dotSpacing) + 2;
      const offX = (w % dotSpacing) / 2;
      const offY = (h % dotSpacing) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bx = offX + col * dotSpacing;
          const by = offY + row * dotSpacing;

          const wave = waveAmplitude > 0
            ? Math.sin(bx * 0.05 + time * 0.001) * Math.cos(by * 0.045 + time * 0.0008) * waveAmplitude
            : 0;

          let ox = 0, oy = 0;
          if (hasMouse) {
            const dx = bx - mx;
            const dy = by - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cursorRadius && dist > 0.5) {
              const falloff = 1 - dist / cursorRadius;
              const force   = falloff * falloff * bulgeStrength;
              ox = (dx / dist) * force;
              oy = (dy / dist) * force;
            }
          }

          const x = bx + ox;
          const y = by + oy + wave;

          const t = Math.min(1, Math.max(0, (bx / w + by / h) / 2));
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = lerp3(cA, cB, t);
          ctx.globalAlpha = 0.11;
          ctx.fill();
        }
      }

      // Dark glow around cursor
      if (hasMouse && glowRadius > 0) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, glowRadius);
        grd.addColorStop(0, `rgba(${gr},${gg},${gb},0.82)`);
        grd.addColorStop(0.5, `rgba(${gr},${gg},${gb},0.35)`);
        grd.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(mx, my, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -99999, y: -99999 }; };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, [dotRadius, dotSpacing, bulgeStrength, glowRadius, waveAmplitude, cursorRadius, bulgeOnly, gradientFrom, gradientTo, glowColor]);

  return (
    <div ref={containerRef} className={className} style={{ position:"absolute", inset:0, ...style }}>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0 }} />
    </div>
  );
}
