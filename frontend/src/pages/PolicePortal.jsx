import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { AnalysisTile } from "@/pages/Dashboard";
import { Flag } from "lucide-react";

export default function PolicePortal() {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  useEffect(() => {
    api.get("/analyses").then((r) => setList(r.data)).catch(() => {});
    api.get("/analytics/summary").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const visible = showFlaggedOnly ? list.filter((a) => a.flagged) : list;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--yellow)]">Police Portal</div>
        <h1 className="font-heading text-4xl font-bold mt-2" data-testid="police-heading">City-wide Feed</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">Flag high-density incidents and review suspicious traffic patterns.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Stat label="Total Submissions" value={stats?.total_analyses ?? 0} color="var(--accent)" />
          <Stat label="High Density" value={stats?.by_density?.high ?? 0} color="var(--red)" />
          <Stat label="Medium" value={stats?.by_density?.medium ?? 0} color="var(--yellow)" />
          <Stat label="Flagged" value={stats?.flagged ?? 0} color="var(--red)" />
        </div>

        <div className="mt-8 flex items-center gap-2">
          <button
            onClick={() => setShowFlaggedOnly(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border ${!showFlaggedOnly ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-[color:var(--text-secondary)]"}`}
            data-testid="police-filter-all"
          >All</button>
          <button
            onClick={() => setShowFlaggedOnly(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border inline-flex items-center gap-1 ${showFlaggedOnly ? "bg-[color:var(--red)]/15 border-[color:var(--red)]/40 text-[color:var(--red)]" : "border-white/10 text-[color:var(--text-secondary)]"}`}
            data-testid="police-filter-flagged"
          ><Flag size={10} /> Flagged</button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="police-grid">
          {visible.map((a) => <AnalysisTile key={a.id} a={a} />)}
          {visible.length === 0 && (
            <div className="ce-card p-10 text-center text-[color:var(--text-secondary)] col-span-full">No submissions.</div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="ce-card p-5">
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{label}</div>
      <div className="font-mono text-3xl font-semibold mt-2" style={{ color }}>{value}</div>
    </div>
  );
}
