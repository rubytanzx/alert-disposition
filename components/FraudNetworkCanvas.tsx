"use client";
import { useEffect, useRef } from "react";
import type React from "react";
import DotField from "./DotField";

export interface FraudNode {
  label:        string;
  sublabel?:    string;
  risk:         "critical" | "high" | "medium" | "low";
  nodeType?:    "attribute" | "person";
  attrIcon?:    "name" | "dob" | "id" | "address" | "bank" | "news" | "source";
  matchScore?:  number;
  matchFields?: { field: string; customer: string; watchlist: string; match: boolean }[];
  matchedAttributeIndices?: number[];
  connectedTo?: number[];
  isDisposed?:    boolean;  // disposition was explicitly submitted for this node
  isTrueHit?:     boolean;  // submitted as true-hit (stays at full opacity)
  isForcedAuto?:  boolean;  // moved to ring 3 after a true-hit was submitted on another node
  isLoading?:     boolean;  // skeleton placeholder
}

interface Props {
  centerLabel:       string;
  centerSublabel?:   string;
  nodes:             FraudNode[];
  dark?:             boolean;
  className?:        string;
  style?:            React.CSSProperties;
  onNodeClick?:      (node: FraudNode) => void;
  selectedNodeLabel?: string;
  controlsRight?:    number;
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawAttrIcon(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, color: string) {
  ctx.save();
  ctx.fillStyle   = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.3;
  ctx.lineCap     = "round";

  switch (type) {
    case "name": {
      // Head + shoulders silhouette
      ctx.beginPath(); ctx.arc(x, y - 2.8, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + 4.5, 4.2, Math.PI, Math.PI * 2); ctx.fill();
      break;
    }
    case "dob": {
      // Calendar rectangle
      roundRect(ctx, x - 4.5, y - 3.5, 9, 8, 1.5); ctx.stroke();
      ctx.fillRect(x - 4.5, y - 5.5, 9, 3); // top bar
      // Grid dots
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x - 2.5, y - 0.5, 2, 1.8);
      ctx.fillRect(x + 0.5, y - 0.5, 2, 1.8);
      ctx.fillRect(x - 2.5, y + 2, 2, 1.8);
      break;
    }
    case "id": {
      // ID card
      roundRect(ctx, x - 5, y - 3.5, 10, 7, 1.5); ctx.stroke();
      ctx.fillRect(x - 3.5, y - 2, 3, 2.5); // photo box
      ctx.fillRect(x + 0.5, y - 1.8, 3, 1.2);
      ctx.fillRect(x + 0.5, y + 0.2, 2.2, 1.2);
      break;
    }
    case "address": {
      // Location pin
      ctx.beginPath(); ctx.arc(x, y - 2.2, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 1.8, y);
      ctx.lineTo(x, y + 5.5);
      ctx.lineTo(x + 1.8, y);
      ctx.closePath(); ctx.fill();
      // Inner dot
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.arc(x, y - 2.2, 1.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "bank": {
      roundRect(ctx, x - 5, y - 3.5, 10, 7, 1.5); ctx.stroke();
      ctx.fillRect(x - 5, y - 0.8, 10, 2.2);
      ctx.fillRect(x - 3.5, y + 2, 2.5, 1);
      break;
    }
    case "news": {
      // Newspaper / article icon
      roundRect(ctx, x - 5, y - 4, 10, 8.5, 1.2); ctx.stroke();
      ctx.fillRect(x - 3.5, y - 2.5, 4, 1.2);
      ctx.fillRect(x - 3.5, y + 0.2, 7, 1);
      ctx.fillRect(x - 3.5, y + 2.2, 5.5, 1);
      break;
    }
    case "source": {
      // Chain-link / URL icon — two overlapping circles with gap
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(x - 2.2, y, 3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 2.2, y, 3, 0, Math.PI * 2); ctx.stroke();
      ctx.clearRect(x - 0.8, y - 3.5, 1.6, 7);
      break;
    }
  }
  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function FraudNetworkCanvas({
  centerLabel, centerSublabel, nodes, dark = true, className = "", style, onNodeClick, selectedNodeLabel, controlsRight = 16,
}: Props) {
  const containerRef       = useRef<HTMLDivElement>(null);
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const rafRef             = useRef(0);
  const progRef            = useRef(0);
  const timeRef            = useRef(0);
  const hoveredIdxRef      = useRef(-1);
  const selectedPersonRef  = useRef(-1);   // internal selection for attr-glow
  const drawRef            = useRef<(prog: number) => void>(() => {});
  const zoomRef            = useRef(1);
  const panRef             = useRef({ x: 0, y: 0 });
  const dragRef            = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const nodeDragRef        = useRef<{ nodeIdx: number; startCx: number; startCy: number } | null>(null);
  const nodeOverridesRef   = useRef<Map<number, { x: number; y: number }>>(new Map());
  const hasDraggedRef      = useRef(false);
  const onNodeClickRef     = useRef(onNodeClick);
  onNodeClickRef.current   = onNodeClick;
  const posRef             = useRef<{ x: number; y: number }[]>([]);
  const prevPosRef         = useRef<{ x: number; y: number }[]>([]);
  const layoutTransRef     = useRef(1); // 0→1 ease for layout transitions
  const prevNodeCountRef   = useRef(-1);
  const prevCenterLabelRef = useRef("");
  const revealRef          = useRef(1);
  const nodesRef           = useRef<FraudNode[]>(nodes);
  const attrOwnersRef      = useRef<Map<number, number>>(new Map());
  const attrAllOwnersRef   = useRef<Map<number, number[]>>(new Map());
  const hasAttrNodesRef    = useRef(false);

  const zoomIn    = () => { zoomRef.current = Math.min(6, zoomRef.current * 1.25);   drawRef.current(progRef.current); };
  const zoomOut   = () => { zoomRef.current = Math.max(0.2, zoomRef.current / 1.25); drawRef.current(progRef.current); };
  const resetView = () => { zoomRef.current = 1; panRef.current = { x: 0, y: 0 };    drawRef.current(progRef.current); };

  // Lightweight effect: updates nodesRef + ownership maps + handles case reset.
  // Does NOT touch the canvas or RAF loop — those only re-run on centerLabel/dark change.
  useEffect(() => {
    nodesRef.current = nodes;

    const ao  = new Map<number, number>();
    const aao = new Map<number, number[]>();
    nodes.forEach((n, personIdx) => {
      if (n.nodeType === "attribute") return;
      (n.matchedAttributeIndices ?? []).forEach(attrIdx => {
        if (!ao.has(attrIdx)) ao.set(attrIdx, personIdx);
        if (!aao.has(attrIdx)) aao.set(attrIdx, []);
        aao.get(attrIdx)!.push(personIdx);
      });
    });
    attrOwnersRef.current    = ao;
    attrAllOwnersRef.current = aao;
    hasAttrNodesRef.current  = nodes.some(n => n.nodeType === "attribute");

    const caseChanged = centerLabel !== prevCenterLabelRef.current;
    prevCenterLabelRef.current = centerLabel;
    prevNodeCountRef.current   = nodes.length;

    if (caseChanged) {
      prevPosRef.current     = [...posRef.current];
      layoutTransRef.current = posRef.current.length > 0 ? 0 : 1;
      progRef.current        = 0;
      revealRef.current      = 1;
      nodeOverridesRef.current.clear();
      zoomRef.current        = 1;
      panRef.current         = { x: 0, y: 0 };
      timeRef.current        = 0;
      hoveredIdxRef.current  = -1;
    }

    selectedPersonRef.current = -1;
    if (selectedNodeLabel) {
      const idx = nodes.findIndex(n => n.label === selectedNodeLabel);
      if (idx >= 0) selectedPersonRef.current = idx;
    }

    drawRef.current(progRef.current);
  }, [nodes, centerLabel, selectedNodeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {

    const container = containerRef.current!;
    const canvas    = canvasRef.current!;
    if (!container || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    const resize = () => {
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    // Shared ring radii — derived from container size, used by both getPositions & draw
    const getRings = () => {
      const outerR = Math.min(w * 0.38, h * 0.38);
      return { outerR, highR: outerR * 0.60, critR: outerR * 0.31, ring4R: outerR * 1.28, newsR: outerR * 1.55 };
    };

    // Returns a set of angles for `count` nodes using a top-centred arc that
    // progressively widens to a full circle as count grows.
    // Ordering: first node at 12 o'clock, subsequent nodes alternate left/right.
    const getArcAngles = (count: number): number[] => {
      if (count === 0) return [];
      if (count === 1) return [-(Math.PI / 2)];

      const spreadDeg =
        count === 2 ?  60 :
        count === 3 ? 100 :
        count === 4 ? 140 :
        count === 5 ? 180 :
        count === 6 ? 220 :
        count === 7 ? 260 :
        count === 8 ? 300 : 360;

      if (spreadDeg >= 360) {
        // Full circle — evenly spaced, first node anchored at 12 o'clock
        return Array.from({ length: count }, (_, k) =>
          -(Math.PI / 2) + (Math.PI * 2 / count) * k
        );
      }

      const spread  = spreadDeg * (Math.PI / 180);
      const angStep = spread / (count - 1);

      // Position sequence centred on 0 (= 12 o'clock): 0, −1, +1, −2, +2, …
      const positions: number[] = [0];
      for (let i = 1; positions.length < count; i++) {
        positions.push(-i);
        if (positions.length < count) positions.push(i);
      }

      return positions.map(p => -(Math.PI / 2) + p * angStep);
    };

    const getPositions = () => {
      const nodes = nodesRef.current;
      const attrOwners = attrOwnersRef.current;
      const cx = w * 0.50;
      const cy = h * 0.60;
      const { outerR, highR, ring4R, newsR } = getRings();
      const primaryR   = highR;
      const secondaryR = outerR;

      const attrIdx      = nodes.map((nd, i) => nd.nodeType === "attribute" ? i : -1).filter(i => i >= 0);
      const primaryIdx   = nodes.map((nd, i) => (nd.risk === "critical" || nd.risk === "high") && !nd.isForcedAuto && nd.nodeType !== "attribute" ? i : -1).filter(i => i >= 0);
      const secondaryIdx = nodes.map((nd, i) => ((nd.risk === "medium" || nd.risk === "low") || !!nd.isForcedAuto) && nd.nodeType !== "attribute" ? i : -1).filter(i => i >= 0);

      const primAngles = getArcAngles(primaryIdx.length);

      const finalPos = new Array<{ x: number; y: number }>(nodes.length);

      // Primary nodes: fixed arc positions (unchanged)
      primaryIdx.forEach((nodeIdx, k) => {
        const a = primAngles[k] ?? -(Math.PI / 2);
        finalPos[nodeIdx] = { x: cx + Math.cos(a) * primaryR, y: cy + Math.sin(a) * primaryR };
      });

      // Grey nodes: interpolate into the angular gaps between adjacent primary nodes.
      // sortedAngles = primary angles in ascending order → defines the gaps.
      if (secondaryIdx.length > 0 && primAngles.length > 0) {
        const sorted = [...primAngles].sort((a, b) => a - b);
        // Build gap list; for a full horseshoe (no wrap) use only interior gaps.
        const isCircle = primaryIdx.length >= 9;
        const gaps: [number, number][] = [];
        for (let i = 0; i < sorted.length - 1; i++) gaps.push([sorted[i], sorted[i + 1]]);
        if (isCircle) gaps.push([sorted[sorted.length - 1], sorted[0] + Math.PI * 2]);

        // Distribute grey nodes round-robin across gaps (1 per gap, cycling)
        const gapCounts = new Array(gaps.length).fill(0);
        secondaryIdx.forEach((_, j) => { gapCounts[j % gaps.length]++; });

        let gi = 0;
        gaps.forEach(([start, end], g) => {
          for (let j = 0; j < gapCounts[g]; j++) {
            const step = (end - start) / (gapCounts[g] + 1);
            const a = start + step * (j + 1);
            finalPos[secondaryIdx[gi]] = { x: cx + Math.cos(a) * secondaryR, y: cy + Math.sin(a) * secondaryR };
            gi++;
          }
        });
      }

      // Identity attrs: bottom-half arc centred at 6 o'clock
      const identityAttrIdx = attrIdx.filter(i => {
        const icon = nodes[i].attrIcon;
        return icon !== "source" && icon !== "news";
      });
      if (identityAttrIdx.length > 0) {
        const attrR     = outerR * 0.78;
        const spread    = Math.PI * 0.72;
        const attrStart = Math.PI / 2 - spread / 2;
        identityAttrIdx.forEach((nodeIdx, k) => {
          const t2 = identityAttrIdx.length === 1 ? 0.5 : k / (identityAttrIdx.length - 1);
          const a  = attrStart + t2 * spread;
          finalPos[nodeIdx] = { x: cx + Math.cos(a) * attrR, y: cy + Math.sin(a) * attrR };
        });
      }

      // Source/news attrs: fanned around their owner person node
      const placeOuterGroup = (indices: number[], r: number) => {
        if (indices.length === 0) return;
        const byOwner = new Map<number, number[]>();
        indices.forEach(nodeIdx => {
          const ownerIdx = attrOwners.get(nodeIdx) ?? -1;
          if (!byOwner.has(ownerIdx)) byOwner.set(ownerIdx, []);
          byOwner.get(ownerIdx)!.push(nodeIdx);
        });
        byOwner.forEach((nodeIndices, ownerIdx) => {
          const ownerPos  = ownerIdx >= 0 ? finalPos[ownerIdx] : null;
          const baseAngle = ownerPos ? Math.atan2(ownerPos.y - cy, ownerPos.x - cx) : -(Math.PI / 2);
          const count     = nodeIndices.length;
          const fanSpread = count <= 1 ? 0 : Math.min(Math.PI * 0.42, count * 0.22);
          nodeIndices.forEach((nodeIdx, k) => {
            const offset = count <= 1 ? 0 : -fanSpread / 2 + k * fanSpread / (count - 1);
            finalPos[nodeIdx] = { x: cx + Math.cos(baseAngle + offset) * r, y: cy + Math.sin(baseAngle + offset) * r };
          });
        });
      };
      placeOuterGroup(attrIdx.filter(i => nodes[i].attrIcon === "source"), ring4R);
      placeOuterGroup(attrIdx.filter(i => nodes[i].attrIcon === "news"),   newsR);

      // Smooth transition from previous layout (ease-in-out quad)
      const t    = layoutTransRef.current;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      if (ease >= 1) return finalPos;

      const prev = prevPosRef.current;
      return finalPos.map((fp, i) => {
        const pp = prev[i] ?? { x: cx, y: cy };
        return {
          x: pp.x + (fp.x - pp.x) * ease,
          y: pp.y + (fp.y - pp.y) * ease,
        };
      });
    };

    const hasAttrNodes = hasAttrNodesRef.current;

    const draw = (prog: number) => {
      const nodes        = nodesRef.current;
      const attrOwners    = attrOwnersRef.current;
      const attrAllOwners = attrAllOwnersRef.current;
      const ctx    = canvas.getContext("2d")!;
      const time   = timeRef.current;
      const reveal = revealRef.current;  // 0→1 during skeleton→real transition
      const hovIdx = hoveredIdxRef.current;
      const selIdx = selectedPersonRef.current;
      const selNode = selIdx >= 0 ? nodes[selIdx] : null;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      ctx.translate(w / 2 + panRef.current.x, h / 2 + panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.translate(-w / 2, -h / 2);

      const n  = nodes.length;
      const cx = w * 0.50;
      const cy = h * 0.60;
      const pos = getPositions();
      // Apply user-dragged overrides
      nodeOverridesRef.current.forEach((op, idx) => { if (pos[idx]) pos[idx] = op; });
      posRef.current = pos;

      const riskColor = (risk: string) =>
        risk === "critical" ? "#ef4444"
        : risk === "high"   ? "#f59e0b"
        : "#6b7280";

      const isAutoDisposed = (nd: FraudNode) => nd.risk === "medium" || nd.risk === "low" || !!nd.isForcedAuto;

      // ── Ring circles ─────────────────────────────────────────────────────────
      const { outerR, highR, critR, ring4R, newsR } = getRings();
      const allLoading = nodes.length > 0 && nodes.every(nd => nd.isLoading);
      const ringFade = allLoading ? 0 : Math.max(0, Math.min(1, (prog - 0.2) / 0.4)) * reveal;
      if (ringFade > 0) {
        const rings = [
          { r: critR,  color: "#ef4444" },
          { r: highR,  color: "#f59e0b" },
          { r: outerR, color: "#6b7280" },
          { r: ring4R, color: "#4ade80" },
          { r: newsR,  color: "#fb923c" },
        ];
        rings.forEach(({ r, color }) => {
          ctx.save();
          ctx.globalAlpha = ringFade * 0.18;
          ctx.setLineDash([3, 9]);
          ctx.strokeStyle = color;
          ctx.lineWidth   = 0.6;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
      }

      // ── Lines ────────────────────────────────────────────────────────────────
      pos.forEach((p, i) => {
        const lp = Math.max(0, Math.min(1, prog * 1.6 - (i / n) * 0.5));
        if (lp <= 0) return;
        const node      = nodes[i];
        if (node.isLoading) return; // no lines during skeleton loading state
        const rlp = lp * reveal;   // revealed lp — drives line endpoint + alpha during reveal
        const isAttr    = node.nodeType === "attribute";
        const isOuterAttr   = isAttr && (node.attrIcon === "source" || node.attrIcon === "news");
        const outerOwnerIdx = isOuterAttr ? attrOwners.get(i) : undefined;
        const outerOwnerDisposed = outerOwnerIdx !== undefined
          ? ((nodes[outerOwnerIdx]?.isDisposed && !nodes[outerOwnerIdx]?.isTrueHit) ?? false)
          : false;
        const auto      = isAutoDisposed(node);
        const isHovered = i === hovIdx;

        // Per-node match state (used for both line and node rendering)
        const attrMatched = isAttr && selNode && !outerOwnerDisposed
          ? (selNode.matchedAttributeIndices ?? []).includes(i)
          : false;

        // Line alpha — forced-auto nodes keep their lines visible regardless of selection
        let lineAlpha = 1;
        if (selNode && !isAttr && i !== selIdx && !node.isForcedAuto) lineAlpha = 0.45;
        if (selNode && isAttr && !attrMatched)  lineAlpha = 0.45;
        if (!isAttr && node.isDisposed && !node.isTrueHit) lineAlpha *= 0.30;
        if (isOuterAttr && outerOwnerDisposed)  lineAlpha = 0.10;

        ctx.save();

        if (isAttr && isOuterAttr) {
          // ── Outer attr lines: draw from each owner person position ──
          const owners = attrAllOwners.get(i) ?? [];
          const drawFrom = owners.length > 0 ? owners : (outerOwnerIdx !== undefined ? [outerOwnerIdx] : []);
          drawFrom.forEach(ownerIdx => {
            const ownerPos = pos[ownerIdx];
            if (!ownerPos) return;
            const ownerLP = Math.max(0, Math.min(1, prog * 1.6 - (ownerIdx / n) * 0.5)) * reveal;
            const ex2 = ownerPos.x + (p.x - ownerPos.x) * rlp;
            const ey2 = ownerPos.y + (p.y - ownerPos.y) * rlp;
            const outerTint = node.attrIcon === "source" ? "#4ade80" : "#fb923c";
            ctx.globalAlpha = Math.min(rlp, ownerLP) * lineAlpha;
            ctx.setLineDash([]);
            ctx.strokeStyle = dark ? outerTint + "66" : outerTint + "77";
            ctx.lineWidth   = 1.0;
            ctx.beginPath(); ctx.moveTo(ownerPos.x, ownerPos.y); ctx.lineTo(ex2, ey2); ctx.stroke();
          });

          // Beam from selected person to this outer attr
          if (attrMatched && lp >= 1 && selIdx >= 0) {
            const selPos = pos[selIdx];
            if (selPos) {
              const bColor  = riskColor(selNode!.risk);
              const beamT   = (time * 0.55) % 1;
              const halfLen = 0.22;
              const t0 = Math.max(0, beamT - halfLen);
              const t1 = Math.min(1, beamT + halfLen);
              const bx0 = selPos.x + (p.x - selPos.x) * t0, by0 = selPos.y + (p.y - selPos.y) * t0;
              const bx1 = selPos.x + (p.x - selPos.x) * t1, by1 = selPos.y + (p.y - selPos.y) * t1;
              const bhx = selPos.x + (p.x - selPos.x) * Math.min(1, beamT + halfLen * 0.6);
              const bhy = selPos.y + (p.y - selPos.y) * Math.min(1, beamT + halfLen * 0.6);
              const beamGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
              beamGrad.addColorStop(0,   bColor + "00");
              beamGrad.addColorStop(0.4, bColor + "bb");
              beamGrad.addColorStop(0.7, bColor + "ff");
              beamGrad.addColorStop(1,   bColor + "44");
              ctx.globalAlpha = 1;
              ctx.lineWidth = 2; ctx.strokeStyle = beamGrad;
              ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.stroke();
              ctx.beginPath(); ctx.arc(bhx, bhy, 2.2, 0, Math.PI * 2);
              ctx.fillStyle = bColor + "dd"; ctx.fill();
              const dotGlow = ctx.createRadialGradient(bhx, bhy, 0, bhx, bhy, 7);
              dotGlow.addColorStop(0, bColor + "55"); dotGlow.addColorStop(1, bColor + "00");
              ctx.beginPath(); ctx.arc(bhx, bhy, 7, 0, Math.PI * 2);
              ctx.fillStyle = dotGlow; ctx.fill();
            }
          }
        } else if (isAttr) {
          // ── Identity attr lines: from center ──
          const ex = cx + (p.x - cx) * rlp;
          const ey = cy + (p.y - cy) * rlp;
          ctx.globalAlpha = rlp * lineAlpha;
          ctx.setLineDash([]);
          ctx.strokeStyle = dark ? "rgba(99,102,241,0.75)" : "rgba(99,102,241,0.80)";
          ctx.lineWidth   = 1.2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();

          if (attrMatched && lp >= 1) {
            const bColor  = riskColor(selNode!.risk);
            const beamT   = (time * 0.55) % 1;
            const halfLen = 0.22;
            const t0 = Math.max(0, beamT - halfLen);
            const t1 = Math.min(1, beamT + halfLen);
            const bx0 = cx + (p.x - cx) * t0, by0 = cy + (p.y - cy) * t0;
            const bx1 = cx + (p.x - cx) * t1, by1 = cy + (p.y - cy) * t1;
            const bhx = cx + (p.x - cx) * Math.min(1, beamT + halfLen * 0.6);
            const bhy = cy + (p.y - cy) * Math.min(1, beamT + halfLen * 0.6);
            const beamGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
            beamGrad.addColorStop(0,   bColor + "00");
            beamGrad.addColorStop(0.4, bColor + "bb");
            beamGrad.addColorStop(0.7, bColor + "ff");
            beamGrad.addColorStop(1,   bColor + "44");
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2; ctx.strokeStyle = beamGrad;
            ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.stroke();
            ctx.beginPath(); ctx.arc(bhx, bhy, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = bColor + "dd"; ctx.fill();
            const dotGlow = ctx.createRadialGradient(bhx, bhy, 0, bhx, bhy, 7);
            dotGlow.addColorStop(0, bColor + "55"); dotGlow.addColorStop(1, bColor + "00");
            ctx.beginPath(); ctx.arc(bhx, bhy, 7, 0, Math.PI * 2);
            ctx.fillStyle = dotGlow; ctx.fill();
          }
        } else if (!isAttr && node.isLoading) {
          // ── Skeleton person: faint pulsing dashed spoke ──
          const ex = cx + (p.x - cx) * lp, ey = cy + (p.y - cy) * lp;
          const sk = (Math.sin(timeRef.current * 2.4 + i * 0.7) + 1) / 2;
          ctx.globalAlpha = lp * (0.12 + sk * 0.14);
          ctx.setLineDash([3, 7]);
          ctx.strokeStyle = dark ? "rgba(129,140,248,0.90)" : "rgba(99,102,241,0.70)";
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
        } else if (!isAttr && auto) {
          // ── Auto-disposed person: faint dotted spoke ──
          const ex = cx + (p.x - cx) * rlp, ey = cy + (p.y - cy) * rlp;
          ctx.globalAlpha = rlp * lineAlpha;
          ctx.setLineDash(isHovered ? [4, 5] : [3, 6]);
          ctx.lineDashOffset = isHovered ? -(time * 18) : 0;
          ctx.strokeStyle = isHovered
            ? (dark ? "rgba(156,163,175,0.90)" : "rgba(99,102,241,0.85)")
            : (dark ? "rgba(156,163,175,0.50)" : "rgba(99,102,241,0.55)");
          ctx.lineWidth = isHovered ? 1.1 : 0.9;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
        } else {
          // ── Critical / high: very faint solid spoke, risk-tinted ──
          const ex = cx + (p.x - cx) * rlp, ey = cy + (p.y - cy) * rlp;
          ctx.globalAlpha = rlp * lineAlpha;
          const sColor = riskColor(node.risk);
          const isActive = isHovered || i === selIdx;
          ctx.setLineDash([]);
          ctx.strokeStyle = isActive ? sColor + "ee" : sColor + "99";
          ctx.lineWidth = isActive ? 1.5 : 1.1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();

          // Beam on hover or selection (person nodes only)
          if (isActive && lp >= 1) {
            const bColor  = riskColor(node.risk);
            const beamT   = (time * 0.55) % 1;
            const halfLen = 0.22;
            const t0 = Math.max(0, beamT - halfLen);
            const t1 = Math.min(1, beamT + halfLen);
            const bx0 = cx + (p.x - cx) * t0, by0 = cy + (p.y - cy) * t0;
            const bx1 = cx + (p.x - cx) * t1, by1 = cy + (p.y - cy) * t1;
            const bhx = cx + (p.x - cx) * Math.min(1, beamT + halfLen * 0.6);
            const bhy = cy + (p.y - cy) * Math.min(1, beamT + halfLen * 0.6);
            const beamGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
            beamGrad.addColorStop(0,   bColor + "00");
            beamGrad.addColorStop(0.4, bColor + "bb");
            beamGrad.addColorStop(0.7, bColor + "ff");
            beamGrad.addColorStop(1,   bColor + "44");
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 2; ctx.strokeStyle = beamGrad;
            ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.stroke();
            ctx.beginPath(); ctx.arc(bhx, bhy, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = bColor + "dd"; ctx.fill();
            const dotGlow = ctx.createRadialGradient(bhx, bhy, 0, bhx, bhy, 7);
            dotGlow.addColorStop(0, bColor + "55"); dotGlow.addColorStop(1, bColor + "00");
            ctx.beginPath(); ctx.arc(bhx, bhy, 7, 0, Math.PI * 2);
            ctx.fillStyle = dotGlow; ctx.fill();
          }
        }


        ctx.restore();
      });

      // ── Inter-node edges (connectedTo network) ───────────────────────────────
      const edgeFade = Math.max(0, Math.min(1, (prog - 0.55) / 0.25));
      const anyLoading = nodes.some(nd => nd.isLoading);
      if (edgeFade > 0 && !anyLoading) {
        const drawn = new Set<string>();
        pos.forEach((p, i) => {
          (nodes[i].connectedTo ?? []).forEach(j => {
            const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
            if (drawn.has(key) || !pos[j]) return;
            drawn.add(key);
            const q       = pos[j];
            const isHov   = i === hovIdx || j === hovIdx;
            const dimmed  = !!selNode;
            ctx.save();
            ctx.globalAlpha = edgeFade * (dimmed ? 0.30 : isHov ? 0.80 : 0.55);
            ctx.setLineDash([3, 5]);
            if (isHov) ctx.lineDashOffset = -(time * 22);
            ctx.lineWidth   = isHov ? 1.0 : 0.65;
            ctx.strokeStyle = dark ? "rgba(255,255,255,0.80)" : "rgba(99,102,241,0.80)";
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            ctx.restore();
          });
        });
      }

      // ── Nodes ─────────────────────────────────────────────────────────────────
      pos.forEach((p, i) => {
        const np = Math.max(0, Math.min(1, prog * 2.2 - 0.6 - (i / n) * 0.4));
        if (np <= 0) return;
        const node   = nodes[i];
        const risk   = node.risk;
        const auto   = isAutoDisposed(node);
        const isAttr = node.nodeType === "attribute";

        const isOuterAttrN    = isAttr && (node.attrIcon === "source" || node.attrIcon === "news");
        const outerOwnerIdxN  = isOuterAttrN ? attrOwners.get(i) : undefined;
        const outerOwnerDisposedN = outerOwnerIdxN !== undefined
          ? ((nodes[outerOwnerIdxN]?.isDisposed && !nodes[outerOwnerIdxN]?.isTrueHit) ?? false)
          : false;

        // Opacity: dim non-selected person nodes when a selection exists
        let nodeAlpha = np;
        // Forced-auto nodes stay visible regardless of selection — don't apply selection dimming
        if (selNode && !isAttr && i !== selIdx && !node.isForcedAuto) nodeAlpha = np * 0.50;
        if (selNode && isAttr) {
          const matched = (selNode.matchedAttributeIndices ?? []).includes(i);
          if (!matched) nodeAlpha = np * 0.30;
        }
        if (!isAttr && node.isDisposed && !node.isTrueHit) nodeAlpha *= 0.55;
        if (isOuterAttrN && outerOwnerDisposedN) nodeAlpha = np * 0.15;
        ctx.globalAlpha = nodeAlpha;

        if (isAttr && node.isLoading) {
          // ── Skeleton placeholder attr node ───────────────────────────────────
          const pillW = 100, hh = 16, cr = 9;
          const x0 = p.x - pillW / 2, y0 = p.y - hh;
          const shimmer = (Math.sin(time * 2.4 + i * 1.1) + 1) / 2;
          roundRect(ctx, x0, y0, pillW, hh * 2, cr);
          const grad = ctx.createLinearGradient(x0, 0, x0 + pillW, 0);
          const lo = dark ? "rgba(129,140,248,0.07)" : "rgba(129,140,248,0.05)";
          const hi = dark ? "rgba(192,132,252,0.20)" : "rgba(192,132,252,0.13)";
          grad.addColorStop(Math.max(0, shimmer - 0.35), lo);
          grad.addColorStop(shimmer, hi);
          grad.addColorStop(Math.min(1, shimmer + 0.35), lo);
          ctx.fillStyle = grad; ctx.fill();
          roundRect(ctx, x0, y0, pillW, hh * 2, cr);
          ctx.strokeStyle = dark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.10)";
          ctx.lineWidth = 1; ctx.stroke();
        } else if (isAttr) {
          // ── Redesigned attribute node (dynamic width) ────────────────────────
          const iconKey = node.attrIcon ?? "id";

          // Measure text to size the pill correctly
          ctx.font = "bold 9px -apple-system,system-ui,sans-serif";
          const labelW = ctx.measureText(node.label).width;
          ctx.font = "8px -apple-system,system-ui,sans-serif";
          const subW = node.sublabel ? ctx.measureText(node.sublabel).width : 0;

          const iconAreaW = 38;  // left pad + icon circle + gap
          const rightPad  = 12;
          const pillW     = iconAreaW + Math.max(labelW, subW) + rightPad;
          const hh = 16, cr = 9;
          const x0 = p.x - pillW / 2, y0 = p.y - hh;

          // Determine colors based on selection state
          const matched = selNode ? (selNode.matchedAttributeIndices ?? []).includes(i) : false;
          const glowC   = matched ? riskColor(selNode!.risk) : null;

          const iconTints: Record<string, string> = {
            name:    "#818cf8",
            dob:     "#a78bfa",
            id:      "#60a5fa",
            address: "#2dd4bf",
            bank:    "#fbbf24",
            news:    "#fb923c",
            source:  "#4ade80",
          };
          const baseTint   = iconTints[iconKey] ?? "#818cf8";
          const activeTint = glowC ?? baseTint;

          const pillBg     = dark ? "rgba(14,12,30,0.90)" : "rgba(247,245,255,0.94)";
          const pillBorder = glowC
            ? glowC
            : (dark ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.22)");
          const iconBg = glowC
            ? glowC + "38"
            : (dark ? baseTint + "22" : baseTint + "18");
          const iconFg = dark ? activeTint + "ee" : activeTint + "cc";

          const drawPill = () => { roundRect(ctx, x0, y0, pillW, hh * 2, cr); };

          // Glow on match
          if (glowC) {
            ctx.save();
            ctx.shadowColor = glowC;
            ctx.shadowBlur  = 18;
            drawPill();
            ctx.fillStyle = "transparent"; ctx.fill();
            ctx.restore();
          }

          drawPill(); ctx.fillStyle = pillBg; ctx.fill();
          drawPill(); ctx.strokeStyle = pillBorder; ctx.lineWidth = glowC ? 1.5 : 1; ctx.stroke();

          // Icon circle
          const iconCx = x0 + 20, iconCy = p.y;
          ctx.beginPath(); ctx.arc(iconCx, iconCy, 10, 0, Math.PI * 2);
          ctx.fillStyle = iconBg; ctx.fill();

          ctx.globalAlpha = nodeAlpha * 0.9;
          drawAttrIcon(ctx, iconCx, iconCy, iconKey, iconFg);
          ctx.globalAlpha = nodeAlpha;

          // Label
          const textX = x0 + iconAreaW;
          ctx.font      = "bold 9px -apple-system,system-ui,sans-serif";
          ctx.fillStyle = glowC
            ? (dark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.90)")
            : (dark ? "rgba(255,255,255,0.80)" : "rgba(30,20,70,0.80)");
          ctx.textAlign    = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, textX, p.y - 4.5);

          // Sublabel
          ctx.font      = "8px -apple-system,system-ui,sans-serif";
          ctx.fillStyle = dark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.40)";
          if (node.sublabel) ctx.fillText(node.sublabel, textX, p.y + 7);

        } else if (node.isLoading) {
          // ── Skeleton person node: pulsing indigo ghost circle ────────────────
          const r  = 13;
          const sk = (Math.sin(time * 2.2 + i * 1.1) + 1) / 2;
          // Outer glow ring
          ctx.globalAlpha = nodeAlpha * (0.08 + sk * 0.12);
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = dark ? "rgba(129,140,248,1)" : "rgba(99,102,241,1)";
          ctx.fill();
          // Circle fill
          ctx.globalAlpha = nodeAlpha * (0.06 + sk * 0.10);
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = dark ? "rgba(129,140,248,1)" : "rgba(99,102,241,1)";
          ctx.fill();
          // Circle border shimmer
          ctx.globalAlpha = nodeAlpha * (0.18 + sk * 0.30);
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = dark ? "rgba(129,140,248,1)" : "rgba(99,102,241,1)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.stroke();
        } else {
          // ── Person node ──────────────────────────────────────────────────────
          // Force-auto nodes (pushed to ring 3 after a true-hit) use grey regardless of original risk
          const bColor   = node.isForcedAuto ? "#6b7280" : riskColor(risk);
          const r        = 13;
          const isHov    = i === hovIdx;

          // Forced-auto nodes stay at reasonable visibility; organic auto (med/low) dims more
          if (auto && !isHov && !node.isDisposed) {
            ctx.globalAlpha = nodeAlpha * (node.isForcedAuto ? 0.88 : (dark ? 0.65 : 0.45));
          }

          if (node.isDisposed && !node.isTrueHit) {
            // Actual disposed (non-true-hit): muted circle + checkmark, no glow or selection ring
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = dark ? "rgba(15,13,30,0.88)" : "rgba(248,247,255,0.92)";
            ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = bColor + "40";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([]);
            ctx.stroke();
            // Checkmark icon
            ctx.strokeStyle = dark ? "rgba(255,255,255,0.55)" : "rgba(80,70,130,0.60)";
            ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(p.x - 4, p.y + 0.5);
            ctx.lineTo(p.x - 1, p.y + 3.5);
            ctx.lineTo(p.x + 4.5, p.y - 3.5);
            ctx.stroke();
          } else {
            if (!auto) {
              const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
              glow.addColorStop(0, bColor + "30"); glow.addColorStop(1, bColor + "00");
              ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2);
              ctx.fillStyle = glow; ctx.fill();
            }

            if (i === selIdx) {
              ctx.save();
              ctx.shadowColor = bColor;
              ctx.shadowBlur  = 20;
              ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
              ctx.strokeStyle = bColor; ctx.lineWidth = 3; ctx.stroke();
              ctx.restore();
            }

            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = dark ? "rgba(15,13,30,0.88)" : "rgba(248,247,255,0.92)";
            ctx.fill();

            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = bColor;
            ctx.lineWidth   = 2 + (i === selIdx ? 0.5 : 0);
            ctx.stroke();

            const iconColor = auto
              ? (dark ? "rgba(156,163,175,0.70)" : "rgba(80,80,120,0.60)")
              : (dark ? "rgba(255,255,255,0.88)"  : "rgba(80,70,130,0.85)");
            ctx.fillStyle = iconColor;
            ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.22, r * 0.30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y + r * 0.65, r * 0.48, Math.PI, Math.PI * 2); ctx.fill();
          }

          // Peripheral (disposed) labels: only render on hover; primary labels always visible
          const showLabel = !auto || isHov;
          if (showLabel) {
            const above    = p.y < cy - 30;
            const fontSize = auto ? 9 : 11;
            const subSize  = 9;
            const lineH    = 13;
            // baseline of first line: clear circle edge by 14px above or 16px below
            const ly       = above ? p.y - r - 14 : p.y + r + fontSize + 3;
            const hasSubl  = !!node.sublabel && !auto;

            ctx.font      = auto ? `${fontSize}px -apple-system,system-ui,sans-serif` : `600 ${fontSize}px -apple-system,system-ui,sans-serif`;
            ctx.fillStyle = auto
              ? (dark ? "rgba(156,163,175,0.80)" : "rgba(80,80,100,0.75)")
              : (node.isDisposed && !node.isTrueHit)
                ? (dark ? "rgba(255,255,255,0.45)" : "rgba(20,10,60,0.38)")
                : (dark ? "rgba(255,255,255,0.88)" : "rgba(20,10,60,0.80)");
            ctx.textAlign    = "center";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(node.label, p.x, ly);
            if (hasSubl) {
              ctx.font      = `${subSize}px -apple-system,system-ui,sans-serif`;
              ctx.fillStyle = dark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.38)";
              ctx.fillText(node.sublabel!, p.x, ly + lineH);
            }
          }
        }
        ctx.globalAlpha = 1;
      });

      // ── Centre node ───────────────────────────────────────────────────────────
      const cp     = Math.min(1, prog * 3.5);
      const cColor = "#6366f1";
      const cR     = 20;
      ctx.globalAlpha = cp;

      ctx.beginPath(); ctx.arc(cx, cy, cR + 9, 0, Math.PI * 2);
      ctx.strokeStyle = dark ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.22)";
      ctx.lineWidth = 1; ctx.stroke();

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR * 4.5);
      cg.addColorStop(0, cColor + "55"); cg.addColorStop(0.5, cColor + "1a"); cg.addColorStop(1, cColor + "00");
      ctx.beginPath(); ctx.arc(cx, cy, cR * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill();

      ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2);
      ctx.fillStyle = cColor; ctx.fill();
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.5; ctx.stroke();

      const initials = centerLabel.split(" ").map(ww => ww[0]).join("").slice(0, 2).toUpperCase();
      ctx.font = "bold 10px -apple-system,system-ui,sans-serif";
      ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(initials, cx, cy);
      ctx.textBaseline = "alphabetic";

      ctx.font      = "600 13px -apple-system,system-ui,sans-serif";
      ctx.fillStyle = dark ? "rgba(255,255,255,0.92)" : "rgba(20,10,60,0.85)";
      ctx.fillText(centerLabel, cx, cy + cR + 22);
      if (centerSublabel) {
        ctx.font      = "10px -apple-system,system-ui,sans-serif";
        ctx.fillStyle = dark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.38)";
        ctx.fillText(centerSublabel, cx, cy + cR + 36);
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    drawRef.current = draw;

    const animate = () => {
      if (progRef.current < 1)        progRef.current    = Math.min(1, progRef.current    + 0.016);
      if (layoutTransRef.current < 1) layoutTransRef.current = Math.min(1, layoutTransRef.current + 0.022);
      if (revealRef.current < 1)      revealRef.current  = Math.min(1, revealRef.current  + 0.020); // ~50 frames ≈ 0.8s
      timeRef.current += 0.016;
      draw(progRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect   = container.getBoundingClientRect();
      const sx     = e.clientX - rect.left;
      const sy     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz     = Math.max(0.2, Math.min(6, zoomRef.current * factor));
      const ratio  = nz / zoomRef.current;
      panRef.current = {
        x: sx - w / 2 - (sx - w / 2 - panRef.current.x) * ratio,
        y: sy - h / 2 - (sy - h / 2 - panRef.current.y) * ratio,
      };
      zoomRef.current = nz;
    };

    const toCanvas = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const mx   = clientX - rect.left;
      const my   = clientY - rect.top;
      return {
        x: (mx - w / 2 - panRef.current.x) / zoomRef.current + w / 2,
        y: (my - h / 2 - panRef.current.y) / zoomRef.current + h / 2,
      };
    };

    const hitNode = (cx: number, cy: number, radius = 28) => {
      let idx = -1, best = radius;
      posRef.current.forEach((p, i) => {
        const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        if (d < best) { idx = i; best = d; }
      });
      return idx;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      hasDraggedRef.current = false;
      const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
      const nodeIdx = hitNode(cx, cy, 24);
      if (nodeIdx >= 0) {
        nodeDragRef.current = { nodeIdx, startCx: cx, startCy: cy };
      } else {
        dragRef.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y };
      }
      container.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (nodeDragRef.current) {
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
        const { nodeIdx } = nodeDragRef.current;
        nodeOverridesRef.current.set(nodeIdx, { x: cx, y: cy });
        hasDraggedRef.current = true;
        return;
      }
      if (dragRef.current) {
        panRef.current = {
          x: dragRef.current.px + e.clientX - dragRef.current.sx,
          y: dragRef.current.py + e.clientY - dragRef.current.sy,
        };
        hasDraggedRef.current = true;
        return;
      }
      const { x: canvasX, y: canvasY } = toCanvas(e.clientX, e.clientY);
      let newHover = -1, hitDist = 28;
      posRef.current.forEach((p, i) => {
        const d = Math.sqrt((p.x - canvasX) ** 2 + (p.y - canvasY) ** 2);
        if (d < hitDist) { newHover = i; hitDist = d; }
      });
      if (newHover !== hoveredIdxRef.current) {
        hoveredIdxRef.current = newHover;
        const isClickable = newHover >= 0 && (onNodeClickRef.current || (hasAttrNodes && nodesRef.current[newHover]?.nodeType !== "attribute"));
        container.style.cursor = isClickable ? "pointer" : "grab";
      }
    };

    const onMouseUp = () => {
      nodeDragRef.current = null;
      dragRef.current = null;
      container.style.cursor = "grab";
    };

    const onMouseLeave = () => { hoveredIdxRef.current = -1; };

    const onClick = (e: MouseEvent) => {
      if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
      const { x: canvasX, y: canvasY } = toCanvas(e.clientX, e.clientY);
      const hitIdx = hitNode(canvasX, canvasY, 24);
      const hit: FraudNode | null = hitIdx >= 0 ? nodesRef.current[hitIdx] : null;

      if (hit) {
        if (hasAttrNodes && nodesRef.current[hitIdx]?.nodeType !== "attribute") {
          selectedPersonRef.current = selectedPersonRef.current === hitIdx ? -1 : hitIdx;
        }
        if (onNodeClickRef.current) onNodeClickRef.current(hit);
      } else {
        if (hasAttrNodes) selectedPersonRef.current = -1;
      }
    };

    resize();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(container);

    container.addEventListener("wheel",      onWheel,      { passive: false });
    container.addEventListener("mousedown",  onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("click",      onClick);
    window.addEventListener("mousemove",     onMouseMove);
    window.addEventListener("mouseup",       onMouseUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener("wheel",      onWheel);
      container.removeEventListener("mousedown",  onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("click",      onClick);
      window.removeEventListener("mousemove",     onMouseMove);
      window.removeEventListener("mouseup",       onMouseUp);
    };
  }, [centerLabel, centerSublabel, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  const btnBase: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"}`,
    background: dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.90)",
    color: dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, lineHeight: 1, transition: "background 0.15s, color 0.15s",
  };

  return (
    <div ref={containerRef} className={className}
      style={{ position: "relative", overflow: "hidden", cursor: "grab", ...style }}>
      <DotField
        dotRadius={0.8} dotSpacing={14} bulgeStrength={67} glowRadius={160}
        sparkle={false} waveAmplitude={0} cursorRadius={500} cursorForce={0.1} bulgeOnly
        gradientFrom="#A855F7" gradientTo="#B497CF" glowColor="#120F17"
      />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", top: 16, right: controlsRight, zIndex: 10, display: "flex", flexDirection: "column", gap: 4, transition: "right 0.25s ease" }}>
        <button onClick={zoomIn} style={btnBase} title="Zoom in"
          onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.14)" : "rgba(240,240,255,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.90)")}>+</button>
        <button onClick={zoomOut} style={btnBase} title="Zoom out"
          onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.14)" : "rgba(240,240,255,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.90)")}>−</button>
        <button onClick={resetView} style={{ ...btnBase, fontSize: 14 }} title="Reset view"
          onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.14)" : "rgba(240,240,255,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.90)")}>⟳</button>
      </div>
    </div>
  );
}
