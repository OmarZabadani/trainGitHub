import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api, { absUrl } from "@/lib/api";
import DensityMeter from "@/components/DensityMeter";
import SignalCard from "@/components/SignalCard";
import VehicleCounts from "@/components/VehicleCounts";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Flag, FlagOff } from "lucide-react";
import { toast } from "sonner";

export default function AnalysisDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await api.get(`/analyses/${id}`);
      setData(r.data);
      setNote(r.data.flag_note || "");
    } catch {
      setData(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const flag = async () => {
    setBusy(true);
    try {
      await api.post(`/analyses/${id}/flag`, { note });
      toast.success("Incident flagged");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to flag"); } finally { setBusy(false); }
  };

  const unflag = async () => {
    setBusy(true);
    try {
      await api.post(`/analyses/${id}/unflag`);
      toast.success("Flag removed");
      load();
    } catch (e) { toast.error("Failed"); } finally { setBusy(false); }
  };

  if (data === null) return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10 text-[color:var(--text-secondary)] font-mono text-sm">Loading scene…</div>
    </div>
  );
  if (data === false) return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">Analysis not found.</div>
    </div>
  );

  const isPolice = user?.role === "police";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/history" className="inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-white mb-6" data-testid="analysis-back-link">
          <ArrowLeft size={14} /> Back to history
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--accent)]">Scene #{data.id.slice(0, 8)}</div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mt-2" data-testid="analysis-title">
              {data.counts.total} vehicles · {data.density.toUpperCase()} density
            </h1>
            <div className="text-sm text-[color:var(--text-secondary)] mt-1 font-mono">
              {new Date(data.created_at).toLocaleString()} · by {data.user_email}
            </div>
          </div>
          {data.flagged && (
            <div className="px-3 py-1.5 rounded-full border border-[color:var(--red)]/40 bg-[color:var(--red)]/15 text-[color:var(--red)] text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <Flag size={12} /> flagged{data.flag_note ? ` — ${data.flag_note}` : ""}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 ce-card overflow-hidden" data-testid="analysis-annotated-image">
            <img src={absUrl(data.annotated_url)} alt="annotated" className="w-full max-h-[600px] object-contain bg-black" />
            <div className="p-4 flex items-center justify-between border-t border-white/10">
              <div className="font-mono text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Annotated Output · {data.media_type}</div>
              {data.media_type === "video" && (
                <a href={absUrl(data.original_url)} target="_blank" rel="noopener" className="text-xs font-mono text-[color:var(--accent)] hover:underline">
                  Download original video ↗
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <DensityMeter density={data.density} score={data.density_score} total={data.counts.total} />
            <SignalCard signal={data.signal} />
          </div>

          <div className="lg:col-span-2">
            <VehicleCounts counts={data.counts} />
          </div>

          {isPolice && (
            <div className="ce-card p-6" data-testid="police-flag-panel">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] mb-3">Police Action</div>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full h-24 rounded-md bg-black/40 border border-white/10 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30 outline-none p-3 text-sm mb-4"
                placeholder="Incident note (optional)"
                data-testid="police-flag-note"
              />
              {data.flagged ? (
                <button onClick={unflag} disabled={busy}
                  className="w-full h-11 rounded-md border border-white/15 hover:bg-white/5 inline-flex items-center justify-center gap-2"
                  data-testid="police-unflag-button">
                  <FlagOff size={14} /> Remove flag
                </button>
              ) : (
                <button onClick={flag} disabled={busy}
                  className="w-full h-11 rounded-md bg-[color:var(--red)] text-white inline-flex items-center justify-center gap-2 hover:opacity-90"
                  data-testid="police-flag-button">
                  <Flag size={14} /> Flag as incident
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
