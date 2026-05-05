import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { AnalysisTile } from "@/pages/Dashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function History() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/analyses").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  const filtered = filter === "all" ? list : list.filter((a) => a.density === filter);
  const isElevated = user?.role === "police" || user?.role === "analyzer";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--accent)]">History</div>
        <h1 className="font-heading text-4xl font-bold mt-2" data-testid="history-heading">
          {isElevated ? "All city submissions" : "Your analyses"}
        </h1>

        <div className="mt-6 flex items-center gap-2" data-testid="history-filters">
          {["all", "low", "medium", "high"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-colors ${
                filter === f ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-[color:var(--text-secondary)] hover:bg-white/5"
              }`}
              data-testid={`history-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="ce-card p-10 text-center text-[color:var(--text-secondary)]">No analyses match this filter.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="history-grid">
              {filtered.map((a) => <AnalysisTile key={a.id} a={a} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
