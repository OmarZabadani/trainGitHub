import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      await login(email, password);
      toast.success("Logged in");
      nav("/dashboard");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative overflow-hidden" style={{
        backgroundImage: "linear-gradient(180deg, rgba(5,6,10,0.35), rgba(5,6,10,0.85)), url('https://images.unsplash.com/photo-1644600387032-3194025de722?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHw0fHxjaXR5JTIwaW50ZXJzZWN0aW9uJTIwbmlnaHQlMjBhZXJpYWx8ZW58MHx8fHwxNzc3OTc4ODM1fDA&ixlib=rb-4.1.0&q=85')",
        backgroundSize: "cover", backgroundPosition: "center"
      }}>
        <div className="absolute bottom-10 left-10 right-10">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">control room access</div>
          <div className="font-heading text-3xl mt-2">Authorized personnel only.</div>
          <div className="text-sm text-[color:var(--text-secondary)] mt-2">Use your credentials to enter the City Eye command center.</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md grid place-items-center border border-white/10 bg-black">
              <Eye size={18} className="text-[color:var(--accent)]" />
            </div>
            <div>
              <div className="font-heading font-bold tracking-tight">CITY EYE</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                secure access
              </div>
            </div>
          </Link>

          <h1 className="font-heading text-3xl font-bold mb-2">Sign in</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mb-8">
            New here? <Link to="/register" className="text-[color:var(--accent)] hover:underline" data-testid="login-register-link">Create an account</Link>
          </p>

          <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none transition mb-4"
            placeholder="you@city.gov"
            data-testid="login-email-input"
          />
          <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none transition mb-6"
            placeholder="••••••••"
            data-testid="login-password-input"
          />

          {err && <div className="mb-4 text-sm text-[color:var(--red)]" data-testid="login-error">{err}</div>}

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] transition-colors disabled:opacity-60"
            data-testid="login-submit-button"
          >
            {loading ? "Authenticating..." : "Enter Command Center"}
          </button>

          <div className="mt-6 p-3 rounded-md border border-white/10 bg-white/[0.02] text-xs text-[color:var(--text-secondary)] font-mono">
            Demo analyzer: <span className="text-white">admin@cityeye.io</span> / <span className="text-white">admin123</span>
          </div>
        </form>
      </div>
    </div>
  );
}
