"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* ============================================================================
   Futureproof scroll story — a real-looking keyboard that disassembles as you
   scroll. HDRI image-based lighting + PBR materials (Poly Haven CC0), soft
   shadows, keycap legends, coiled cable, CC0 encyclopedia model, and a
   post-processing stack: bloom → depth of field → vignette/grain → SMAA.
   ========================================================================== */

const BG = 0x0e0e12;
const BG_CSS = "#0E0E12";

const P = {
  indigo: 0x6366f1,
  lavender: 0xe0e7ff,
  ember: 0xff4300,
  cream: 0xe8e4da,
  case: 0x23242e,
  plate: 0x3a3b52,
  pcb: 0x14204a,
  switch: 0x2b2c3c,
  mod: 0x40415c,
};

type SectionCopy = {
  id: string; label: string; accent: string;
  eyebrow: string; title: string; body: string;
  tags?: string[]; scroll: number; linger: number; cta?: boolean;
};

const SECTIONS: SectionCopy[] = [
  {
    id: "keyboard", label: "The Keyboard", accent: "#8B8DF6",
    eyebrow: "THE FUTURE IS TYPED", title: "It starts with a keyboard.",
    body: "Every prompt, every program, every question your kid will ever ask a machine goes through these keys. Futureproof teaches them what happens next.",
    tags: ["K-12 AI literacy", "Module 1 free"], scroll: 1.4, linger: 0.35,
  },
  {
    id: "keys", label: "The Language", accent: "#A5B4FC",
    eyebrow: "MODULE 1 · FREE FOREVER", title: "AI, explained for kids.",
    body: "The keys come off first: five hands-on modules that teach the language of AI — no jargon, quizzes with instant feedback, progress you can see.",
    tags: ["Free forever", "Ages 8+", "5 modules"], scroll: 1.3, linger: 0.35,
  },
  {
    id: "switches", label: "The Conversation", accent: "#E0E7FF",
    eyebrow: "PROMPT PLAYGROUND", title: "Every keypress is a conversation.",
    body: "Under every key is a switch waiting to be pressed. In the playground, kids practice real prompting with weekly AI tokens in a safe sandbox.",
    tags: ["Safe sandbox", "50k–200k tokens / week"], scroll: 1.3, linger: 0.35,
  },
  {
    id: "board", label: "The Code", accent: "#FF6A3D",
    eyebrow: "CODE IDE", title: "Down to the bare metal.",
    body: "At the bottom of it all: the board, alive with running code. A full in-browser IDE for Python, JavaScript, Java, Go and more — every project saved.",
    tags: ["10+ languages", "Runs in the browser", "Auto-saved"], scroll: 1.3, linger: 0.4,
  },
  {
    id: "liftoff", label: "Liftoff", accent: "#FF6A3D",
    eyebrow: "START TODAY", title: "Futureproof your kid.",
    body: "Now they know what's inside the machine. Start free with Module 1 — plans from $5/month when they're ready for more.",
    scroll: 1.8, linger: 0.5, cta: true,
  },
];

/* ---------- PBR material factory ---------- */

const matCache = new Map<string, THREE.Material>();
function capMat(hex: number) {
  const k = `cap${hex}`;
  if (!matCache.has(k)) {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: 0.48, metalness: 0,
      clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.7,
    });
    matCache.set(k, m);
  }
  return matCache.get(k) as THREE.MeshPhysicalMaterial;
}
function metalMat(hex: number, rough = 0.4) {
  const k = `mt${hex}-${rough}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.85, envMapIntensity: 0.9 }));
  return matCache.get(k) as THREE.MeshStandardMaterial;
}
function plasticMat(hex: number, rough = 0.6) {
  const k = `pl${hex}-${rough}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0, envMapIntensity: 0.6 }));
  return matCache.get(k) as THREE.MeshStandardMaterial;
}
function glow(hex: number, i = 1.6) {
  const k = `g${hex}-${i}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(i) }));
  return matCache.get(k) as THREE.MeshBasicMaterial;
}

/* ---------- keycap legends (canvas textures) ---------- */

function legendTexture(label: string, ink: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${label.length > 2 ? 34 : label.length > 1 ? 52 : 72}px Inter, Arial, sans-serif`;
  ctx.fillText(label, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

const ROW_LABELS: string[][] = [
  ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "⌫"],
  ["⇥", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["⇪", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "⏎"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "⇧"],
  ["Ctrl", "Win", "Alt", "", "Alt", "Fn", "☰", "Ctrl"],
];

/* ---------- part registry ---------- */

type Part = {
  obj: THREE.Object3D;
  rest: { pos: THREE.Vector3; rot: THREE.Euler };
  exploded: { pos: THREE.Vector3; rot: THREE.Euler };
  w0: number; w1: number;
};

const rnd = (i: number, s = 1) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
function smoothstep(x: number) { const c = Math.min(Math.max(x, 0), 1); return c * c * (3 - 2 * c); }

/* ---------- keyboard (60% layout, procedural, PBR) ---------- */

const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];
const U = 1.0, GAP = 0.1, DEPTH = 1.0;

/* Sculpted keycap: tapered sides (narrower top), cylindrical dish in the top face
   (convex bump for the spacebar), rounded corners preserved. Cherry/OEM-like. */
function keycapGeo(w: number) {
  const width = w * U - GAP, h = 0.42, depth = DEPTH - GAP;
  const geo = new RoundedBoxGeometry(width, h, depth, 5, 0.08);
  const pos = geo.attributes.position;
  const halfH = h / 2, halfW = width / 2, halfD = depth / 2;
  const TOP_SCALE = 0.78, spacebar = w > 3;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = Math.max(0, (y + halfH) / h);        // 0 bottom → 1 top
    const s = 1 - (1 - TOP_SCALE) * t;              // taper
    x *= s; z *= s;
    if (t > 0.82) {                                 // dish the top face
      const k = (t - 0.82) / 0.18;
      const rx = Math.min(Math.abs(x) / (halfW * TOP_SCALE), 1);
      const rz = Math.min(Math.abs(z) / (halfD * TOP_SCALE), 1);
      const bowl = Math.max(0, 1 - (rx * rx + rz * rz) * 0.85);
      y += spacebar ? k * bowl * 0.025 : -k * bowl * 0.05;
    }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* OEM profile: each row's caps sit at a slightly different angle */
const ROW_TILT = [-0.07, -0.035, 0, 0.045, 0.07];

function buildKeyboard(scene: THREE.Scene) {
  const g = new THREE.Group();
  const parts: Part[] = [];
  const capGeoCache = new Map<number, THREE.BufferGeometry>();
  const capGeo = (w: number) => {
    if (!capGeoCache.has(w)) capGeoCache.set(w, keycapGeo(w));
    return capGeoCache.get(w)!;
  };
  // Cherry MX-style switch: dark base, smoky translucent upper housing, cross stem
  const swBase = new RoundedBoxGeometry(0.62, 0.16, 0.62, 2, 0.03);
  const swUpper = (() => {
    const geoU = new RoundedBoxGeometry(0.5, 0.22, 0.5, 3, 0.04);
    const p = geoU.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = Math.max(0, (p.getY(i) + 0.11) / 0.22);
      const s = 1 - 0.3 * t;
      p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s);
    }
    geoU.computeVertexNormals();
    return geoU;
  })();
  const stemA = new THREE.BoxGeometry(0.28, 0.14, 0.09);
  const stemB = new THREE.BoxGeometry(0.09, 0.14, 0.28);
  const swHousingMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2b3c, transparent: true, opacity: 0.82, roughness: 0.25,
    clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.8,
  });

  const totalD = ROWS.length * DEPTH;
  let ki = 0;
  ROWS.forEach((row, r) => {
    const rowW = row.reduce((a, b) => a + b, 0);
    let x = -rowW / 2;
    const z = -totalD / 2 + r * DEPTH + DEPTH / 2;
    row.forEach((w, c) => {
      const cx = x + w / 2; x += w;
      ki++;
      const isMod = w > 1.2 || c === 0;
      const isEmber = (r === 0 && c === 0) || (r === 2 && c === row.length - 1);
      const isGlow = (r === 1 && c === 8) || (r === 2 && c === 4);
      const mat = isEmber ? capMat(P.ember) : isGlow ? glow(P.indigo, 1.4) : isMod ? capMat(P.mod) : capMat(P.cream);
      const cap = new THREE.Mesh(capGeo(w), mat);
      const rest = new THREE.Vector3(cx, 1.05, z);
      cap.position.copy(rest);
      cap.castShadow = true; cap.receiveShadow = true;
      // legend rides the cap, sized to the tapered top face
      const label = ROW_LABELS[r]?.[c] ?? "";
      if (label) {
        const ink = isEmber ? "#ffffff" : isGlow ? "#1d1e30" : isMod ? "#c9cade" : "#3a3b52";
        const topW = (w * U - GAP) * 0.78;
        const lg = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.min(topW, 0.75) * 0.8, 0.5),
          new THREE.MeshBasicMaterial({ map: legendTexture(label, ink), transparent: true, depthWrite: false }),
        );
        lg.rotation.x = -Math.PI / 2;
        lg.position.set(0, 0.215, 0.02);
        cap.add(lg);
      }
      g.add(cap);
      const rowTilt = ROW_TILT[r] ?? 0;
      const d = Math.hypot(cx, z) / 8;
      const wide = w > 1.9;
      const ex = new THREE.Vector3(cx * 1.12, 3.8 + d * 0.9 + rnd(ki) * 0.3, z * 1.18);
      const tilt = wide ? 0.03 : 0.09;
      const er = new THREE.Euler(rowTilt + rnd(ki, 2) * tilt * 2 - tilt, rnd(ki, 3) * tilt * 2 - tilt, rnd(ki, 4) * tilt * 2 - tilt);
      const t0 = 0.10 + d * 0.10 + rnd(ki, 5) * 0.04;
      parts.push({ obj: cap, rest: { pos: rest, rot: new THREE.Euler(rowTilt, 0, 0) }, exploded: { pos: ex, rot: er }, w0: t0, w1: t0 + 0.28 });

      const sw = new THREE.Group();
      const swb = new THREE.Mesh(swBase, plasticMat(P.switch, 0.5));
      swb.castShadow = true; sw.add(swb);
      const upper = new THREE.Mesh(swUpper, swHousingMat);
      upper.position.y = 0.17; sw.add(upper);
      const stem = new THREE.Group();
      stem.add(new THREE.Mesh(stemA, plasticMat(P.ember, 0.4)));
      stem.add(new THREE.Mesh(stemB, plasticMat(P.ember, 0.4)));
      stem.position.y = 0.3; sw.add(stem);
      const sRest = new THREE.Vector3(cx, 0.62, z);
      sw.position.copy(sRest);
      g.add(sw);
      const sEx = new THREE.Vector3(cx * 1.05, 2.1 + rnd(ki, 6) * 0.25, z * 1.08);
      parts.push({ obj: sw, rest: { pos: sRest, rot: new THREE.Euler() }, exploded: { pos: sEx, rot: new THREE.Euler(rnd(ki, 7) * 0.12 - 0.06, 0, rnd(ki, 8) * 0.12 - 0.06) }, w0: 0.32, w1: 0.58 });
    });
  });

  const maxW = Math.max(...ROWS.map((r) => r.reduce((a, b) => a + b, 0)));

  const plate = new THREE.Mesh(new RoundedBoxGeometry(maxW + 0.6, 0.16, totalD + 0.5, 2, 0.06), metalMat(P.plate, 0.5));
  plate.position.set(0, 0.42, 0);
  plate.castShadow = true; plate.receiveShadow = true;
  g.add(plate);
  parts.push({ obj: plate, rest: { pos: plate.position.clone(), rot: new THREE.Euler() }, exploded: { pos: new THREE.Vector3(0, 1.15, 0.2), rot: new THREE.Euler(-0.06, 0, 0.02) }, w0: 0.40, w1: 0.62 });

  const pcb = new THREE.Group();
  const board = new THREE.Mesh(new RoundedBoxGeometry(maxW + 0.4, 0.14, totalD + 0.3, 2, 0.05), plasticMat(P.pcb, 0.75));
  board.receiveShadow = true;
  pcb.add(board);
  const traceMat = glow(P.indigo, 1.2);
  for (let i = 0; i < 14; i++) {
    const horiz = i % 2 === 0;
    const span = horiz ? maxW - 1 : totalD - 0.8;
    const len = Math.min(1.5 + rnd(i, 9) * 4.5, span - 0.4);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.06, 0.03, horiz ? 0.06 : len), traceMat);
    tr.position.set(
      (rnd(i, 10) - 0.5) * (horiz ? maxW - 1 - len : maxW - 2),
      0.09,
      (rnd(i, 11) - 0.5) * (horiz ? totalD - 1 : totalD - 0.8 - len),
    );
    pcb.add(tr);
  }
  for (let i = 0; i < 8; i++) {
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), glow(i % 3 ? P.ember : P.lavender, 1.6));
    dot.position.set((rnd(i, 12) - 0.5) * (maxW - 2.5), 0.1, (rnd(i, 13) - 0.5) * (totalD - 1.2));
    pcb.add(dot);
  }
  const core = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.22, 1.7, 2, 0.05), glow(P.indigo, 1.9));
  core.position.set(0, 0.12, 0); pcb.add(core);
  pcb.position.set(0, 0.18, 0); g.add(pcb);
  parts.push({ obj: pcb, rest: { pos: pcb.position.clone(), rot: new THREE.Euler() }, exploded: { pos: new THREE.Vector3(0, 0.55, 0.8), rot: new THREE.Euler(-0.38, 0, 0) }, w0: 0.58, w1: 0.9 });

  const shell = new THREE.Mesh(new RoundedBoxGeometry(maxW + 1.2, 1.0, totalD + 1.1, 3, 0.22), metalMat(P.case, 0.42));
  shell.position.set(0, -0.15, 0);
  shell.castShadow = true; shell.receiveShadow = true;
  g.add(shell);
  parts.push({ obj: shell, rest: { pos: shell.position.clone(), rot: new THREE.Euler() }, exploded: { pos: new THREE.Vector3(0, -2.6, -0.8), rot: new THREE.Euler(0.22, 0.06, 0) }, w0: 0.46, w1: 0.72 });

  g.scale.setScalar(0.85);
  scene.add(g);

  const coreLight = new THREE.PointLight(P.indigo, 0, 16, 2);
  coreLight.position.set(0, 2, 0); scene.add(coreLight);
  const emberLight = new THREE.PointLight(P.ember, 0, 20, 2);
  emberLight.position.set(0, 3.5, 2); scene.add(emberLight);

  return { group: g, parts, coreLight, emberLight };
}

/* ---------- desk scene: wood, coiled cable, real book model ---------- */

const DESK_Y = -0.56;

function buildDesk(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const diff = loader.load("/world/tex/wood_diff.jpg");
  const rough = loader.load("/world/tex/wood_rough.jpg");
  const nor = loader.load("/world/tex/wood_nor.jpg");
  diff.colorSpace = THREE.SRGBColorSpace;
  [diff, rough, nor].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 1.6); t.anisotropy = 8; });
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 80),
    new THREE.MeshStandardMaterial({ map: diff, roughnessMap: rough, normalMap: nor, normalScale: new THREE.Vector2(0.7, 0.7), envMapIntensity: 0.3 }),
  );
  desk.rotation.x = -Math.PI / 2;
  desk.position.y = DESK_Y;
  desk.receiveShadow = true;
  scene.add(desk);

  // coiled cable out the back of the case
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const theta = t * Math.PI * 12;
    pts.push(new THREE.Vector3(
      3 + t * 8 + Math.cos(theta) * 0.5,
      DESK_Y + 0.14 + Math.max(0, (1 - t) * 0.5) * (0.3 + 0.2 * Math.sin(theta)),
      -4.6 + Math.sin(theta) * 0.5 - t * 1.6,
    ));
  }
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.09, 10),
    new THREE.MeshPhysicalMaterial({ color: P.ember, roughness: 0.35, clearcoat: 0.4, envMapIntensity: 0.8 }),
  );
  cable.castShadow = true;
  scene.add(cable);

  // CC0 encyclopedia stack (Poly Haven), scaled + placed left of the keyboard
  new GLTFLoader().load("/world/models/book/book_encyclopedia_set_01_1k.gltf", (gltf) => {
    const books = gltf.scene;
    const box = new THREE.Box3().setFromObject(books);
    const size = box.getSize(new THREE.Vector3());
    const s = 7.5 / Math.max(size.x, size.z);
    books.scale.setScalar(s);
    books.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(books);
    books.position.set(-12.5 - box2.min.x * 0, DESK_Y - box2.min.y, -4.5);
    books.rotation.y = 0.5;
    books.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m && "envMapIntensity" in m) m.envMapIntensity = 0.5;
      }
    });
    scene.add(books);
  }, undefined, () => { /* decorative — ignore load errors */ });
}

/* ---------- vignette + film grain shader ---------- */

const GrainVignetteShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, time: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + time) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float v = smoothstep(1.25, 0.55, length(vUv - 0.5));   // vignette
      c.rgb *= mix(0.72, 1.0, v);
      c.rgb += (hash(vUv * vec2(1920.0, 1080.0)) - 0.5) * 0.028; // grain
      gl_FragColor = c;
    }`,
};

/* ---------- pacing ---------- */

function fLinger(u: number, l: number) {
  if (!l) return u;
  const a = 0.5 - l * 0.35, b = 0.5 + l * 0.35;
  if (u < a) return (u / a) * 0.5;
  if (u < b) return 0.5 + ((u - a) / (b - a)) * 0.001;
  return 0.501 + ((u - b) / (1 - b)) * 0.499;
}

/* ---------- component ---------- */

export default function FutureproofWorld() {
  const canvasWrap = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState<null | boolean>(null);
  const [hintGone, setHintGone] = useState(false);

  const totalW = SECTIONS.reduce((s, x) => s + x.scroll, 0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch { setFallback(true); return; }
    if (reduce) { renderer.dispose(); setFallback(true); return; }
    setFallback(false);

    const wrap = canvasWrap.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 34, 85); // fade the desk into the dark, kill the hard horizon

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);

    // image-based lighting from a real studio HDRI
    const pmrem = new THREE.PMREMGenerator(renderer);
    new RGBELoader().load("/world/env.hdr", (hdr) => {
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose(); pmrem.dispose();
    });

    // key light with soft shadows + cool rim
    const key = new THREE.DirectionalLight(0xfff2e0, 1.5);
    key.position.set(-12, 20, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    key.shadow.camera.left = -16; key.shadow.camera.right = 16;
    key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
    key.shadow.camera.far = 60; key.shadow.bias = -0.0004; key.shadow.radius = 6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6366f1, 0.45);
    rim.position.set(16, 6, -14); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x22232e, 0.7));

    const kb = buildKeyboard(scene);
    buildDesk(scene, new THREE.TextureLoader());

    // post stack: render → bloom → depth of field → grain/vignette → SMAA → output
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // threshold 1.0: only true HDR emitters (glow keys, traces, core) may bloom —
    // lit white plastic must stay below it or the whole cap field flares out
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.45, 1.0);
    composer.addPass(bloom);
    const bokeh = new BokehPass(scene, camera, { focus: 14, aperture: 0.00016, maxblur: 0.008 });
    composer.addPass(bokeh);
    const grain = new ShaderPass(GrainVignetteShader);
    composer.addPass(grain);
    const smaa = new SMAAPass();
    composer.addPass(smaa);
    composer.addPass(new OutputPass());
    let useComposer = !coarse; // phones render plain — DoF/grain cost too much there

    const camPos = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 7.0, 13.5),
      new THREE.Vector3(-8.5, 7.5, 11.5),
      new THREE.Vector3(10, 9, 9.5),
      new THREE.Vector3(0, 13.5, 6.5),
      new THREE.Vector3(0, 7.5, 16.5),
    ], false, "centripetal");
    const camLook = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(0, 1.6, 0),
      new THREE.Vector3(0, 1.8, 0),
      new THREE.Vector3(0, 0.7, 0.7),
      new THREE.Vector3(0, 2.2, 0),
    ], false, "centripetal");

    const weights = SECTIONS.map((s) => s.scroll);
    let pTarget = 0, pNow = -0.0001, lastActive = -1, raf = 0;

    const onScroll = () => {
      const max = (spacer.current?.offsetHeight ?? 1) - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY / Math.max(max, 1), 0), 1) * totalW;
      let acc = 0, i = 0;
      while (i < weights.length - 1 && y > acc + weights[i]) { acc += weights[i]; i++; }
      const u = Math.min(Math.max((y - acc) / weights[i], 0), 1);
      const bandLo = acc / totalW, bandHi = (acc + weights[i]) / totalW;
      pTarget = bandLo + fLinger(u, SECTIONS[i].linger) * (bandHi - bandLo);
      if (window.scrollY > 40) setHintGone(true);
      const act = u > 0.9 && i < weights.length - 1 ? i + 1 : i;
      if (act !== lastActive) { lastActive = act; setActive(act); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    onResize();
    window.addEventListener("resize", onResize);

    const lost = (e: Event) => { e.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener("webglcontextlost", lost);

    let frames = 0, fpsT0 = performance.now(), degrade = 0;
    const clock = new THREE.Clock();
    const eul = new THREE.Euler();
    const lookPt = new THREE.Vector3();

    const tick = () => {
      const t = clock.getElapsedTime();
      pNow += (pTarget - pNow) * 0.09;
      const p = Math.min(Math.max(pNow, 0), 1);

      for (const part of kb.parts) {
        const k = smoothstep((p - part.w0) / (part.w1 - part.w0));
        part.obj.position.lerpVectors(part.rest.pos, part.exploded.pos, k);
        eul.set(
          part.rest.rot.x + (part.exploded.rot.x - part.rest.rot.x) * k,
          part.rest.rot.y + (part.exploded.rot.y - part.rest.rot.y) * k,
          part.rest.rot.z + (part.exploded.rot.z - part.rest.rot.z) * k,
        );
        part.obj.rotation.copy(eul);
      }

      kb.coreLight.intensity = smoothstep((p - 0.45) / 0.3) * 42;
      kb.emberLight.intensity = smoothstep((p - 0.75) / 0.2) * 30;

      kb.group.rotation.y = p * 0.35 + Math.sin(t * 0.25) * 0.03;
      kb.group.position.y = Math.sin(t * 0.5) * 0.06;

      camera.position.copy(camPos.getPoint(p));
      camLook.getPoint(p, lookPt);
      camera.lookAt(lookPt);

      // depth of field tracks the story's focal point
      (bokeh.uniforms as Record<string, THREE.IUniform>).focus.value = camera.position.distanceTo(lookPt);
      grain.uniforms.time.value = t % 100;

      if (useComposer) composer.render(); else renderer.render(scene, camera);

      frames++;
      const now = performance.now();
      if (now - fpsT0 > 2000) {
        const fps = (frames * 1000) / (now - fpsT0);
        frames = 0; fpsT0 = now;
        if (fps < 24 && degrade < 4) {
          degrade++;
          if (degrade === 1) bokeh.enabled = false;               // DoF first
          else if (degrade === 2) { bloom.enabled = false; }      // then bloom
          else if (degrade === 3) useComposer = false;            // then whole stack
          else renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - 0.25));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    onScroll();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      composer.dispose();
      renderer.dispose();
      if (wrap.contains(renderer.domElement)) wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fallback) {
    return (
      <main style={{ background: BG_CSS, color: "#EDEDF7", minHeight: "100vh", padding: "12vh 8vw" }}>
        {SECTIONS.map((s) => (
          <section key={s.id} style={{ maxWidth: 620, margin: "0 auto 14vh" }}>
            <p style={{ color: s.accent, fontSize: 12, letterSpacing: "0.14em", fontWeight: 700 }}>{s.eyebrow}</p>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: "10px 0" }}>{s.title}</h2>
            <p style={{ color: "#9C9DBB", lineHeight: 1.6 }}>{s.body}</p>
            {s.cta && (
              <p style={{ marginTop: 24 }}>
                <Link href="/signup" style={{ background: "#6366F1", color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 700 }}>Start free</Link>
              </p>
            )}
          </section>
        ))}
      </main>
    );
  }

  return (
    <div style={{ background: BG_CSS }}>
      <div ref={spacer} style={{ height: `${totalW * 100}vh` }} />
      <div ref={canvasWrap} style={{ position: "fixed", inset: 0, zIndex: 0 }} />
      <Link href="/" style={{ position: "fixed", top: 22, left: 28, zIndex: 3, color: "#EDEDF7", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>
        Futureproof
      </Link>
      <div style={{ position: "fixed", right: 22, top: "50%", transform: "translateY(-50%)", zIndex: 3, display: "flex", flexDirection: "column", gap: 10 }}>
        {SECTIONS.map((s, i) => (
          <span key={s.id} title={s.label} style={{
            width: 8, height: i === active ? 22 : 8, borderRadius: 5,
            background: i === active ? s.accent : "rgba(237,237,247,0.28)",
            transition: "all .35s ease",
          }} />
        ))}
      </div>
      {SECTIONS.map((s, i) => (
        <div key={s.id} style={{
          position: "fixed", zIndex: 2, left: "7vw", bottom: "10vh", maxWidth: 470,
          opacity: i === active ? 1 : 0,
          transform: i === active ? "translateY(0)" : "translateY(14px)",
          transition: "opacity .5s ease, transform .5s ease",
          pointerEvents: i === active ? "auto" : "none",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          <p style={{ color: s.accent, fontSize: 12, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>{s.eyebrow}</p>
          <h2 style={{ color: "#EDEDF7", fontSize: "clamp(28px, 4.4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 12, textShadow: "0 2px 24px rgba(10,10,14,0.9)" }}>
            {s.title}
          </h2>
          <p style={{ color: "#B9BAD6", fontSize: 15, lineHeight: 1.6, marginBottom: 14, textShadow: "0 1px 12px rgba(10,10,14,0.9)" }}>{s.body}</p>
          {s.tags && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {s.tags.map((tg) => (
                <span key={tg} style={{ border: "1px solid rgba(237,237,247,0.22)", color: "#D6D7EA", fontSize: 12, padding: "5px 11px", borderRadius: 999, background: "rgba(14,14,18,0.45)", backdropFilter: "blur(4px)" }}>{tg}</span>
              ))}
            </div>
          )}
          {s.cta && (
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <Link href="/signup" style={{ background: "#6366F1", color: "#fff", padding: "13px 26px", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>Start free</Link>
              <Link href="/" style={{ border: "1px solid rgba(237,237,247,0.3)", color: "#EDEDF7", padding: "13px 26px", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>Explore plans</Link>
            </div>
          )}
        </div>
      ))}
      <div style={{
        position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 2,
        color: "rgba(237,237,247,0.55)", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
        opacity: hintGone ? 0 : 1, transition: "opacity .6s ease", pointerEvents: "none",
      }}>
        scroll to take it apart
      </div>
    </div>
  );
}
