import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, LogOut, Upload, History, LayoutDashboard, Shield, BarChart3 } from "lucide-react";

const roleMeta = {
  user: { label: "Citizen", color: "text-[color:var(--accent)]" },
  police: { label: "Police", color: "text-[color:var(--yellow)]" },
  analyzer: { label: "Analyzer", color: "text-[color:var(--green)]" },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const doLogout = async () => {
    await logout();
    nav("/");
  };

  const linkCls = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      loc.pathname === path
        ? "bg-white/10 text-white"
        : "text-[color:var(--text-secondary)] hover:text-white hover:bg-white/5"
    }`;

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
      style={{ background: "rgba(18,19,26,0.7)" }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="navbar-logo">
          <div className="w-9 h-9 rounded-md grid place-items-center border border-white/10 bg-black">
            <Eye size={18} className="text-[color:var(--accent)]" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-bold tracking-tight text-white">CITY EYE</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
              Traffic Intel · v1
            </div>
          </div>
        </Link>

        {user && user !== false && (
          <nav className="hidden md:flex items-center gap-1" data-testid="navbar-links">
            <Link to="/dashboard" className={linkCls("/dashboard")} data-testid="nav-dashboard">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/analyze" className={linkCls("/analyze")} data-testid="nav-analyze">
              <Upload size={16} /> Analyze
            </Link>
            <Link to="/history" className={linkCls("/history")} data-testid="nav-history">
              <History size={16} /> History
            </Link>
            {user.role === "police" && (
              <Link to="/police" className={linkCls("/police")} data-testid="nav-police">
                <Shield size={16} /> Police
              </Link>
            )}
            {user.role === "analyzer" && (
              <Link to="/analyzer" className={linkCls("/analyzer")} data-testid="nav-analyzer">
                <BarChart3 size={16} /> Analytics
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user && user !== false ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">
                <span className={`w-1.5 h-1.5 rounded-full ${user.role === "police" ? "bg-[color:var(--yellow)]" : user.role === "analyzer" ? "bg-[color:var(--green)]" : "bg-[color:var(--accent)]"}`} />
                <span className={`text-xs font-mono uppercase tracking-wider ${roleMeta[user.role]?.color || ""}`}>
                  {roleMeta[user.role]?.label || user.role}
                </span>
                <span className="text-xs text-[color:var(--text-secondary)]">· {user.name}</span>
              </div>
              <button
                onClick={doLogout}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors"
                data-testid="navbar-logout"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[color:var(--text-secondary)] hover:text-white px-3 py-2" data-testid="navbar-login">Login</Link>
              <Link
                to="/register"
                className="text-sm font-medium px-4 py-2 rounded-md bg-[color:var(--accent)] text-black hover:bg-[color:var(--accent-hover)] transition-colors"
                data-testid="navbar-register"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
