import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import api, { absUrl } from "@/lib/api";
import {
  Upload,
  History,
  BarChart3,
  Shield,
  TrendingUp,
  Flag,
  Camera,
  FileText,
  ChevronRight,
  Clock,
  AlertTriangle,
  MapPin,
} from "lucide-react";

const roleGreeting = {
  user: "Report traffic scenes and help improve city flow.",
  police: "Monitor city feeds and flag incidents.",
  analyzer: "Scan the aggregate pulse of urban traffic.",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/analyses")
      .then((r) => setRecent(r.data.slice(0, 6)))
      .catch(() => setRecent([]));

    if (user?.role === "analyzer" || user?.role === "police") {
      api
        .get("/analytics/summary")
        .then((r) => setStats(r.data))
        .catch(() => {});
    }
  }, [user]);

  if (user?.role === "user") {
    return <UserDashboard user={user} recent={recent} />;
  }

  return <StaffDashboard user={user} recent={recent} stats={stats} />;
}

/* ---------------- NORMAL USER DASHBOARD ---------------- */

function UserDashboard({ user, recent }) {
  const firstName = user?.name?.split(" ")[0] || "User";

  const userStats = useMemo(() => {
    const total = recent.length;
    const high = recent.filter((a) => a.density === "high").length;
    const flagged = recent.filter((a) => a.flagged).length;
    const lastReport = recent[0];

    return { total, high, flagged, lastReport };
  }, [recent]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,229,255,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(6,214,160,0.08),transparent_35%),var(--bg)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-[color:var(--accent)]">
                <Camera size={14} />
                Citizen Traffic Report
              </div>

              <h1 className="font-heading mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Welcome, {firstName}. Help report traffic faster.
              </h1>

              <p className="mt-4 max-w-2xl text-base sm:text-lg text-[color:var(--text-secondary)]">
                Upload a road image or video, choose the traffic direction, and let City Eye analyze the traffic density.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/analyze"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-6 py-3 font-semibold text-black hover:bg-[color:var(--accent-hover)] transition-colors"
                  data-testid="user-dashboard-new-report"
                >
                  <Upload size={18} />
                  New Traffic Report
                </Link>

                <Link
                  to="/history"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3 font-semibold text-white hover:bg-white/[0.08] transition-colors"
                  data-testid="user-dashboard-my-reports"
                >
                  <History size={18} />
                  My Reports
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main user stats */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UserStatCard
            title="My Reports"
            value={userStats.total}
            subtitle="Reports submitted"
            Icon={FileText}
            color="var(--accent)"
          />

          <UserStatCard
            title="Heavy Traffic"
            value={userStats.high}
            subtitle="High density reports"
            Icon={AlertTriangle}
            color="var(--yellow)"
          />

          <UserStatCard
            title="Flagged"
            value={userStats.flagged}
            subtitle="Needs attention"
            Icon={Flag}
            color="var(--red)"
          />
        </section>

        {/* How it works + last report */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 ce-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-heading text-2xl">How reporting works</h2>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  Simple steps for normal users.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StepCard
                number="01"
                title="Upload scene"
                description="Choose a road photo or video from your device."
              />
              <StepCard
                number="02"
                title="Choose direction"
                description="Select where the traffic is coming from."
              />
              <StepCard
                number="03"
                title="Submit report"
                description="AI analyzes the scene and saves the result."
              />
            </div>
          </div>

          <div className="ce-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl">Last Report</h2>
              <Clock size={18} className="text-[color:var(--text-muted)]" />
            </div>

            {userStats.lastReport ? (
              <Link
                to={`/analysis/${userStats.lastReport.id}`}
                className="mt-5 block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                  <img
                    src={absUrl(userStats.lastReport.annotated_url)}
                    alt="Last traffic report"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {userStats.lastReport.counts?.total ?? 0} vehicles detected
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                      {new Date(userStats.lastReport.created_at).toLocaleString()}
                    </div>
                  </div>

                  <DensityPill density={userStats.lastReport.density} />
                </div>
              </Link>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                  <Upload size={20} />
                </div>
                <p className="font-semibold">No reports yet</p>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  Submit your first traffic report.
                </p>
                <Link
                  to="/analyze"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                >
                  Start now
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Recent reports */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl">Recent Reports</h2>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                Your latest uploaded traffic scenes.
              </p>
            </div>

            <Link
              to="/history"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] hover:underline"
            >
              View all
              <ChevronRight size={16} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="ce-card grid-bg p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                <MapPin size={24} />
              </div>
              <h3 className="font-heading text-2xl">No traffic reports yet</h3>
              <p className="mx-auto mt-2 max-w-md text-[color:var(--text-secondary)]">
                Upload a road scene and select the traffic direction to create your first report.
              </p>
              <Link
                to="/analyze"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 py-3 font-semibold text-black hover:bg-[color:var(--accent-hover)]"
              >
                <Upload size={17} />
                Create Report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {recent.map((a) => (
                <UserReportCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function UserStatCard({ title, value, subtitle, Icon, color }) {
  return (
    <div className="ce-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--text-secondary)]">{title}</p>
          <div className="mt-2 font-mono text-4xl font-bold" style={{ color }}>
            {value}
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">{subtitle}</p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{
            color,
            borderColor: `${color}55`,
            background: `${color}14`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="font-mono text-xs text-[color:var(--accent)]">{number}</div>
      <h3 className="mt-3 font-heading text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function UserReportCard({ a }) {
  return (
    <Link
      to={`/analysis/${a.id}`}
      className="group ce-card block overflow-hidden hover-lift"
      data-testid={`user-report-card-${a.id}`}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={absUrl(a.annotated_url)}
          alt="Traffic report"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-3 top-3">
          <DensityPill density={a.density} />
        </div>

        <div className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-mono uppercase backdrop-blur-md">
          {a.media_type}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl">
              {a.counts?.total ?? 0} vehicles detected
            </h3>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              {new Date(a.created_at).toLocaleString()}
            </p>
          </div>

          <ChevronRight
            size={18}
            className="mt-1 text-[color:var(--text-muted)] transition-transform group-hover:translate-x-1"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
          <MapPin size={14} />
          Traffic scene report
        </div>
      </div>
    </Link>
  );
}

function DensityPill({ density }) {
  const color =
    density === "high"
      ? "var(--red)"
      : density === "medium"
      ? "var(--yellow)"
      : "var(--green)";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md"
      style={{
        color,
        borderColor: `${color}66`,
        background: `${color}18`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {density || "low"}
    </div>
  );
}

/* ---------------- POLICE / ANALYZER DASHBOARD: OLD DESIGN KEPT ---------------- */

function StaffDashboard({ user, recent, stats }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div
              className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--accent)]"
              data-testid="dashboard-role-tag"
            >
              {user?.role?.toUpperCase()} · COMMAND
            </div>
            <h1
              className="font-heading text-4xl sm:text-5xl font-bold mt-2"
              data-testid="dashboard-heading"
            >
              Welcome back, {user?.name?.split(" ")[0] || "Operator"}.
            </h1>
            <p className="text-[color:var(--text-secondary)] mt-2">
              {roleGreeting[user?.role]}
            </p>
          </div>

          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] transition-colors"
            data-testid="dashboard-analyze-cta"
          >
            <Upload size={16} /> Analyze New Scene
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="dashboard-stats">
          <StatCard
            label="My Analyses"
            value={user?.role === "user" ? recent.length : stats?.total_analyses ?? "—"}
            Icon={History}
          />
          <StatCard
            label="High Density"
            value={stats?.by_density?.high ?? "—"}
            Icon={TrendingUp}
            color="var(--red)"
          />
          <StatCard
            label="Flagged"
            value={stats?.flagged ?? "—"}
            Icon={Flag}
            color="var(--yellow)"
          />
          <StatCard
            label="Role"
            value={user?.role?.toUpperCase() || "USER"}
            Icon={user?.role === "police" ? Shield : BarChart3}
            color="var(--accent)"
          />
        </div>

        <div className="flex items-end justify-between mb-4">
          <h2 className="font-heading text-2xl">Recent scenes</h2>
          <Link
            to="/history"
            className="text-sm text-[color:var(--accent)] hover:underline"
            data-testid="dashboard-view-all-link"
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="ce-card p-10 text-center grid-bg">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              No scans yet
            </div>
            <div className="mt-2 text-[color:var(--text-secondary)]">
              Upload your first traffic scene to begin.
            </div>
            <Link
              to="/analyze"
              className="inline-flex mt-6 items-center gap-2 px-4 py-2 rounded-md border border-white/15 hover:bg-white/5"
            >
              <Upload size={14} /> Upload now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-recent-grid">
            {recent.map((a) => (
              <AnalysisTile key={a.id} a={a} />
            ))}
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
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          {label}
        </div>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="font-mono text-3xl font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export function AnalysisTile({ a }) {
  const color =
    a.density === "high"
      ? "var(--red)"
      : a.density === "medium"
      ? "var(--yellow)"
      : "var(--green)";

  return (
    <Link
      to={`/analysis/${a.id}`}
      className="ce-card hover-lift block overflow-hidden"
      data-testid={`analysis-tile-${a.id}`}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={absUrl(a.annotated_url)}
          alt="analysis"
          className="w-full h-full object-cover"
          loading="lazy"
        />

        <div
          className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
          style={{
            color,
            borderColor: `${color}66`,
            background: `${color}18`,
          }}
        >
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
          <div className="font-mono text-sm text-white">
            {a.counts?.total ?? 0} vehicles
          </div>
          <div className="text-xs text-[color:var(--text-muted)]">
            {new Date(a.created_at).toLocaleString()}
          </div>
        </div>

        <div className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border border-white/10 text-[color:var(--text-secondary)]">
          {a.media_type}
        </div>
      </div>
    </Link>
  );
}