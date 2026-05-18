import { useState, useEffect } from "react";
import {
  getOllamaStatus, setOllamaModel, testOllama,
  getModelStatus, trainMLModel, testMLModel,
} from "../../api/admin.api";

const fmt = iso =>
  iso ? new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : null;

const BtnPrimary = ({ children, ...props }) => (
  <button
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
               transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
    style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}
    {...props}
  >
    {children}
  </button>
);

const StatusPill = ({ on, label }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
    style={on
      ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
      : { background: "rgba(100,116,139,0.08)", color: "#64748b" }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#10b981" : "#94a3b8" }} />
    {label}
  </span>
);

const TestPanel = ({ onAsk, disabled, placeholder }) => {
  const [q,       setQ]       = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true); setResult(null); setErr("");
    try { setResult(await onAsk(q.trim())); }
    catch (e) { setErr(e.response?.data?.message || e.message || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && run()}
          placeholder={placeholder || "Ask a question…"}
          disabled={disabled || loading}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300
                     disabled:bg-slate-50 disabled:text-slate-400 text-slate-800 placeholder-slate-400" />
        <BtnPrimary onClick={run} disabled={disabled || !q.trim() || loading}>
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>}
          Test
        </BtnPrimary>
      </div>
      {err && <p className="text-xs mt-2 font-medium" style={{ color: "#CE1126" }}>{err}</p>}
      {result && (
        <div className="mt-3 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed"
          style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#334155" }}>
          {typeof result === "string" ? result : result.answer}
          {result.docsUsed !== undefined && (
            <p className="text-xs mt-2 pt-2 border-t border-slate-100 text-slate-400">
              Retrieved {result.docsUsed} document{result.docsUsed !== 1 ? "s" : ""} from the ML index
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const OllamaSection = () => {
  const [status,        setStatus]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  const reload = () => {
    setLoading(true);
    getOllamaStatus()
      .then(s => { setStatus(s); setSelectedModel(s.currentModel); })
      .catch(() => setStatus({ available: false, models: [], currentModel: "phi4-mini" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setOllamaModel(selectedModel);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="rounded-2xl h-40 animate-pulse bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
  );

  const available = status?.available;
  const models    = status?.models || [];

  return (
    <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-bold text-slate-800">Ollama — Local LLM</h2>
            <StatusPill on={available} label={available ? "Running" : "Offline"} />
          </div>
          <p className="text-xs text-slate-400">
            {available
              ? `${models.length} model${models.length !== 1 ? "s" : ""} installed`
              : "Not running — start Ollama, then refresh"}
          </p>
        </div>
        <button onClick={reload}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700
                     transition-colors px-2.5 py-1.5 rounded-xl hover:bg-slate-50">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {!available && (
        <div className="p-4 rounded-xl text-xs space-y-1.5 mb-4"
          style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
          <p className="font-bold" style={{ color: "#d97706" }}>Ollama is not running. To set it up:</p>
          <p className="text-slate-600">1. Download from <span className="font-mono font-semibold">ollama.com</span> and install</p>
          <p className="text-slate-600">2. Open a terminal and run:
            <span className="font-mono font-semibold ml-1 px-1.5 py-0.5 rounded-lg"
              style={{ background: "rgba(217,119,6,0.1)", color: "#b45309" }}>
              ollama pull phi4-mini
            </span>
          </p>
          <p className="text-slate-600">3. Ollama starts automatically — come back here and refresh</p>
        </div>
      )}

      {available && (
        <>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Active model</label>
            <div className="flex gap-2">
              {models.length > 0 ? (
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-800">
                  {models.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name}{m.size ? ` (${(m.size / 1e9).toFixed(1)} GB)` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  placeholder="e.g. phi4-mini"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400" />
              )}
              <BtnPrimary onClick={handleSave} disabled={saving || !selectedModel.trim()}>
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Saving…" : "Set model"}
              </BtnPrimary>
              {saved && (
                <span className="text-xs font-semibold self-center flex items-center gap-1" style={{ color: "#10b981" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
            </div>
            {models.length === 0 && (
              <p className="text-xs text-slate-400 mt-1.5">
                No models found. Run
                <span className="font-mono font-semibold ml-1 px-1.5 py-0.5 rounded-lg"
                  style={{ background: "#f1f5f9", color: "#475569" }}>
                  ollama pull phi4-mini
                </span>
                in a terminal.
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl text-xs space-y-1.5 mb-5"
            style={{ background: "rgba(0,35,149,0.04)", border: "1px solid rgba(0,35,149,0.1)" }}>
            <p className="font-bold" style={{ color: "#002395" }}>How answers are generated</p>
            <p className="text-slate-600">1. The ML retrieval index finds the most relevant published records for the question</p>
            <p className="text-slate-600">2. Those records are injected into a focused prompt (RAG)</p>
            <p className="text-slate-600">
              3. <span className="font-semibold text-slate-800">{status.currentModel}</span> reads only that context and composes a natural answer
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Test Ollama directly</p>
            <TestPanel onAsk={async q => testOllama(q)}
              placeholder="e.g. What happens during the Umhlanga ceremony?"
              disabled={!available} />
          </div>
        </>
      )}
    </div>
  );
};

const MLSection = () => {
  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [training, setTraining] = useState(false);
  const [trainLog, setTrainLog] = useState([]);
  const [trainErr, setTrainErr] = useState("");

  useEffect(() => {
    getModelStatus()
      .then(setStatus)
      .catch(() => setStatus({ untrained: true }))
      .finally(() => setLoading(false));
  }, []);

  const handleTrain = async () => {
    setTraining(true); setTrainLog(["Starting training pipeline…"]); setTrainErr("");
    try {
      const result = await trainMLModel();
      setTrainLog(result.logs || []);
      setStatus({ trainedAt: new Date().toISOString(), stats: result.stats, version: 2 });
    } catch (e) {
      setTrainErr(e.response?.data?.message || "Training failed.");
    } finally { setTraining(false); }
  };

  const isTrained = status && !status.untrained && status.trainedAt;

  if (loading) return (
    <div className="rounded-2xl h-36 animate-pulse bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
  );

  const STAT_COLORS = {
    Ceremonies: { bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)",   text: "#d97706"  },
    Lineage:    { bg: "rgba(0,35,149,0.06)",     border: "rgba(0,35,149,0.15)",   text: "#002395"  },
    Clans:      { bg: "rgba(124,58,237,0.08)",   border: "rgba(124,58,237,0.2)",  text: "#7c3aed"  },
    Songs:      { bg: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.2)",  text: "#10b981"  },
    Vocabulary: { bg: "rgba(100,116,139,0.08)",  border: "rgba(100,116,139,0.2)", text: "#64748b"  },
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-bold text-slate-800">Retrieval Index — TF-IDF + Naive Bayes</h2>
            <StatusPill on={isTrained} label={isTrained ? "Trained" : "Untrained"} />
          </div>
          <p className="text-xs text-slate-400">
            {isTrained
              ? `Last trained: ${fmt(status.trainedAt)} · ${status.stats?.total ?? 0} documents · ${status.stats?.vocab ?? 0} terms`
              : "Not trained — run training to enable Ollama RAG and the ML fallback"}
          </p>
        </div>
        <BtnPrimary onClick={handleTrain} disabled={training}>
          {training
            ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Training…</>
            : <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {isTrained ? "Retrain" : "Train now"}
              </>}
        </BtnPrimary>
      </div>

      {!isTrained && (
        <p className="text-xs text-slate-400 mb-4">
          The retrieval index powers both Ollama's RAG context and the standalone ML fallback.
          Train it after publishing new ceremonies or lineage records.
        </p>
      )}

      {isTrained && status.stats && (
        <div className="grid grid-cols-5 gap-2 mb-5">
          {[
            ["Ceremonies", status.stats.ceremonies],
            ["Lineage",    status.stats.lineages],
            ["Clans",      status.stats.clans],
            ["Songs",      status.stats.songs],
            ["Vocabulary", status.stats.vocab],
          ].map(([label, val]) => {
            const c = STAT_COLORS[label];
            return (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <p className="text-lg font-black" style={{ color: c.text }}>{val ?? "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {(trainLog.length > 0 || trainErr) && (
        <div className="mb-5">
          {trainErr && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-2">{trainErr}</div>
          )}
          <div className="rounded-xl p-4 font-mono text-xs space-y-0.5 max-h-44 overflow-y-auto"
            style={{ background: "#0f172a" }}>
            {trainLog.map((line, i) => (
              <div key={i}>
                <span className="mr-2 select-none" style={{ color: "#475569" }}>
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span style={{ color: "#4ade80" }}>{line}</span>
              </div>
            ))}
            {training && (
              <div className="flex items-center gap-2 mt-1" style={{ color: "#fbbf24" }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#fbbf24" }} />
                Running…
              </div>
            )}
          </div>
        </div>
      )}

      {isTrained && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Test retrieval index only</p>
          <TestPanel onAsk={async q => { const r = await testMLModel(q); return r; }}
            placeholder="e.g. Tell me about Swazi royal lineage" />
        </div>
      )}
    </div>
  );
};

const CHAIN = ["Gemini (primary)", "Ollama + RAG", "ML retrieval index", "Keyword search"];

const ModelTraining = () => (
  <div className="p-6 space-y-5">

    {/* Header */}
    <div className="relative rounded-2xl overflow-hidden px-6 py-5"
      style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
      <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
        <div className="flex-1" style={{ background: "#002395" }} />
        <div style={{ width: "5%", background: "#FFD600" }} />
        <div className="flex-1" style={{ background: "#CE1126" }} />
        <div style={{ width: "5%", background: "#FFD600" }} />
        <div className="flex-1" style={{ background: "#002395" }} />
      </div>
      <h1 className="text-xl font-black text-white">Local AI Settings</h1>
      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
        Configure the local AI fallback used when the Gemini API is unavailable
      </p>
    </div>

    {/* Fallback chain */}
    <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Fallback Chain</p>
      <div className="flex items-center gap-2 flex-wrap">
        {CHAIN.map((s, i, arr) => (
          <span key={s} className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={i === 0
                ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }
                : { background: "#f8fafc", color: "#475569", border: "1px solid #f1f5f9" }}>
              {s}
            </span>
            {i < arr.length - 1 && (
              <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>

    <OllamaSection />
    <MLSection />
  </div>
);

export default ModelTraining;
