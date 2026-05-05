import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export default function AnalyzerPortal() {
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get("/analytics/summary").then((r) => setS(r.data)).catch(() => {});
  }, []);

  const trend = (s?.trend || []).map((t, i) => ({
    idx: i + 1,
    score: Math.round((t.score || 0) * 100),
    total: t.total || 0,
  }));

  const totals = s?.vehicle_totals || {};
  const byClass = [
    { name: "Car", value: totals.car || 0, fill: "#00E5FF" },
    { name: "Bus", value: totals.bus || 0, fill: "#FFBA08" },
    { name: "Truck", value: totals.truck || 0, fill: "#FF3B30" },
    { name: "Moto", value: totals.motorcycle || 0, fill: "#06D6A0" },
    { name: "Bike", value: totals.bicycle || 0, fill: "#FFFFFF" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--green)]">Analyzer Portal</div>
        <h1 className="font-heading text-4xl font-bold mt-2" data-testid="analyzer-heading">City Traffic Analytics</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">Aggregate intelligence across every scene processed by City Eye.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8" data-testid="analyzer-stats">
          <Stat label="Total Analyses" value={s?.total_analyses ?? 0} color="var(--accent)" />
          <Stat label="Low" value={s?.by_density?.low ?? 0} color="var(--green)" />
          <Stat label="Medium" value={s?.by_density?.medium ?? 0} color="var(--yellow)" />
          <Stat label="High" value={s?.by_density?.high ?? 0} color="var(--red)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="ce-card p-6">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] mb-4">Density Trend (last 14)</div>
            <div className="h-64" data-testid="analyzer-trend-chart">
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="idx" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#12131A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="score" stroke="#00E5FF" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ce-card p-6">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] mb-4">Vehicles by Class</div>
            <div className="h-64" data-testid="analyzer-class-chart">
              <ResponsiveContainer>
                <BarChart data={byClass}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#12131A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
