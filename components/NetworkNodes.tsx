"use client";
import { useEffect, useRef } from "react";
import type React from "react";
import * as THREE from "three";

export default function NetworkNodes({ className = "", style, dark = true }: { className?: string; style?: React.CSSProperties; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let w = el.clientWidth;
    let h = el.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0, 0);
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const makeCamera = () =>
      new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0, 1);
    let camera = makeCamera();

    // ── Sprite texture — glow (dark) or soft dot (light) ─────────────────
    const sc = document.createElement("canvas");
    sc.width = sc.height = 128;
    const sx = sc.getContext("2d")!;
    const g = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (dark) {
      g.addColorStop(0,    "rgba(255,255,255,1)");
      g.addColorStop(0.08, "rgba(220,235,255,1)");
      g.addColorStop(0.22, "rgba(160,200,255,0.7)");
      g.addColorStop(0.5,  "rgba(100,160,255,0.25)");
      g.addColorStop(1,    "rgba(80,130,255,0)");
    } else {
      // Light mode: flat violet dot, no glow halo
      g.addColorStop(0,    "rgba(139,92,246,1)");     // solid violet-500 core
      g.addColorStop(0.45, "rgba(167,139,250,0.8)");  // violet-400 edge
      g.addColorStop(0.7,  "rgba(196,181,253,0.2)");  // soft fade
      g.addColorStop(1,    "rgba(196,181,253,0)");    // transparent rim
    }
    sx.fillStyle = g;
    sx.fillRect(0, 0, 128, 128);
    const spriteTex = new THREE.CanvasTexture(sc);

    // ── Nodes — uniform grid-jitter scatter across the full canvas ───────
    // Left ~38% is kept sparse (greeting text lives there).
    // Nodes are placed in a regular grid with random jitter so they
    // fill the entire viewport evenly rather than clustering.

    const COLS = 14, ROWS = 9;   // grid resolution
    const allNodes: ReturnType<typeof makeNode>[] = [];

    function makeNode(fracHx: number, fracHy: number, large = false) {
      const hx = fracHx * w;
      const hy = fracHy * h;
      return { x: hx, y: hy, hx, hy, fracHx, fracHy, springK: 0.00015,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        size: large ? 14 : Math.random() < 0.22 ? 9 : 5 };
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Base position with cell-wide jitter
        const jx = (col + 0.1 + Math.random() * 0.8) / COLS;
        const jy = (row + 0.1 + Math.random() * 0.8) / ROWS;

        // Left columns: sparse — drop ~75% of nodes so text area stays clear
        const inTextZone = jx < 0.38;
        if (inTextZone && Math.random() < 0.75) continue;

        const isLarge = Math.random() < 0.09;
        allNodes.push(makeNode(jx, jy, isLarge));
      }
    }

    // Extra accent nodes at the very edges so the graph reaches the corners
    for (let i = 0; i < 12; i++) {
      const edge = Math.floor(Math.random() * 4);
      const t    = Math.random();
      const fx   = edge === 0 ? t : edge === 1 ? t : edge === 2 ? 0 : 1;
      const fy   = edge === 0 ? 0 : edge === 1 ? 1 : t;
      allNodes.push(makeNode(Math.max(0.01, Math.min(0.99, fx)), Math.max(0.01, Math.min(0.99, fy))));
    }

    const heroNodes = allNodes;
    const cardNodes: typeof allNodes = [];

    const nodes = [...heroNodes, ...cardNodes];
    const N = nodes.length;

    // ── Points (one per node, sized individually via separate geometries) ─
    // Group nodes by size bucket for cleaner rendering
    const makePtLayer = (size: number, indices: number[]) => {
      const buf = new Float32Array(indices.length * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(buf, 3));
      const mat = new THREE.PointsMaterial({
        size,
        map: spriteTex,
        transparent: true,
        opacity: dark
          ? (size > 10 ? 1.0 : size > 7 ? 0.9 : 0.8)
          : (size > 10 ? 0.85 : size > 7 ? 0.70 : 0.55),
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: false,
      });
      scene.add(new THREE.Points(geo, mat));
      return { buf, geo, mat, indices };
    };

    const largeIdx  = nodes.map((n, i) => n.size >= 12 ? i : -1).filter(i => i >= 0);
    const medIdx    = nodes.map((n, i) => n.size >= 8 && n.size < 12 ? i : -1).filter(i => i >= 0);
    const smallIdx  = nodes.map((n, i) => n.size < 8 ? i : -1).filter(i => i >= 0);

    const layers = dark
      ? [makePtLayer(22, largeIdx), makePtLayer(13, medIdx), makePtLayer(7, smallIdx)]
      : [makePtLayer(12, largeIdx), makePtLayer(8,  medIdx), makePtLayer(5, smallIdx)];

    // Master position buffer (shared for line lookups)
    const ptBuf = new Float32Array(N * 3);

    // ── Lines with distance-faded alpha via ShaderMaterial ───────────────
    const MAX_SEGS = N * 20;
    const lnPosBuf   = new Float32Array(MAX_SEGS * 6);    // 2 verts × 3 components
    const lnAlphaBuf = new Float32Array(MAX_SEGS * 2);    // 1 alpha per vertex

    const lnGeo = new THREE.BufferGeometry();
    lnGeo.setAttribute("position", new THREE.BufferAttribute(lnPosBuf, 3));
    lnGeo.setAttribute("alpha",    new THREE.BufferAttribute(lnAlphaBuf, 1));

    // Dark: blue-white glowing lines with additive blend
    // Light: flat violet lines with normal blend and lower alpha
    const lineR = dark ? 0.72 : 0.42;
    const lineG = dark ? 0.82 : 0.36;
    const lineB = dark ? 1.0  : 0.88;
    const lineAlphaScale = dark ? 0.45 : 0.38;

    const lnMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(${lineR.toFixed(2)}, ${lineG.toFixed(2)}, ${lineB.toFixed(2)}, vAlpha);
        }
      `,
    });

    scene.add(new THREE.LineSegments(lnGeo, lnMat));

    // ── Mouse ─────────────────────────────────────────────────────────────
    let mx = -9999, my = -9999;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener("mousemove", onMove);

    // ── Resize ────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const newW = el.clientWidth;
      const newH = el.clientHeight;
      const scaleX = newW / w;
      const scaleY = newH / h;
      w = newW;
      h = newH;
      for (const n of nodes) {
        n.x  = n.x  * scaleX;
        n.y  = n.y  * scaleY;
        n.hx = n.fracHx * w;
        n.hy = n.fracHy * h;
      }
      renderer.setSize(w, h);
      camera = makeCamera();
    });
    ro.observe(el);

    // ── Animation ─────────────────────────────────────────────────────────
    const LINK_DIST   = 220;   // px — connection threshold (wider for full-canvas spread)
    const LINK_DIST2  = LINK_DIST * LINK_DIST;

    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      for (let i = 0; i < N; i++) {
        const n = nodes[i];

        // Spring — strength varies per node (hotspot nodes stay put)
        n.vx += (n.hx - n.x) * n.springK;
        n.vy += (n.hy - n.y) * n.springK;

        // Mouse repulsion
        const mdx = n.x - mx, mdy = n.y - my;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 14000 && md2 > 0) {
          const md = Math.sqrt(md2);
          n.vx += (mdx / md) * 0.12;
          n.vy += (mdy / md) * 0.12;
        }

        n.vx *= 0.96;
        n.vy *= 0.96;
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > 1.0) { n.vx = (n.vx / spd); n.vy = (n.vy / spd); }
        if (spd < 0.05) { n.vx += (Math.random() - 0.5) * 0.04; n.vy += (Math.random() - 0.5) * 0.04; }

        n.x = Math.max(0, Math.min(w, n.x + n.vx));
        n.y = Math.max(0, Math.min(h, n.y + n.vy));

        ptBuf[i * 3]     = n.x - w / 2;
        ptBuf[i * 3 + 1] = h / 2 - n.y;
        ptBuf[i * 3 + 2] = 0;
      }

      // Update point layers
      for (const layer of layers) {
        for (let k = 0; k < layer.indices.length; k++) {
          const i = layer.indices[k];
          layer.buf[k * 3]     = ptBuf[i * 3];
          layer.buf[k * 3 + 1] = ptBuf[i * 3 + 1];
          layer.buf[k * 3 + 2] = 0;
        }
        layer.geo.attributes.position.needsUpdate = true;
      }

      // Build distance-faded line segments
      let li = 0;
      for (let i = 0; i < N && li < MAX_SEGS; i++) {
        for (let j = i + 1; j < N && li < MAX_SEGS; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST2) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * lineAlphaScale;
            // vertex A
            lnPosBuf[li * 6]     = ptBuf[i * 3];
            lnPosBuf[li * 6 + 1] = ptBuf[i * 3 + 1];
            lnPosBuf[li * 6 + 2] = 0;
            lnAlphaBuf[li * 2]   = alpha;
            // vertex B
            lnPosBuf[li * 6 + 3] = ptBuf[j * 3];
            lnPosBuf[li * 6 + 4] = ptBuf[j * 3 + 1];
            lnPosBuf[li * 6 + 5] = 0;
            lnAlphaBuf[li * 2 + 1] = alpha;
            li++;
          }
        }
      }

      lnGeo.setDrawRange(0, li * 2);
      (lnGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (lnGeo.attributes.alpha    as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
      for (const l of layers) { l.geo.dispose(); l.mat.dispose(); }
      spriteTex.dispose();
      lnGeo.dispose(); lnMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
    };
  }, [dark]);

  return <div ref={ref} className={className} style={style} />;
}
