/**
 * HeroExecutionBackground
 *
 * Canvas-based animated execution trace visualization.
 * Inspired by: horizontal AI-agent pipeline with converging/diverging
 * data lanes, glowing nodes, UI card fragments, waveforms, and
 * traveling pulse dots.
 *
 * Composition:
 *  - Multiple horizontal lanes flow LEFT → RIGHT
 *  - All lanes converge at a central glowing blue square
 *  - Left side: denser, more fragmented activity
 *  - Right side: diverges into branches after center
 *  - UI card panels appear at edges (data fragment overlays)
 *  - Waveform traces at bottom-left and top-right
 *  - Pulse dots travel along paths
 *
 * Performance:
 *  - Static elements drawn to an offscreen canvas once
 *  - Only pulses redrawn each frame (fast blit + pulse overlay)
 *  - prefers-reduced-motion: static frame only, no RAF loop
 *  - ResizeObserver handles window resize
 */

import React, { useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface Pt { x: number; y: number; }

// ─── Internal design coordinate space ─────────────────────────
const IW = 1400;
const IH = 520;
const CX = 700;   // central node X
const CY = 265;   // central node Y (positioned in lower-center, below text)

// ─── Palette ──────────────────────────────────────────────────
const BLUE   = '#4A8CF7';
const BLUE_D = '#1A2E58';
const CYAN   = '#22D3EE';
const VIOLET = '#7C5CE8';
const AMBER  = '#F5A623';
const GRAY   = '#2E3848';
const GRAY_M = '#4A5568';

// ─── Bezier math ──────────────────────────────────────────────
function bez(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
  };
}
function sampleBez(p0: Pt, cp1: Pt, cp2: Pt, p3: Pt, n = 140): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => bez(i / n, p0, cp1, cp2, p3));
}
const P = (x: number, y: number): Pt => ({ x, y });

// ─── Path definitions ─────────────────────────────────────────
interface PathDef {
  pts:   Pt[];
  color: string;
  w:     number;   // stroke width in design units
  a:     number;   // base opacity
  dash?: [number, number];
}

const PATHS: PathDef[] = [
  // ── Left side: converging to CX,CY ──────────────────────────
  // Main center lane
  { pts: sampleBez(P(0,265), P(260,265), P(520,265), P(CX,CY)), color:BLUE,   w:1.20, a:0.60 },
  // Upper lane 1
  { pts: sampleBez(P(0,205), P(265,205), P(455,225), P(CX,CY)), color:BLUE,   w:0.90, a:0.50 },
  // Upper lane 2 (dashed)
  { pts: sampleBez(P(0,232), P(200,232), P(415,240), P(CX,CY)), color:GRAY,   w:0.65, a:0.38, dash:[5,7] },
  // Lower lane 1
  { pts: sampleBez(P(0,298), P(255,298), P(455,278), P(CX,CY)), color:BLUE,   w:0.90, a:0.48 },
  // Lower lane 2 (dashed)
  { pts: sampleBez(P(0,325), P(200,325), P(415,295), P(CX,CY)), color:GRAY,   w:0.65, a:0.35, dash:[5,7] },
  // Top thin track
  { pts: sampleBez(P(0,152), P(300,152), P(505,215), P(CX,CY)), color:BLUE_D, w:0.50, a:0.28 },
  // Bottom thin track
  { pts: sampleBez(P(0,365), P(305,365), P(515,298), P(CX,CY)), color:BLUE_D, w:0.50, a:0.22 },

  // ── Right side: diverging from CX,CY ────────────────────────
  // Main center lane
  { pts: sampleBez(P(CX,CY), P(880,265), P(1110,265), P(IW,265)), color:BLUE,   w:1.20, a:0.58 },
  // Upper lane 1
  { pts: sampleBez(P(CX,CY), P(855,235), P(1055,210), P(IW,200)), color:BLUE,   w:0.90, a:0.52 },
  // Upper lane 2 (dashed)
  { pts: sampleBez(P(CX,CY), P(845,248), P(1038,230), P(IW,228)), color:GRAY,   w:0.65, a:0.36, dash:[5,7] },
  // Lower lane 1
  { pts: sampleBez(P(CX,CY), P(875,280), P(1060,298), P(IW,308)), color:BLUE,   w:0.90, a:0.48 },
  // Lower lane 2 (dashed)
  { pts: sampleBez(P(CX,CY), P(845,290), P(1038,310), P(IW,322)), color:GRAY,   w:0.65, a:0.33, dash:[5,7] },
  // Top thin track
  { pts: sampleBez(P(CX,CY), P(955,210), P(1155,172), P(IW,158)), color:BLUE_D, w:0.50, a:0.26 },
  // Bottom thin track
  { pts: sampleBez(P(CX,CY), P(958,305), P(1162,335), P(IW,350)), color:BLUE_D, w:0.50, a:0.20 },
];

// ─── Featured nodes ───────────────────────────────────────────
interface NodeDef {
  x: number; y: number;
  type: 'circle' | 'square' | 'diamond';
  r: number;         // radius or half-size
  fill: string;
  glow: string;
  gs: number;        // glow size (canvas pixels after scaling)
  a: number;         // opacity
}

const NODES: NodeDef[] = [
  // CENTRAL blue square
  { x:CX,   y:CY,   type:'square',  r:9,   fill:BLUE,   glow:BLUE,   gs:32, a:0.92 },
  // Left cluster
  { x:185,  y:205,  type:'circle',  r:5,   fill:BLUE,   glow:BLUE,   gs:18, a:0.78 },
  { x:295,  y:265,  type:'circle',  r:4,   fill:BLUE,   glow:BLUE,   gs:14, a:0.68 },
  { x:408,  y:265,  type:'square',  r:5,   fill:AMBER,  glow:AMBER,  gs:20, a:0.82 },
  { x:478,  y:298,  type:'circle',  r:3.5, fill:BLUE,   glow:BLUE,   gs:12, a:0.58 },
  { x:182,  y:298,  type:'circle',  r:3.5, fill:VIOLET, glow:VIOLET, gs:14, a:0.62 },
  { x:488,  y:205,  type:'circle',  r:3,   fill:CYAN,   glow:CYAN,   gs:10, a:0.60 },
  // Right cluster
  { x:848,  y:242,  type:'circle',  r:6,   fill:VIOLET, glow:VIOLET, gs:22, a:0.78 },
  { x:730,  y:265,  type:'circle',  r:3.5, fill:AMBER,  glow:AMBER,  gs:14, a:0.72 },
  { x:958,  y:265,  type:'circle',  r:4.5, fill:BLUE,   glow:BLUE,   gs:16, a:0.68 },
  { x:1075, y:265,  type:'square',  r:4,   fill:GRAY_M, glow:BLUE,   gs:12, a:0.52 },
  { x:1195, y:200,  type:'circle',  r:4,   fill:CYAN,   glow:CYAN,   gs:14, a:0.62 },
  { x:1128, y:305,  type:'circle',  r:3,   fill:BLUE,   glow:BLUE,   gs:10, a:0.48 },
  { x:1248, y:265,  type:'diamond', r:4,   fill:BLUE,   glow:CYAN,   gs:12, a:0.55 },
];

// ─── Small junction dots along paths ──────────────────────────
const JUNCTIONS: Pt[] = [
  // Left
  P(92,205), P(188,206), P(318,213),
  P(85,265), P(172,265), P(385,265), P(542,265),
  P(92,298), P(205,298), P(332,290),
  P(135,228), P(245,234),
  P(135,290), P(245,282),
  P(568,205), P(618,232), P(650,248),
  P(568,298), P(620,278),
  // Right
  P(758,255), P(785,262), P(875,265),
  P(762,258), P(878,280), P(998,290),
  P(795,232), P(912,215), P(1048,208),
  P(1148,248), P(1278,263),
  P(1055,298), P(1185,310),
  P(812,242), P(908,258),
  P(1320,265), P(1358,265),
];

// ─── UI card fragments ─────────────────────────────────────────
interface CardLine { y: number; w: number; accent: boolean; }
interface CardDef { x:number; y:number; w:number; h:number; lines:CardLine[]; }

const CARDS: CardDef[] = [
  // Top-left
  { x:12, y:80,  w:132, h:62, lines:[
    {y:15, w:84,  accent:false},
    {y:25, w:102, accent:false},
    {y:35, w:65,  accent:true },   // amber-highlighted line
    {y:47, w:80,  accent:false},
  ]},
  // Mid-left
  { x:48, y:248, w:115, h:56, lines:[
    {y:13, w:75,  accent:false},
    {y:23, w:90,  accent:false},
    {y:33, w:55,  accent:false},
    {y:43, w:72,  accent:false},
  ]},
  // Lower-left
  { x:22, y:375, w:120, h:50, lines:[
    {y:13, w:80,  accent:false},
    {y:23, w:96,  accent:false},
    {y:33, w:60,  accent:false},
  ]},
  // Mid-left floating label
  { x:230, y:340, w:95, h:40, lines:[
    {y:12, w:62, accent:false},
    {y:22, w:48, accent:false},
    {y:32, w:70, accent:false},
  ]},
  // Left mid panel (at ~x=280)
  { x:275, y:195, w:108, h:48, lines:[
    {y:13, w:70, accent:false},
    {y:23, w:84, accent:false},
    {y:33, w:52, accent:false},
  ]},
  // Right: top-right
  { x:1105, y:95,  w:125, h:62, lines:[
    {y:15, w:88,  accent:false},
    {y:25, w:78,  accent:false},
    {y:35, w:95,  accent:true },   // amber line
    {y:47, w:65,  accent:false},
  ]},
  // Right: mid-right
  { x:1028, y:280, w:115, h:56, lines:[
    {y:13, w:82,  accent:false},
    {y:23, w:62,  accent:false},
    {y:33, w:88,  accent:false},
  ]},
  // Right: top-right small
  { x:1228, y:148, w:95,  h:45, lines:[
    {y:12, w:65, accent:false},
    {y:22, w:78, accent:false},
    {y:32, w:48, accent:false},
  ]},
  // Right: bottom panel
  { x:1045, y:388, w:118, h:48, lines:[
    {y:13, w:75,  accent:true },
    {y:23, w:90,  accent:false},
    {y:33, w:55,  accent:false},
  ]},
];

// ─── Waveforms ─────────────────────────────────────────────────
interface WaveDef { pts:Pt[]; color:string; a:number; }
const WAVES: WaveDef[] = [
  {
    // Bottom-left signal trace
    pts: [P(15,350),P(27,341),P(39,357),P(51,340),P(63,354),P(75,343),P(87,351),P(99,345),P(111,350)],
    color:CYAN, a:0.28,
  },
  {
    // Second left waveform (lower)
    pts: [P(15,378),P(24,373),P(33,383),P(42,371),P(51,380),P(60,375),P(69,379)],
    color:BLUE_D, a:0.20,
  },
  {
    // Top-right waveform
    pts: [P(948,162),P(962,153),P(976,168),P(990,150),P(1004,165),P(1018,155),P(1032,162),P(1046,156)],
    color:VIOLET, a:0.26,
  },
];

// ─── Pulse configurations ──────────────────────────────────────
interface PulseDef {
  pi:    number;   // path index into PATHS
  spd:   number;   // progress per frame (1/N frames for one traversal)
  col:   string;
  ph:    number;   // initial phase 0..1
  sz:    number;   // dot size
  trail: boolean;  // draw fading trail
}
const PULSE_DEFS: PulseDef[] = [
  { pi:0,  spd:1/280, col:BLUE,   ph:0.00, sz:2.8, trail:true  },
  { pi:0,  spd:1/280, col:BLUE,   ph:0.55, sz:2.5, trail:true  },
  { pi:1,  spd:1/240, col:BLUE,   ph:0.25, sz:2.5, trail:true  },
  { pi:3,  spd:1/255, col:BLUE,   ph:0.60, sz:2.5, trail:true  },
  { pi:7,  spd:1/305, col:BLUE,   ph:0.15, sz:2.8, trail:true  },
  { pi:8,  spd:1/260, col:BLUE,   ph:0.45, sz:2.5, trail:true  },
  { pi:10, spd:1/275, col:CYAN,   ph:0.80, sz:2.5, trail:false },
  { pi:12, spd:1/290, col:BLUE,   ph:0.35, sz:2.2, trail:false },
  // Anomaly pulses – amber, slow, rare
  { pi:2,  spd:1/480, col:AMBER,  ph:0.70, sz:2.5, trail:true  },
  { pi:9,  spd:1/520, col:AMBER,  ph:0.20, sz:2.5, trail:true  },
  // Violet
  { pi:1,  spd:1/340, col:VIOLET, ph:0.50, sz:2.2, trail:false },
  { pi:10, spd:1/380, col:VIOLET, ph:0.10, sz:2.2, trail:false },
];

// ─── Draw: static scene ───────────────────────────────────────
function drawStatic(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const sx = cw / IW;
  const sy = ch / IH;

  ctx.clearRect(0, 0, cw, ch);

  // Background
  ctx.fillStyle = '#080A0D';
  ctx.fillRect(0, 0, cw, ch);

  // Faint technical grid
  ctx.save();
  ctx.strokeStyle = 'rgba(60,80,120,0.06)';
  ctx.lineWidth = 0.5;
  const gsize = 40 * sx;
  for (let x = 0; x < cw; x += gsize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  const gsizeY = 40 * sy;
  for (let y = 0; y < ch; y += gsizeY) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }
  ctx.restore();

  // ── Draw paths ────────────────────────────────────────────
  for (const path of PATHS) {
    if (path.pts.length < 2) continue;
    ctx.save();
    ctx.setLineDash(path.dash ? path.dash.map(d => d * sx) : []);

    // Soft glow pass (wider, more transparent)
    ctx.globalAlpha = path.a * 0.30;
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.w * sx * 3.5;
    ctx.shadowColor = path.color;
    ctx.shadowBlur = 6 * sx;
    ctx.beginPath();
    ctx.moveTo(path.pts[0].x * sx, path.pts[0].y * sy);
    for (let i = 1; i < path.pts.length; i++) {
      ctx.lineTo(path.pts[i].x * sx, path.pts[i].y * sy);
    }
    ctx.stroke();

    // Crisp main stroke
    ctx.globalAlpha = path.a;
    ctx.lineWidth = path.w * sx;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(path.pts[0].x * sx, path.pts[0].y * sy);
    for (let i = 1; i < path.pts.length; i++) {
      ctx.lineTo(path.pts[i].x * sx, path.pts[i].y * sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Junction dots ──────────────────────────────────────────
  ctx.save();
  for (const d of JUNCTIONS) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = GRAY_M;
    ctx.beginPath();
    ctx.arc(d.x * sx, d.y * sy, 1.8 * sx, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── Featured nodes ─────────────────────────────────────────
  for (const n of NODES) {
    const nx = n.x * sx, ny = n.y * sy;
    ctx.save();
    ctx.globalAlpha = n.a;
    ctx.shadowColor = n.glow;
    ctx.shadowBlur = n.gs * sx;

    if (n.type === 'circle') {
      // Outer ring
      ctx.globalAlpha = n.a * 0.30;
      ctx.strokeStyle = n.glow;
      ctx.lineWidth = 0.8 * sx;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(nx, ny, n.r * sx * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      // Fill
      ctx.globalAlpha = n.a;
      ctx.shadowBlur = n.gs * sx;
      ctx.fillStyle = n.fill;
      ctx.beginPath();
      ctx.arc(nx, ny, n.r * sx, 0, Math.PI * 2);
      ctx.fill();
    } else if (n.type === 'square') {
      const hs = n.r * sx;
      // Border glow
      ctx.globalAlpha = n.a * 0.35;
      ctx.strokeStyle = n.glow;
      ctx.lineWidth = 1 * sx;
      ctx.shadowBlur = 0;
      ctx.strokeRect(nx - hs * 2, ny - hs * 2, hs * 4, hs * 4);
      // Fill
      ctx.globalAlpha = n.a;
      ctx.shadowBlur = n.gs * sx;
      ctx.fillStyle = n.fill;
      ctx.fillRect(nx - hs, ny - hs, hs * 2, hs * 2);
    } else if (n.type === 'diamond') {
      const hs = n.r * sx;
      ctx.globalAlpha = n.a;
      ctx.shadowBlur = n.gs * sx;
      ctx.fillStyle = n.fill;
      ctx.beginPath();
      ctx.moveTo(nx, ny - hs);
      ctx.lineTo(nx + hs, ny);
      ctx.lineTo(nx, ny + hs);
      ctx.lineTo(nx - hs, ny);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ── UI card fragments ──────────────────────────────────────
  for (const card of CARDS) {
    const cx = card.x * sx, cy = card.y * sy;
    const cw2 = card.w * sx, ch2 = card.h * sy;
    ctx.save();

    // Card background
    ctx.globalAlpha = 0.60;
    ctx.fillStyle = '#0C111A';
    ctx.strokeStyle = 'rgba(58,90,148,0.35)';
    ctx.lineWidth = 0.8 * sx;
    const r = 3 * sx;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cw2 - r, cy);
    ctx.arcTo(cx + cw2, cy, cx + cw2, cy + r, r);
    ctx.lineTo(cx + cw2, cy + ch2 - r);
    ctx.arcTo(cx + cw2, cy + ch2, cx + cw2 - r, cy + ch2, r);
    ctx.lineTo(cx + r, cy + ch2);
    ctx.arcTo(cx, cy + ch2, cx, cy + ch2 - r, r);
    ctx.lineTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text lines inside card
    for (const line of card.lines) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = line.accent ? AMBER : '#2A5A9A';
      const lineH = 3.5 * sy;
      ctx.fillRect(cx + 8 * sx, cy + line.y * sy, line.w * sx, lineH);
    }
    ctx.restore();
  }

  // ── Waveforms ──────────────────────────────────────────────
  for (const w of WAVES) {
    if (w.pts.length < 2) continue;
    ctx.save();
    ctx.globalAlpha = w.a;
    ctx.strokeStyle = w.color;
    ctx.lineWidth = 1.0 * sx;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w.pts[0].x * sx, w.pts[0].y * sy);
    for (let i = 1; i < w.pts.length; i++) {
      ctx.lineTo(w.pts[i].x * sx, w.pts[i].y * sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Center mask: fade outer edges to deepen center quiet zone
  const centerX = cw / 2, centerY = ch * 0.50;
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(cw, ch) * 0.55);
  grad.addColorStop(0,    'rgba(8,10,13,0.55)');
  grad.addColorStop(0.40, 'rgba(8,10,13,0.10)');
  grad.addColorStop(1.00, 'rgba(8,10,13,0)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);
  ctx.restore();
}

// ─── Draw: single pulse ────────────────────────────────────────
function drawPulse(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  progress: number,
  color: string,
  size: number,
  trail: boolean,
  sx: number,
  sy: number,
) {
  const idx = Math.floor(progress * (pts.length - 1));
  const pt = pts[Math.min(idx, pts.length - 1)];
  const px = pt.x * sx, py = pt.y * sy;

  ctx.save();

  // Trail: draw fading dots behind the pulse
  if (trail) {
    const trailLen = 12;
    for (let t = 1; t <= trailLen; t++) {
      const ti = Math.max(0, idx - t * 2);
      const tp = pts[ti];
      const alpha = (1 - t / trailLen) * 0.35;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tp.x * sx, tp.y * sy, size * sx * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Glow
  ctx.globalAlpha = 0.45;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * sx * 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, size * sx * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.globalAlpha = 0.90;
  ctx.shadowBlur = size * sx * 2;
  ctx.beginPath();
  ctx.arc(px, py, size * sx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────
export const HeroExecutionBackground: React.FC = () => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const staticRef    = useRef<HTMLCanvasElement | null>(null);  // offscreen
  const rafRef       = useRef<number>(0);
  const phasesRef    = useRef<number[]>(PULSE_DEFS.map(p => p.ph));
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Build static offscreen canvas
  const buildStatic = (w: number, h: number) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    if (ctx) drawStatic(ctx, w, h);
    staticRef.current = off;
  };

  const render = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !staticRef.current) return;
    const cw = canvas.width, ch = canvas.height;
    const sx = cw / IW, sy = ch / IH;

    // Blit the static layer
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(staticRef.current, 0, 0);

    // Draw animated pulses on top
    const phases = phasesRef.current;
    for (let i = 0; i < PULSE_DEFS.length; i++) {
      const def = PULSE_DEFS[i];
      const path = PATHS[def.pi];
      if (!path) continue;
      drawPulse(ctx, path.pts, phases[i], def.col, def.sz, def.trail, sx, sy);
      // Advance phase
      phases[i] = (phases[i] + def.spd) % 1;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      buildStatic(canvas.width, canvas.height);
      // Static only for reduced motion
      if (reducedMotion.current) {
        const ctx = canvas.getContext('2d');
        if (ctx && staticRef.current) ctx.drawImage(staticRef.current, 0, 0);
      }
    };

    resize();

    if (!reducedMotion.current) {
      const loop = () => {
        render(canvas);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};
