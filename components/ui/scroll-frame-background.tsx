"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 192;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.webp`;

export default function ScrollFrameBackground({
  endId,
  frameFraction = 1,
  pixelsPerFrame,
}: {
  endId?: string;
  /** 0–1: what fraction of the 192 frames to play across the full scroll distance. */
  frameFraction?: number;
  /** When set, overrides endId: the animation advances one frame every N pixels scrolled.
   *  E.g. pixelsPerFrame={6} → full 192-frame animation completes over ~1150px of scroll. */
  pixelsPerFrame?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafPendingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const img = new Image();
      img.decoding = "async";
      img.src = FRAME_PATH(1);
      img.onload = () => drawCover(ctx, img, canvas);
      return;
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCover(ctx, framesRef.current[currentFrameRef.current], canvas);
    }

    function drawCover(
      context: CanvasRenderingContext2D,
      img: HTMLImageElement,
      cvs: HTMLCanvasElement
    ) {
      if (!img || !img.complete || !img.naturalWidth) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ir = img.naturalWidth / img.naturalHeight;
      const vr = vw / vh;
      let dw: number, dh: number, dx: number, dy: number;
      if (ir > vr) {
        dh = vh;
        dw = vh * ir;
        dx = (vw - dw) / 2;
        dy = 0;
      } else {
        dw = vw;
        dh = vw / ir;
        dx = 0;
        dy = (vh - dh) / 2;
      }
      context.clearRect(0, 0, vw, vh);
      context.drawImage(img, dx, dy, dw, dh);
    }

    function render(i: number) {
      if (!canvas || !ctx) return;
      const frame = framesRef.current[i];
      if (frame) drawCover(ctx, frame, canvas);
    }

    function tick() {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const delta = target - current;

      if (Math.abs(delta) < 0.5) {
        currentFrameRef.current = target;
        render(target);
        rafPendingRef.current = false;
        return;
      }

      // lerp — smooth catch-up each frame
      const next = current + delta * 0.1;
      currentFrameRef.current = next;
      render(Math.round(next));
      requestAnimationFrame(tick);
    }

    function onScroll() {
      const maxFrame = Math.round((FRAME_COUNT - 1) * Math.min(Math.max(frameFraction, 0), 1));
      let maxScroll: number;
      if (pixelsPerFrame !== undefined) {
        // Direct speed control: one frame per N pixels of scroll
        maxScroll = maxFrame * pixelsPerFrame;
      } else if (endId) {
        const el = document.getElementById(endId);
        maxScroll = el
          ? el.offsetTop + el.offsetHeight - window.innerHeight
          : document.documentElement.scrollHeight - window.innerHeight;
      } else {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      }
      const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      targetFrameRef.current = Math.round(progress * maxFrame);
      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(tick);
      }
    }

    resizeCanvas();

    // Issue 05 — draw frame 1 as soon as it is available so the canvas
    // never shows a blank black rectangle on cold load.
    // onload MUST be assigned before src so cached images fire reliably.
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      const idx = i; // capture for closure
      img.onload = () => {
        if (idx === 0) render(0);
      };
      img.src = FRAME_PATH(i + 1);
      // decode() resolves even when onload already fired (cached images)
      if (i === 0) img.decode().then(() => render(0)).catch(() => {});
      framesRef.current[i] = img;
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        background: "#000",
      }}
    />
  );
}
