import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { ArrowRight, ScanLine, Gauge, Network, ShieldAlert, Sparkles } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const dest = user && user !== false ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(5,6,10,0.65), rgba(5,6,10,0.95)), url('https://images.unsplash.com/photo-1764432340198-c997e41fd8c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHJhZGFyJTIwZGF0YSUyMGdyaWR8ZW58MHx8fHwxNzc3OTc4ODQyfDA&ixlib=rb-4.1.0&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 sm:pt-32 sm:pb-36">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/5" data-testid="hero-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] signal-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              YOLOv8 · Live Traffic Intelligence
            </span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] max-w-4xl" data-testid="hero-title">
            See the city move.<br />
            <span className="text-[color:var(--accent)] text-glow-cyan">Decide in milliseconds.</span>
          </h1>
          <p className="mt-6 text-lg text-[color:var(--text-secondary)] max-w-2xl leading-relaxed" data-testid="hero-subtitle">
            City Eye turns any traffic camera feed into instant vehicle counts, density readings
            and signal-timing recommendations — powered by real-time computer vision.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to={dest}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] transition-colors neon-glow-cyan"
              data-testid="hero-cta-primary"
            >
              Launch Command Center <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/15 hover:border-white/30 hover:bg-white/5 transition-colors"
              data-testid="hero-cta-secondary"
            >
              Login
            </Link>
          </div>

          {/* Quick metric chips */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { k: "Vehicle classes", v: "5+", hint: "car, bus, truck, moto, bike" },
              { k: "Inference", v: "~1s", hint: "per frame, CPU" },
              { k: "Roles", v: "3", hint: "citizen · police · analyzer" },
              { k: "Signals", v: "R·Y·G", hint: "adaptive timing" },
            ].map((m) => (
              <div key={m.k} className="ce-card p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{m.k}</div>
                <div className="font-mono text-2xl text-white mt-1">{m.v}</div>
                <div className="text-xs text-[color:var(--text-secondary)] mt-1">{m.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--accent)]">Capabilities</div>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mt-2">Built for the modern control room.</h2>
          </div>
          <p className="text-[color:var(--text-secondary)] max-w-md">
            A modular pipeline — preprocess, detect, decide. Swap cameras, not code.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="features-grid">
          {[
            { Icon: ScanLine, title: "Real-time Detection", body: "Upload an image or a traffic video clip. YOLOv8 detects vehicles with bounding boxes and class confidence." },
            { Icon: Gauge, title: "Density Intelligence", body: "Every scene is scored Low, Medium, or High with a continuous density index for downstream control loops." },
            { Icon: Network, title: "Signal Recommendation", body: "The system suggests a Red / Yellow / Green phase and duration tuned to current congestion." },
            { Icon: ShieldAlert, title: "Police Oversight", body: "Officers can flag incidents, add notes and monitor all submissions across the city in one feed." },
            { Icon: Sparkles, title: "Analyst Dashboard", body: "Traffic analysts get aggregate counts, density breakdowns and trend charts for reports." },
            { Icon: Eye2, title: "Citizen Access", body: "Citizens can contribute their own footage to help build a smarter, more responsive city." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="ce-card p-6 hover-lift">
              <Icon size={22} className="text-[color:var(--accent)]" />
              <h3 className="font-heading text-xl mt-4">{title}</h3>
              <p className="text-sm text-[color:var(--text-secondary)] mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-white/10 grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--accent)]">Pipeline</div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl mt-2 max-w-2xl">From raw pixels to policy in four steps.</h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Capture", d: "Drop a traffic image or short video clip into City Eye." },
              { n: "02", t: "Preprocess", d: "Resize + CLAHE contrast enhancement for consistent inputs." },
              { n: "03", t: "Detect", d: "YOLOv8 identifies cars, buses, trucks, motorcycles, bikes." },
              { n: "04", t: "Decide", d: "Density tier + signal recommendation are produced instantly." },
            ].map((s) => (
              <div key={s.n} className="ce-card p-6">
                <div className="font-mono text-xs text-[color:var(--text-muted)]">STEP {s.n}</div>
                <div className="font-heading text-2xl mt-2">{s.t}</div>
                <p className="text-sm text-[color:var(--text-secondary)] mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap justify-between items-center gap-4 text-sm text-[color:var(--text-muted)]">
          <div className="font-mono">© {new Date().getFullYear()} CITY EYE · smart-city intelligence</div>
          <div className="font-mono uppercase tracking-[0.14em] text-xs">powered by YOLOv8 · FastAPI · React</div>
        </div>
      </footer>
    </div>
  );
}

// Local icon alias to avoid duplicate Eye import
function Eye2(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 22} height={props.size || 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
