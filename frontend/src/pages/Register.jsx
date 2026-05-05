import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, User, Shield, BarChart3 } from "lucide-react";

const roles = [
  { value: "user", label: "Citizen", desc: "Contribute and view your traffic submissions.", Icon: User, color: "var(--accent)" },
  { value: "police", label: "Police Officer", desc: "Monitor and flag incidents across the city.", Icon: Shield, color: "var(--yellow)" },
  { value: "analyzer", label: "Analyzer", desc: "View aggregate traffic analytics and trends.", Icon: BarChart3, color: "var(--green)" },
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      await register(form);
      toast.success("Account created");
      nav("/dashboard");
    } catch (ex) { setErr(ex.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative overflow-hidden grid-bg">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(ellipse at 30% 30%, rgba(0,229,255,0.15), transparent 60%)"
        }} />
        <div className="relative h-full p-12 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">join the grid</div>
            <div className="font-heading text-3xl mt-3 max-w-md">Three lenses on one city.</div>
            <p className="text-sm text-[color:var(--text-secondary)] mt-4 max-w-sm">
              City Eye gives citizens, officers and analysts their own view of the same real-time intelligence.
            </p>
          </div>
          <div className="space-y-3 max-w-sm">
            {roles.map(({ value, label, desc, Icon, color }) => (
              <div key={value} className="flex gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="w-9 h-9 rounded-md grid place-items-center" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-[color:var(--text-secondary)]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="register-form">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md grid place-items-center border border-white/10 bg-black">
              <Eye size={18} className="text-[color:var(--accent)]" />
            </div>
            <div>
              <div className="font-heading font-bold tracking-tight">CITY EYE</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[color:var(--text-muted)]">new enrollment</div>
            </div>
          </Link>

          <h1 className="font-heading text-3xl font-bold mb-2">Create account</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mb-6">
            Already have one? <Link to="/login" className="text-[color:var(--accent)] hover:underline" data-testid="register-login-link">Sign in</Link>
          </p>

          <div className="mb-5">
            <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Select role</label>
            <div className="grid grid-cols-3 gap-2" data-testid="register-role-selector">
              {roles.map(({ value, label, Icon, color }) => {
                const active = form.role === value;
                return (
                  <button
                    type="button" key={value}
                    onClick={() => setForm({ ...form, role: value })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${active ? "bg-white/5" : "bg-transparent hover:bg-white/[0.03]"}`}
                    style={{ borderColor: active ? color : "rgba(255,255,255,0.1)" }}
                    data-testid={`role-selector-${value}`}
                  >
                    <Icon size={18} style={{ color: active ? color : "var(--text-secondary)" }} />
                    <span className="text-xs" style={{ color: active ? "#fff" : "var(--text-secondary)" }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Full Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-12 px-4 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none transition mb-4"
            placeholder="Jane Doe" data-testid="register-name-input" />

          <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-12 px-4 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none transition mb-4"
            placeholder="you@city.gov" data-testid="register-email-input" />

          <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full h-12 px-4 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none transition mb-6"
            placeholder="Min 6 characters" data-testid="register-password-input" />

          {err && <div className="mb-4 text-sm text-[color:var(--red)]" data-testid="register-error">{err}</div>}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] transition-colors disabled:opacity-60"
            data-testid="register-submit-button">
            {loading ? "Creating..." : "Join City Eye"}
          </button>
        </form>
      </div>
    </div>
  );
}
