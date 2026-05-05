import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import api, { absUrl } from "@/lib/api";
import { Upload, History, BarChart3, Shield, TrendingUp, Flag } from "lucide-react";
import SignalCard from "@/components/SignalCard";

const roleGreeting = {
  user: "Ready to contribute your view of the city?",
  police: "Monitor city feeds and flag incidents.",
  analyzer: "Scan the aggregate pulse of urban traffic.",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/analyses").then((r) => setRecent(r.data.slice(0, 6))).catch(() => setRecent([]));
    if (user?.role === "analyzer" || user?.role === "police") {
      api.get("/analytics/summary").then((r) => setStats(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--accent)]" data-testid="dashboard-role-tag">
              {user?.role?.toUpperCase()} · COMMAND
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mt-2" data-testid="dashboard-heading">
              Welcome back, {user?.name?.split(" ")[0] || "Operator"}.
            </h1>
            <p className="text-[color:var(--text-secondary)] mt-2">{roleGreeting[user?.role]}</p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] transition-colors"
            data-testid="dashboard-analyze-cta"
          >
            <Upload size={16} /> Analyze New Scene
          </Link>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="dashboard-stats">
          <StatCard label="My Analyses" value={user?.role === "user" ? recent.length : stats?.total_analyses ?? "—"} Icon={History} />
          <StatCard label="High Density" value={stats?.by_density?.high ?? "—"} Icon={TrendingUp} color="var(--red)" />
          <StatCard label="Flagged" value={stats?.flagged ?? "—"} Icon={Flag} color="var(--yellow)" />
          <StatCard label="Role" value={user?.role?.toUpperCase() || "USER"} Icon={user?.role === "police" ? Shield : BarChart3} color="var(--accent)" />
        </div>

        {/* Latest decision */}
        {recent[0]?.signal && (
          <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="dashboard-latest-decision">
            <div className="lg:col-span-2 ce-card overflow-hidden">
              <Link to={`/analysis/${recent[0].id}`} className="block">
                <div className="aspect-video bg-black">
                  <img src={absUrl(recent[0].annotated_url)} alt="latest scene" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex items-center justify-between border-t border-white/10">
                  <div className="font-mono text-xs uppercase tracking-wider text-[color:var(--text-muted)]">
                    Latest Scene · {new Date(recent[0].created_at).toLocaleString()}
                  </div>
                  <div className="font-mono text-xs text-[color:var(--accent)] hover:underline">View detail →</div>
                </div>
              </Link>
            </div>
            <SignalCard signal={recent[0].signal} />
          </div>
        )}

        {/* Recent */}
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-heading text-2xl">Recent scenes</h2>
          <Link to="/history" className="text-sm text-[color:var(--accent)] hover:underline" data-testid="dashboard-view-all-link">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="ce-card p-10 text-center grid-bg">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">No scans yet</div>
            <div className="mt-2 text-[color:var(--text-secondary)]">Upload your first traffic scene to begin.</div>
            <Link to="/analyze" className="inline-flex mt-6 items-center gap-2 px-4 py-2 rounded-md border border-white/15 hover:bg-white/5">
              <Upload size={14} /> Upload now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-recent-grid">
            {recent.map((a) => <AnalysisTile key={a.id} a={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, Icon, color = "var(--text-secondary)" }) {
  return (
    <div className="ce-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{label}</div>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="font-mono text-3xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

export function AnalysisTile({ a }) {
  const color = a.density === "high" ? "var(--red)" : a.density === "medium" ? "var(--yellow)" : "var(--green)";
  return (
    <Link to={`/analysis/${a.id}`} className="ce-card hover-lift block overflow-hidden" data-testid={`analysis-tile-${a.id}`}>
      <div className="relative aspect-video bg-black">
        <img src={absUrl(a.annotated_url)} alt="analysis" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
          style={{ color, borderColor: `${color}66`, background: `${color}18` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          {a.density}
        </div>
        {a.flagged && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono text-[color:var(--red)] border border-[color:var(--red)]/40 bg-[color:var(--red)]/15">
            <Flag size={10} /> FLAGGED
          </div>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-sm text-white">{a.counts.total} vehicles</div>
          <div className="text-xs text-[color:var(--text-muted)]">{new Date(a.created_at).toLocaleString()}</div>
        </div>
        <div className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border border-white/10 text-[color:var(--text-secondary)]">
          {a.media_type}
        </div>
      </div>
    </Link>
  );
}
