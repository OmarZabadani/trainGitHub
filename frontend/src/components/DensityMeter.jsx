import React from "react";

const densityMap = {
  low: { label: "LOW", color: "var(--green)", pct: 25 },
  medium: { label: "MEDIUM", color: "var(--yellow)", pct: 60 },
  high: { label: "HIGH", color: "var(--red)", pct: 95 },
};

export default function DensityMeter({ density, score, total }) {
  const d = densityMap[density] || densityMap.low;
  const pct = Math.max(10, Math.round((score || 0) * 100));
  return (
    <div className="ce-card p-6" data-testid="density-meter">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Traffic Density
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-mono font-medium border"
          style={{ color: d.color, borderColor: `${d.color}55`, background: `${d.color}15` }}
          data-testid="density-meter-badge"
        >
          {d.label}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <div className="font-mono text-5xl font-semibold text-white" data-testid="density-meter-total">{total}</div>
        <div className="text-sm text-[color:var(--text-secondary)]">vehicles detected</div>
      </div>
      <div className="density-bar">
        <span style={{ width: `${pct}%`, background: d.color, boxShadow: `0 0 18px ${d.color}66` }} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-[color:var(--text-muted)] uppercase tracking-wider">
        <span>clear</span><span>moderate</span><span>congested</span>
      </div>
    </div>
  );
}
