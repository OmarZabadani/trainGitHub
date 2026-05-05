import React from "react";

const phaseMap = {
  green: { label: "GREEN", color: "var(--green)" },
  yellow: { label: "YELLOW", color: "var(--yellow)" },
  red: { label: "RED", color: "var(--red)" },
};

export default function SignalCard({ signal }) {
  const p = phaseMap[signal.phase] || phaseMap.green;
  const allPhases = ["red", "yellow", "green"];
  return (
    <div className="ce-card p-6" data-testid="signal-card">
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] mb-4">
        Signal Recommendation
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="flex flex-col gap-2 p-2 rounded-lg bg-black/40 border border-white/10">
          {allPhases.map((ph) => {
            const active = ph === signal.phase;
            return (
              <div
                key={ph}
                className={`w-7 h-7 rounded-full ${active ? "signal-pulse" : "opacity-25"}`}
                style={{
                  background: phaseMap[ph].color,
                  boxShadow: active ? `0 0 20px ${phaseMap[ph].color}` : "none",
                }}
                data-testid={`signal-light-${ph}`}
              />
            );
          })}
        </div>
        <div>
          <div className="font-mono text-3xl font-semibold" style={{ color: p.color }} data-testid="signal-phase">
            {p.label}
          </div>
          <div className="font-mono text-sm text-[color:var(--text-secondary)] mt-1" data-testid="signal-duration">
            {signal.duration_seconds}s recommended
          </div>
        </div>
      </div>
      <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed" data-testid="signal-reason">
        {signal.reason}
      </p>
    </div>
  );
}
