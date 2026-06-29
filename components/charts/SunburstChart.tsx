import React from 'react';
import { colors } from '../../constants/theme';
import type { SunburstData } from '../../lib/charts';

interface LayoutNode {
  name: string;
  level: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

function computeTotal(node: import('../../lib/charts').SunburstNode): number {
  if (!node.children?.length) return node.value ?? 1;
  return node.children.reduce((s, c) => s + computeTotal(c), 0);
}

function buildLayout(
  node: import('../../lib/charts').SunburstNode,
  level: number,
  startA: number,
  endA: number,
  palette: string[],
  colorIdx: { v: number },
  out: LayoutNode[],
) {
  const color = node.color ?? palette[colorIdx.v % palette.length];
  if (level > 0) {
    out.push({ name: node.name, level, startAngle: startA, endAngle: endA, color });
  }
  if (node.children?.length) {
    const total = computeTotal(node);
    let cur = startA;
    for (const child of node.children) {
      colorIdx.v++;
      const span = (computeTotal(child) / total) * (endA - startA);
      buildLayout(child, level + 1, cur, cur + span, palette, colorIdx, out);
      cur += span;
    }
  }
}

function annularPath(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
  const cos2 = Math.cos(a2), sin2 = Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  const ix1 = cx + r1 * cos1, iy1 = cy + r1 * sin1;
  const ox1 = cx + r2 * cos1, oy1 = cy + r2 * sin1;
  const ox2 = cx + r2 * cos2, oy2 = cy + r2 * sin2;
  const ix2 = cx + r1 * cos2, iy2 = cy + r1 * sin2;
  return (
    `M${ix1.toFixed(2)},${iy1.toFixed(2)} ` +
    `L${ox1.toFixed(2)},${oy1.toFixed(2)} ` +
    `A${r2},${r2} 0 ${large} 1 ${ox2.toFixed(2)},${oy2.toFixed(2)} ` +
    `L${ix2.toFixed(2)},${iy2.toFixed(2)} ` +
    `A${r1},${r1} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)}Z`
  );
}

interface Props {
  data: SunburstData;
  size?: number;
}

export function SunburstChart({ data, size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.44;
  const centerR = size * 0.1;
  const palette = colors.chart;

  const nodes: LayoutNode[] = [];
  // Start at top (-π/2) going clockwise (full 2π)
  buildLayout(data.root, 0, -Math.PI / 2, (3 * Math.PI) / 2, palette, { v: 0 }, nodes);

  const maxLevel = Math.max(...nodes.map((n) => n.level), 1);
  const ringW = (maxR - centerR) / maxLevel;

  function getRadii(level: number) {
    return {
      inner: centerR + (level - 1) * ringW + 1,
      outer: centerR + level * ringW - 1,
    };
  }

  // Collect unique level-1 nodes for legend
  const level1 = nodes.filter((n) => n.level === 1);

  return (
    <div>
      <svg width={size} height={size}>
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={centerR - 2} fill={`${palette[0]}30`} stroke={palette[0]} strokeWidth={1.5} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill={colors.text} fontSize={9} fontWeight="600">
          {data.root.name.length > 9 ? `${data.root.name.slice(0, 8)}…` : data.root.name}
        </text>

        {nodes.map((node, i) => {
          const { inner, outer } = getRadii(node.level);
          const span = node.endAngle - node.startAngle;
          const mid = (node.startAngle + node.endAngle) / 2;
          const labelR = (inner + outer) / 2;
          const lx = cx + labelR * Math.cos(mid);
          const ly = cy + labelR * Math.sin(mid);
          // Show label only if segment is wide and ring is tall enough
          const showLabel = span > 0.3 && outer - inner > 14;

          return (
            <g key={i}>
              <path
                d={annularPath(cx, cy, inner, outer, node.startAngle, node.endAngle)}
                fill={`${node.color}85`}
                stroke={colors.bg}
                strokeWidth={1.2}
              />
              {showLabel && (
                <text
                  x={lx}
                  y={ly + 3}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={Math.max(7, Math.min(10, (span * 30) | 0))}
                  fontWeight="500"
                >
                  {node.name.length > 11 ? `${node.name.slice(0, 10)}…` : node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {level1.length > 0 && level1.length <= 8 && (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
          {level1.map((n, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n.color }} />
              <span style={{ color: colors.textSecondary, fontSize: 10 }}>{n.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
