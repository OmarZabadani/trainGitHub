import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { toast } from "sonner";
import { UploadCloud, Image as ImageIcon, Film, Loader2 } from "lucide-react";

export default function Analyze() {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const onPick = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  const submit = async () => {
    if (!file) return toast.error("Please select a file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const endpoint = file.type.startsWith("video/") ? "/analyze/video" : "/analyze/image";
      const { data } = await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Analysis complete");
      nav(`/analysis/${data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const isVideo = file?.type?.startsWith("video/");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[color:var(--accent)]">Analyze</div>
        <h1 className="font-heading text-4xl font-bold mt-2">Run detection on a new scene.</h1>
        <p className="text-[color:var(--text-secondary)] mt-2 mb-10 max-w-2xl">
          Upload a traffic image or a short video clip. Our YOLOv8 pipeline preprocesses the frame,
          detects vehicles and returns density + signal guidance.
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="ce-card p-10 border-dashed border-2 border-white/15 hover:border-[color:var(--accent)]/50 transition-all cursor-pointer grid-bg"
          data-testid="upload-dropzone"
        >
          <input
            ref={inputRef} type="file" accept="image/*,video/*" className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
            data-testid="upload-file-input"
          />
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-full grid place-items-center bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-4">
              <UploadCloud className="text-[color:var(--accent)]" size={24} />
            </div>
            <div className="font-heading text-xl">Drop image or video here</div>
            <div className="text-sm text-[color:var(--text-secondary)] mt-1">or click to browse · jpg, png, mp4, webm</div>
            {file && (
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 font-mono text-xs" data-testid="upload-selected-file">
                {isVideo ? <Film size={14} /> : <ImageIcon size={14} />}
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
        </div>

        {preview && (
          <div className="mt-6 ce-card overflow-hidden" data-testid="upload-preview">
            <img src={preview} alt="preview" className="w-full max-h-[420px] object-contain bg-black" />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 justify-end">
          <button
            className="px-5 py-3 rounded-md border border-white/15 hover:bg-white/5 transition-colors"
            onClick={() => { setFile(null); setPreview(null); }}
            disabled={!file || busy}
            data-testid="upload-reset-button"
          >
            Reset
          </button>
          <button
            onClick={submit}
            disabled={!file || busy}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium hover:bg-[color:var(--accent-hover)] disabled:opacity-50 transition-colors neon-glow-cyan"
            data-testid="analyze-traffic-button"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Analyzing..." : "Run AI Analysis"}
          </button>
        </div>
      </main>
    </div>
  );
}
