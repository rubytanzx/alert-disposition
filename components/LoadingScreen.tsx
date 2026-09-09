"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x02000a, 1); // near-black with slight purple cast
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Camera shifted right so the orb sits left-of-centre in frame (Pegasus-style)
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(2.5, 0, 7);

    // All fibers converge here
    const FOCAL = new THREE.Vector3(-1.8, 0, 0);
    const LINES = 300;
    const SEG   = 110;

    // Rich purple-violet palette — no white until the beam
    const palette = [
      0x4a1a8e, 0x6b2fb8, 0x8b44d4, 0xaa66e8,
      0x7b3ab0, 0xc080f0, 0x5533aa, 0xd4a0ff,
    ];

    type LObj = { line: THREE.Line; total: number; delay: number; speed: number };
    const fiberLines: LObj[] = [];

    for (let i = 0; i < LINES; i++) {
      // Full 360° spread, slight vertical squash so it reads as an orb not a sphere
      const theta     = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.65;
      const radius    = 2.8 + Math.random() * 5.5;

      const ex = FOCAL.x + Math.cos(theta) * Math.cos(elevation) * radius;
      const ey = FOCAL.y + Math.sin(elevation) * radius * 0.85;
      const ez = FOCAL.z + (Math.random() - 0.5) * 2.5;

      // Tangent perpendicular to end direction — drives the dramatic swooping curves
      const perpX = -Math.sin(theta);
      const perpY =  Math.cos(theta) * Math.cos(elevation) * 0.6;

      // Large warp magnitudes = Pegasus-style curves that sweep wide before landing
      const w1 = (Math.random() - 0.5) * 6.0;
      const w2 = (Math.random() - 0.5) * 4.5;

      const ctrl1 = new THREE.Vector3(
        FOCAL.x + (ex - FOCAL.x) * 0.18 + perpX * w1,
        FOCAL.y + (ey - FOCAL.y) * 0.18 + perpY * w1 + (Math.random() - 0.5) * 2.5,
        FOCAL.z + (Math.random() - 0.5) * 2.0
      );
      const ctrl2 = new THREE.Vector3(
        FOCAL.x + (ex - FOCAL.x) * 0.58 + perpX * w2,
        FOCAL.y + (ey - FOCAL.y) * 0.58 + perpY * w2 + (Math.random() - 0.5) * 1.5,
        FOCAL.z + (Math.random() - 0.5) * 1.2
      );

      const curve = new THREE.CubicBezierCurve3(
        FOCAL.clone(), ctrl1, ctrl2,
        new THREE.Vector3(ex, ey, ez)
      );

      const pts = curve.getPoints(SEG);
      const pos = new Float32Array((SEG + 1) * 3);
      pts.forEach((p, j) => { pos[j * 3] = p.x; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = p.z; });

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setDrawRange(0, 0);

      const col = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      const mat = new THREE.LineBasicMaterial({
        color: col.clone().multiplyScalar(0.55 + Math.random() * 0.45),
        transparent: true,
        opacity: 0.45 + Math.random() * 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geo, mat);
      scene.add(line);
      fiberLines.push({ line, total: SEG + 1, delay: Math.random() * 2.6, speed: 18 + Math.random() * 85 });
    }

    // ── Core orb at convergence point ─────────────────────────────────────────
    const coreGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(FOCAL);
    scene.add(core);

    // Inner halo
    const halo1Geo = new THREE.SphereGeometry(0.22, 12, 12);
    const halo1Mat = new THREE.MeshBasicMaterial({
      color: 0xd4a0ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const halo1 = new THREE.Mesh(halo1Geo, halo1Mat);
    halo1.position.copy(FOCAL);
    scene.add(halo1);

    // Outer soft halo
    const halo2Geo = new THREE.SphereGeometry(0.55, 12, 12);
    const halo2Mat = new THREE.MeshBasicMaterial({
      color: 0x7b3ab0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const halo2 = new THREE.Mesh(halo2Geo, halo2Mat);
    halo2.position.copy(FOCAL);
    scene.add(halo2);

    // ── Bokeh — scattered ambient throughout scene like Pegasus ───────────────
    // Mix of sizes: small tight dots + larger soft circles
    const addBokeh = (count: number, size: number, color: number, opacity: number, spread: { x: number; y: number; z: number }) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3]     = FOCAL.x + (Math.random() - 0.2) * spread.x;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color, size, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { pts, mat, targetOpacity: opacity };
    };

    const bokehLayers = [
      addBokeh(80,  0.10, 0xaa66e8, 0.6,  { x: 18, y: 9, z: 6 }),
      addBokeh(50,  0.22, 0x7b3ab0, 0.35, { x: 16, y: 8, z: 5 }),
      addBokeh(30,  0.38, 0x5533aa, 0.20, { x: 14, y: 7, z: 4 }),
    ];

    // ── Beam: shoots horizontally from orb across the frame ───────────────────
    const BEAM_SEGS = 100;
    const beamPts: THREE.Vector3[] = [];
    for (let i = 0; i <= BEAM_SEGS; i++) {
      beamPts.push(new THREE.Vector3(FOCAL.x + (i / BEAM_SEGS) * 22, 0, 0));
    }

    const makeBeam = (yOffset: number, color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(
        beamPts.map(p => new THREE.Vector3(p.x, p.y + yOffset, p.z))
      );
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return { geo, mat, line };
    };

    const beamCore  = makeBeam(0,      0xffffff);
    const beamGlow1 = makeBeam(0,      0xd4a0ff);
    const beamGlow2 = makeBeam(0.025,  0x9b5de5);
    const beamGlow3 = makeBeam(-0.025, 0x9b5de5);

    // ── Phases ────────────────────────────────────────────────────────────────
    let elapsed   = 0;
    let phaseTime = 0;
    type Ph = "grow" | "hold" | "beam" | "fade";
    let phase: Ph = "grow";
    let animId: number;

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:absolute;inset:0;background:white;opacity:0;pointer-events:none;";
    mount.appendChild(overlay);

    let lastT = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      elapsed   += dt;
      phaseTime += dt;

      if (phase === "grow") {
        // Fibers grow outward from orb
        fiberLines.forEach(({ line, total, delay, speed }) => {
          const t = elapsed - delay;
          if (t <= 0) return;
          (line.geometry as THREE.BufferGeometry).setDrawRange(0, Math.min(Math.floor(t * speed), total));
        });

        // Orb blooms in
        const op = Math.min(elapsed * 2.2, 1);
        coreMat.opacity  = op * 0.95;
        halo1Mat.opacity = op * 0.5;
        halo2Mat.opacity = op * 0.2;
        const pulse = 1 + Math.sin(elapsed * 3.5) * 0.08;
        halo1.scale.setScalar(pulse);
        halo2.scale.setScalar(pulse * 1.05);

        // Bokeh drifts in gently alongside fibers
        const bokehOp = Math.min(elapsed * 0.7, 1);
        bokehLayers.forEach(({ mat, targetOpacity }) => {
          mat.opacity = bokehOp * targetOpacity;
        });

        if (phaseTime >= 3.4) { phase = "hold"; phaseTime = 0; }

      } else if (phase === "hold") {
        // Orb pulses faster — building tension before the breakthrough
        const pulse = 1 + Math.sin(elapsed * 11) * 0.22;
        halo1.scale.setScalar(pulse);
        halo2.scale.setScalar(pulse * 1.1);
        coreMat.opacity = 0.95 + Math.sin(elapsed * 11) * 0.05;

        if (phaseTime >= 0.55) { phase = "beam"; phaseTime = 0; }

      } else if (phase === "beam") {
        const p = Math.min(phaseTime / 0.5, 1);
        const drawn = Math.floor(p * BEAM_SEGS);

        // Beam shoots across frame
        [beamCore, beamGlow1, beamGlow2, beamGlow3].forEach(b => b.geo.setDrawRange(0, drawn));
        beamCore.mat.opacity  = Math.min(p * 6, 1) * 0.95;
        beamGlow1.mat.opacity = Math.min(p * 4, 0.55);
        beamGlow2.mat.opacity = Math.min(p * 3, 0.35);
        beamGlow3.mat.opacity = Math.min(p * 3, 0.35);

        if (phaseTime >= 0.55) { phase = "fade"; phaseTime = 0; }

      } else if (phase === "fade") {
        const p = Math.min(phaseTime / 0.65, 1);
        overlay.style.opacity = String(p);

        fiberLines.forEach(({ line }) => {
          (line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1 - p * 2.2);
        });
        coreMat.opacity      = Math.max(0, 0.95 - p * 2);
        halo1Mat.opacity     = Math.max(0, 0.5  - p * 2);
        halo2Mat.opacity     = Math.max(0, 0.2  - p * 2);
        bokehLayers.forEach(({ mat }) => { mat.opacity = Math.max(0, mat.opacity - p * 0.05); });
        beamCore.mat.opacity = Math.max(0, 0.95 - p * 2);

        if (p >= 1) { cancelAnimationFrame(animId); onComplete(); return; }
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(overlay)) mount.removeChild(overlay);
    };
  }, [onComplete]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-50"
      style={{ background: "#02000a", width: "100vw", height: "100vh" }}
    />
  );
}
