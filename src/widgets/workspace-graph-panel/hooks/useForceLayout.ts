import type { GraphEdge, GraphNode, WorkspaceGraphNodeId } from "../../../shared/protocol";

// ─── Layout: Force-directed (simple spring + charge) ──────────

export interface Vec2 { x: number; y: number }

const ZERO: Vec2 = { x: 0, y: 0 };

/** Safely get a Vec2 from the array, defaulting to a zero vector */
function v(arr: Vec2[], i: number): Vec2 {
  return arr[i] ?? ZERO;
}

export function runForceLayout(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  width: number,
  height: number,
  selectedId: string | null,
): Map<string, Vec2> {
  const W = width;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;

  const idToIdx = new Map(nodes.map((n, idx) => [n.id, idx]));
  const pos: Vec2[] = nodes.map(() => ({
    x: cx + (Math.random() - 0.5) * 80,
    y: cy + (Math.random() - 0.5) * 80,
  }));
  const vel: Vec2[] = nodes.map(() => ({ x: 0, y: 0 }));

  // Radial layout when focused: selected at center, others on ring
  const selId = selectedId as WorkspaceGraphNodeId | null;
  if (selId && idToIdx.has(selId)) {
    const selIdx = idToIdx.get(selId);
    if (selIdx !== undefined) {
      const conns = nodes.filter((n) => n.id !== selId);
      pos[selIdx] = { x: cx, y: cy };
      const r = Math.min(W, H) * 0.35;
      conns.forEach((n, i) => {
        const idx = idToIdx.get(n.id);
        if (idx === undefined) return;
        const angle = (i / conns.length) * Math.PI * 2 - Math.PI / 2;
        pos[idx] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      });
    }
    return new Map(nodes.map((n, i) => [n.id, v(pos, i)]));
  }

  // Force-directed for overview
  const LINK_LENGTH = 60;
  const LINK_STRENGTH = 0.3;
  const CHARGE = -200;
  const DAMPING = 0.85;
  const CENTER_STRENGTH = 0.02;

  for (let iter = 0; iter < 80; iter++) {
    const forces: Vec2[] = nodes.map(() => ({ x: 0, y: 0 }));

    // Spring forces along edges
    for (const e of edges) {
      const si = idToIdx.get(e.source);
      const ti = idToIdx.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const pSi = v(pos, si);
      const pTi = v(pos, ti);
      const fSi = v(forces, si);
      const fTi = v(forces, ti);
      const dx = pTi.x - pSi.x;
      const dy = pTi.y - pSi.y;
      const d = Math.hypot(dx, dy) !== 0 ? Math.hypot(dx, dy) : 0.1;
      const f = (d - LINK_LENGTH) * LINK_STRENGTH * (1 / d);
      const fx = f * dx;
      const fy = f * dy;
      fSi.x += fx;
      fSi.y += fy;
      fTi.x -= fx;
      fTi.y -= fy;
    }

    // Repulsion (charge)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pI = v(pos, i);
        const pJ = v(pos, j);
        const fI = v(forces, i);
        const fJ = v(forces, j);
        const dx = pJ.x - pI.x;
        const dy = pJ.y - pI.y;
        const d = Math.hypot(dx, dy) !== 0 ? Math.hypot(dx, dy) : 20;
        if (d < 120) {
          const f = (CHARGE * 20) / (d * d);
          const fx = (f * dx) / d;
          const fy = (f * dy) / d;
          fI.x -= fx;
          fI.y -= fy;
          fJ.x += fx;
          fJ.y += fy;
        }
      }
    }

    // Center gravity
    for (let i = 0; i < nodes.length; i++) {
      const fI = v(forces, i);
      const pI = v(pos, i);
      fI.x += (cx - pI.x) * CENTER_STRENGTH;
      fI.y += (cy - pI.y) * CENTER_STRENGTH;
    }

    // Integrate
    for (let i = 0; i < nodes.length; i++) {
      const vI = v(vel, i);
      const fI = v(forces, i);
      const pI = v(pos, i);
      vI.x = (vI.x + fI.x) * DAMPING;
      vI.y = (vI.y + fI.y) * DAMPING;
      pI.x += vI.x;
      pI.y += vI.y;
    }
  }

  return new Map(nodes.map((n, i) => [n.id, v(pos, i)]));
}
