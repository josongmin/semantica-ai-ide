/**
 * LayerDiagram — SVG visualization of architecture layers
 *
 * Shows horizontal layers stacked vertically with dependency arrows
 * and red dashed lines for violations that cross layers.
 */

import { memo, useMemo } from "react";

import type { ArchLayer, ArchViolationItem } from "../model/types";

// ─── Constants ──────────────────────────────────────────

const LAYER_HEIGHT = 44;
const LAYER_GAP = 12;
const PADDING_X = 12;
const PADDING_Y = 16;
const SVG_WIDTH = 196;

// ─── Helpers ────────────────────────────────────────────

/** Map violation kind to the layer indices it crosses. */
function getViolationLayerIndices(
  violation: ArchViolationItem,
  layers: readonly ArchLayer[],
): [number, number] | null {
  const srcIdx = layers.findIndex((l) => l.modules.some((m) => violation.sourceModule.includes(m)));
  const tgtIdx = layers.findIndex((l) => l.modules.some((m) => violation.targetModule.includes(m)));
  if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return null;
  return [srcIdx, tgtIdx];
}

function countViolationsForLayer(
  layerIdx: number,
  violations: readonly ArchViolationItem[],
  layers: readonly ArchLayer[],
): number {
  let count = 0;
  for (const v of violations) {
    const indices = getViolationLayerIndices(v, layers);
    if (indices && (indices[0] === layerIdx || indices[1] === layerIdx)) {
      count++;
    }
  }
  return count;
}

// ─── Component ──────────────────────────────────────────

export const LayerDiagram = memo(function LayerDiagram({
  layers,
  violations,
}: {
  readonly layers: readonly ArchLayer[];
  readonly violations: readonly ArchViolationItem[];
}) {
  const svgHeight = PADDING_Y * 2 + layers.length * LAYER_HEIGHT + (layers.length - 1) * LAYER_GAP;
  const layerWidth = SVG_WIDTH - PADDING_X * 2;

  // Valid dependency lines (adjacent layers)
  const validEdges = useMemo(() => {
    const edges: { from: number; to: number }[] = [];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer === undefined) continue;
      for (const depId of layer.allowedDependencies) {
        const targetIdx = layers.findIndex((l) => l.id === depId);
        if (targetIdx !== -1 && targetIdx !== i) {
          edges.push({ from: i, to: targetIdx });
        }
      }
    }
    return edges;
  }, [layers]);

  // Violation lines crossing layers
  const violationEdges = useMemo(() => {
    const seen = new Set<string>();
    const edges: { from: number; to: number }[] = [];
    for (const v of violations) {
      const indices = getViolationLayerIndices(v, layers);
      if (!indices) continue;
      const key = `${indices[0]}-${indices[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: indices[0], to: indices[1] });
    }
    return edges;
  }, [violations, layers]);

  const layerY = (idx: number) => PADDING_Y + idx * (LAYER_HEIGHT + LAYER_GAP);

  return (
    <div className="flex flex-col items-center p-3">
      <span className="mb-2 text-2xs font-medium text-vsc-text-2">Layer Architecture</span>
      <svg
        width={SVG_WIDTH}
        height={svgHeight}
        viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* Valid dependency arrows */}
        {validEdges.map((edge) => {
          const fromY = layerY(edge.from) + LAYER_HEIGHT;
          const toY = layerY(edge.to);
          const x = SVG_WIDTH - PADDING_X - 16;
          return (
            <line
              key={`valid-${edge.from}-${edge.to}`}
              x1={x}
              y1={fromY}
              x2={x}
              y2={toY}
              stroke="var(--color-vsc-border)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* Violation arrows (red dashed) */}
        {violationEdges.map((edge) => {
          const fromCenterY = layerY(edge.from) + LAYER_HEIGHT / 2;
          const toCenterY = layerY(edge.to) + LAYER_HEIGHT / 2;
          const x = PADDING_X + 12;
          return (
            <line
              key={`viol-${edge.from}-${edge.to}`}
              x1={x}
              y1={fromCenterY}
              x2={x}
              y2={toCenterY}
              stroke="var(--color-vsc-error)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.8}
            />
          );
        })}

        {/* Layer rectangles */}
        {layers.map((layer, idx) => {
          const y = layerY(idx);
          const violCount = countViolationsForLayer(idx, violations, layers);
          return (
            <g key={layer.id}>
              <rect
                x={PADDING_X}
                y={y}
                width={layerWidth}
                height={LAYER_HEIGHT}
                rx={6}
                fill={`${layer.color}15`}
                stroke={`${layer.color}40`}
                strokeWidth={1}
              />
              <text
                x={PADDING_X + 10}
                y={y + 18}
                fontSize={11}
                fontWeight={600}
                fill={layer.color}
              >
                {layer.name}
              </text>
              <text
                x={PADDING_X + 10}
                y={y + 33}
                fontSize={9}
                fill="var(--color-vsc-text-ghost)"
              >
                {layer.modules.length} module{layer.modules.length !== 1 ? "s" : ""}
              </text>

              {/* Violation count badge */}
              {violCount > 0 && (
                <>
                  <circle
                    cx={PADDING_X + layerWidth - 16}
                    cy={y + LAYER_HEIGHT / 2}
                    r={10}
                    fill="color-mix(in srgb, var(--color-vsc-error) 19%, transparent)"
                  />
                  <text
                    x={PADDING_X + layerWidth - 16}
                    y={y + LAYER_HEIGHT / 2 + 4}
                    fontSize={9}
                    fontWeight={700}
                    fill="var(--color-vsc-error)"
                    textAnchor="middle"
                  >
                    {violCount}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});
