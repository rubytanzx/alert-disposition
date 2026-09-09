"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

const GRID      = 16;       // fewer, larger tiles like the reference
const CUBE_W    = 1.5;
const CUBE_H    = 3.0;
const CELL      = 2.0;      // wide spacing so tiles are clearly individual
const MAX_TRAIL = 128;

export default function WaveGrid({ className, style }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    // Background matches cube base colour so gaps between cubes aren't dark
    scene.background = new THREE.Color(0xf0f2ff);

    // ── Camera — telephoto overhead so large tiles fill the frame ────────────
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(0, 20, 2);
    camera.lookAt(0, 0, 0);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 6;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xc7d2fe, 0.35);
    fill.position.set(-5, 8, -4);
    scene.add(fill);

    // ── Per-instance XZ offsets ───────────────────────────────────────────────
    const COUNT  = GRID * GRID;
    const origin = -(GRID - 1) * CELL * 0.5;
    const offsets = new Float32Array(COUNT * 2);
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const idx = row * GRID + col;
        offsets[idx * 2]     = origin + col * CELL;
        offsets[idx * 2 + 1] = origin + row * CELL;
      }
    }

    // ── Mouse trail DataTexture (128 × 1, RGBA float) ────────────────────────
    const trailData = new Float32Array(MAX_TRAIL * 4);
    const trailTex  = new THREE.DataTexture(trailData, MAX_TRAIL, 1, THREE.RGBAFormat, THREE.FloatType);
    trailTex.needsUpdate = true;

    // ── Shared uniforms ───────────────────────────────────────────────────────
    const uniforms = {
      uTrailTexture: { value: trailTex },
      uTrailCount:   { value: 0 },
      uWaveSpeed:    { value: 3.8 },
      uWaveFreq:     { value: 1.3 },
      uWaveWidth:    { value: 1.7 },
      uFadeTime:     { value: 1.5 },
      uMaxHeight:    { value: 2.0 },
      uJitter:       { value: 0.10 },
      uColorBase:    { value: new THREE.Color(0xe0e4ff) }, // soft lavender
      uColorHigh:    { value: new THREE.Color(0x6366f1) }, // indigo-500
    };

    // ── Vertex shader override (same function used for main + depth) ───────────
    const overrideVertex = (src: string): string => {
      src = /* glsl */`
        attribute vec2 aOffset;
        uniform sampler2D uTrailTexture;
        uniform int   uTrailCount;
        uniform float uWaveSpeed;
        uniform float uWaveFreq;
        uniform float uWaveWidth;
        uniform float uFadeTime;
        uniform float uMaxHeight;
        uniform float uJitter;
        varying float vHeight;

        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }
      ` + src;

      src = src.replace(
        "#include <begin_vertex>",
        /* glsl */`
        #include <begin_vertex>

        // Skip wave calc for bottom vertices — invisible, saves ~50% GPU
        if (position.y > 0.0) {
          vec2 jitter  = hash2(aOffset) * uJitter;
          vec2 worldXZ = aOffset + jitter;

          float waveHeight  = 0.0;
          float totalWeight = 0.0;

          for (int i = 0; i < 128; i++) {
            if (i >= uTrailCount) break;

            vec4  td  = texture2D(uTrailTexture, vec2((float(i) + 0.5) / 128.0, 0.5));
            float age       = td.b;
            float distDelta = td.a;
            if (age <= 0.0) continue;

            vec2  toP   = worldXZ - td.rg;
            float dist  = length(toP);
            float relD  = dist - uWaveSpeed * age;

            float window    = exp(-(relD * relD) / (uWaveWidth * uWaveWidth));
            float fade      = exp(-age / uFadeTime);
            float atten     = 1.0 / (1.0 + dist * 0.08);
            float weight    = window * fade * atten * clamp(distDelta * 7.0, 0.0, 1.0);

            waveHeight  += weight * cos(uWaveFreq * relD);
            totalWeight += weight;
          }

          waveHeight /= max(totalWeight, 1.0);
          transformed.y += waveHeight * uMaxHeight;
          vHeight = waveHeight;
        } else {
          vHeight = 0.0;
        }
        `
      );
      return src;
    };

    // ── Main material ─────────────────────────────────────────────────────────
    const geo = new THREE.BoxGeometry(CUBE_W, CUBE_H, CUBE_W);
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 2));

    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = overrideVertex(shader.vertexShader);

      // Inject varying + uniforms into fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /* glsl */`
        #include <common>
        varying float vHeight;
        uniform vec3  uColorBase;
        uniform vec3  uColorHigh;
        uniform float uMaxHeight;
        `
      );
      // Mix colour based on wave height
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        /* glsl */`
        #include <color_fragment>
        float t = clamp(vHeight, 0.0, 1.0);
        diffuseColor.rgb = mix(uColorBase, uColorHigh, t);
        `
      );
    };

    // ── Depth material (identical vertex deformation so shadows line up) ──────
    const depthMat = new THREE.MeshDepthMaterial();
    depthMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = overrideVertex(shader.vertexShader);
    };

    // ── Instanced mesh ────────────────────────────────────────────────────────
    const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
    mesh.castShadow          = true;
    mesh.receiveShadow       = true;
    mesh.customDepthMaterial = depthMat;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      dummy.position.set(offsets[i * 2], 0, offsets[i * 2 + 1]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    // ── Invisible plane for raycasting ───────────────────────────────────────
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.updateMatrixWorld(true);
    scene.add(plane);

    // ── Trail state ───────────────────────────────────────────────────────────
    type Pt = { x: number; z: number; age: number; distDelta: number };
    const trail: Pt[] = [];
    let lastPX = -999, lastPZ = -999;

    const addPoint = (x: number, z: number) => {
      const dx = x - lastPX, dz = z - lastPZ;
      const d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.12 && trail.length > 0) return;
      trail.push({ x, z, age: 0.001, distDelta: d });
      lastPX = x; lastPZ = z;
      if (trail.length > MAX_TRAIL) trail.shift();
    };

    // ── Mouse input ───────────────────────────────────────────────────────────
    const rc  = new THREE.Raycaster();
    const m2d = new THREE.Vector2();

    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      m2d.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      m2d.y = -((e.clientY - rect.top)  / rect.height) *  2 + 1;
      rc.setFromCamera(m2d, camera);
      const hits = rc.intersectObject(plane);
      if (hits.length) addPoint(hits[0].point.x, hits[0].point.z);
      idleTime = 0;
    };
    mount.addEventListener("mousemove", onMove);

    // ── Auto-wave (idle) ──────────────────────────────────────────────────────
    let idleTime  = 0;   // starts active immediately
    let autoAngle = 0;

    // ── Animation loop ────────────────────────────────────────────────────────
    let animId: number;
    let lastT = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      // Age and prune
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += dt;
        if (trail[i].age > uniforms.uFadeTime.value * 4.5) trail.splice(i, 1);
      }

      // Auto-wave when no mouse activity
      idleTime += dt;
      if (idleTime > 1.5) {
        autoAngle += dt * 0.5;
        const r = 7.0;
        addPoint(Math.cos(autoAngle) * r, Math.sin(autoAngle * 0.6) * r * 0.6);
      }

      // Upload to GPU
      const count = Math.min(trail.length, MAX_TRAIL);
      if (count > 0 || uniforms.uTrailCount.value > 0) {
        trailData.fill(0);
        for (let i = 0; i < count; i++) {
          trailData[i * 4]     = trail[i].x;
          trailData[i * 4 + 1] = trail[i].z;
          trailData[i * 4 + 2] = trail[i].age;
          trailData[i * 4 + 3] = trail[i].distDelta;
        }
        trailTex.needsUpdate = true;
        uniforms.uTrailCount.value = count;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}
