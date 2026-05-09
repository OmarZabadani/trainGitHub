import React, { useEffect, useState } from "react";
import { ArrowRightLeft, AlertTriangle, Activity } from "lucide-react";

const phaseMeta = {
  green: { label: "GREEN", color: "var(--green)", hex: "#06D6A0" },
  yellow: { label: "YELLOW", color: "var(--yellow)", hex: "#FFBA08" },
  red: { label: "RED", color: "var(--red)", hex: "#FF3B30" },
};

const priorityMeta = {
  critical: { label: "CRITICAL", color: "var(--red)" },
  high: { label: "HIGH", color: "var(--yellow)" },
  normal: { label: "NORMAL", color: "var(--accent)" },
  low: { label: "LOW", color: "var(--green)" },
};

function TrafficLight({ activePhase, size = 140, animated = true }) {
  return (
    <div
      className="flex flex-col gap-3 items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-3 shadow-inner"
      style={{ width: size * 0.55, height: size }}
      data-testid="traffic-light"
    >
      {["red", "yellow", "green"].map((ph) => {
        const active = ph === activePhase;
        const m = phaseMeta[ph];
        return (
          <div
            key={ph}
            className={`rounded-full transition-all ${active && animated ? "signal-pulse" : ""}`}
            style={{
              width: size * 0.32,
              height: size * 0.32,
              background: active ? m.hex : "rgba(255,255,255,0.06)",
              boxShadow: active ? `0 0 30px ${m.hex}, inset 0 0 14px rgba(255,255,255,0.35)` : "inset 0 0 8px rgba(0,0,0,0.6)",
              border: active ? `1px solid ${m.hex}` : "1px solid rgba(255,255,255,0.08)",
              opacity: active ? 1 : 0.35,
            }}
            data-testid={`traffic-light-${ph}${active ? "-active" : ""}`}
          />
        );
      })}
    </div>
  );
}

export default function SignalCard({ signal }) {
  const p = phaseMeta[signal.phase] || phaseMeta.green;
  const cross = phaseMeta[signal.cross_street_phase] || phaseMeta.red;
  const pr = priorityMeta[signal.priority] || priorityMeta.normal;

  // Countdown that loops the recommended duration — pure cosmetic
  const [seconds, setSeconds] = useState(signal.duration_seconds || 30);
  useEffect(() => {
    setSeconds(signal.duration_seconds || 30);
    const id = setInterval(() => {
      setSeconds((s) => (s <= 1 ? signal.duration_seconds || 30 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [signal.duration_seconds]);

  return (
    <div className="ce-card p-6 relative overflow-hidden" data-testid="signal-card"
         style={{ background: `radial-gradient(ellipse at top right, ${p.hex}10, transparent 60%), var(--surface)` }}>
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] flex items-center gap-2">
          <Activity size={12} className="text-[color:var(--accent)]" />
          AI Signal Decision
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border"
          style={{ color: pr.color, borderColor: `${pr.color}55`, background: `${pr.color}18` }}
          data-testid="signal-priority"
        >
          {pr.label} priority
        </span>
      </div>

      {/* Decision banner */}
      <div className="rounded-xl p-4 mb-5 border"
           style={{
             borderColor: `${p.hex}40`,
             background: `linear-gradient(180deg, ${p.hex}18, ${p.hex}05)`,
           }}>
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-secondary)] mb-1">
          Recommended Action
        </div>
        <div className="font-heading text-xl sm:text-2xl font-bold" style={{ color: p.hex }} data-testid="signal-action">
          {signal.action || `${p.label} ${signal.duration_seconds}s`}
        </div>
      </div>

      {/* Lights + counters */}
      <div className="flex items-center gap-5">
        <TrafficLight activePhase={signal.phase} />

        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Approach</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-semibold" style={{ color: p.hex }} data-testid="signal-phase">
              {p.label}
            </span>
            <span className="font-mono text-xs text-[color:var(--text-secondary)]">phase</span>
          </div>

          <div className="mt-3 rounded-md bg-black/40 border border-white/10 p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Hold for</div>
              <div className="text-[10px] font-mono text-[color:var(--text-muted)]">target {signal.duration_seconds}s</div>
            </div>
            <div className="font-mono text-4xl font-semibold mt-1" style={{ color: p.hex }} data-testid="signal-countdown">
              {String(seconds).padStart(2, "0")}<span className="text-base text-[color:var(--text-muted)] ml-1">s</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(seconds / (signal.duration_seconds || 30)) * 100}%`,
                  background: p.hex,
                  boxShadow: `0 0 12px ${p.hex}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cross street */}
      <div className="mt-5 flex items-center gap-3 p-3 rounded-md border border-white/10 bg-white/[0.02]"
           data-testid="signal-cross-street">
        <ArrowRightLeft size={16} className="text-[color:var(--text-secondary)]" />
        <div className="flex-1 flex items-center justify-between">
          <div className="text-xs text-[color:var(--text-secondary)]">Cross-street</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: cross.hex, boxShadow: `0 0 8px ${cross.hex}` }} />
            <span className="font-mono text-sm" style={{ color: cross.hex }}>{cross.label}</span>
            <span className="font-mono text-xs text-[color:var(--text-muted)]">· {signal.cross_street_duration ?? 30}s</span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mt-4 flex gap-2 text-sm text-[color:var(--text-secondary)] leading-relaxed">
        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[color:var(--text-muted)]" />
        <p data-testid="signal-reason">{signal.reason}</p>
      </div>

      {signal.weighted_load != null && (
        <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Weighted load index · <span className="text-[color:var(--text-secondary)]">{signal.weighted_load}</span>
        </div>
      )}
    </div>
  );
}
