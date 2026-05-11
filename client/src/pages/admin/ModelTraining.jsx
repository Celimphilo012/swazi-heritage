import { useState, useEffect } from "react";
import {
  getOllamaStatus, setOllamaModel, testOllama,
  getModelStatus, trainMLModel, testMLModel,
} from "../../api/admin.api";

// ─── Shared helpers ────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

const StatusDot = ({ on }) => (
  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${on ? "bg-green-500" : "bg-gray-300"}`} />
);

const TestPanel = ({ onAsk, disabled, placeholder }) => {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={placeholder || "Ask a question…"}
          disabled={disabled || loading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                     disabled:bg-gray-50 disabled:text-gray-400" />
        <button onClick={run} disabled={disabled || !q.trim() || loading}
          className="btn-primary flex items-center gap-2 flex-shrink-0">
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>}
          Test
        </button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      {result && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-800 whitespace-pre-wrap">
          {typeof result === "string" ? result : result.answer}
          {result.docsUsed !== undefined && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
              Retrieved {result.docsUsed} document{result.docsUsed !== 1 ? "s" : ""} from the ML index
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Ollama section ────────────────────────────────────────────────────────────
const OllamaSection = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reload = () => {
    setLoading(true);
    getOllamaStatus()
      .then((s) => { setStatus(s); setSelectedModel(s.currentModel); })
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

  if (loading) return <div className="card animate-pulse h-40" />;

  const available = status?.available;
  const models = status?.models || [];

  return (
    <div className="card mb-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <StatusDot on={available} />
            Ollama — Local LLM
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {available
              ? `Running · ${models.length} model${models.length !== 1 ? "s" : ""} installed`
              : "Not running — start Ollama, then refresh"}
          </p>
        </div>
        <button onClick={reload} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {!available && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4 space-y-1">
          <p className="font-medium">Ollama is not running. To set it up:</p>
          <p>1. Download from <span className="font-mono">ollama.com</span> and install</p>
          <p>2. Open a terminal and run: <span className="font-mono bg-amber-100 px-1 rounded">ollama pull phi4-mini</span></p>
          <p>3. Ollama starts automatically — come back here and refresh</p>
        </div>
      )}

      {available && (
        <>
          {/* Model selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Active model</label>
            <div className="flex gap-2">
              {models.length > 0 ? (
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400">
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.size ? `(${(m.size / 1e9).toFixed(1)} GB)` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="e.g. phi4-mini"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              )}
              <button onClick={handleSave} disabled={saving || !selectedModel.trim()}
                className="btn-primary flex items-center gap-2 flex-shrink-0">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Saving…" : "Set model"}
              </button>
              {saved && <span className="text-xs text-green-600 self-center">Saved!</span>}
            </div>
            {models.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No models found. Run <span className="font-mono bg-gray-100 px-1 rounded">ollama pull phi4-mini</span> in a terminal.
              </p>
            )}
          </div>

          {/* How RAG works */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-800 space-y-1">
            <p className="font-medium">How answers are generated</p>
            <p>1. The ML retrieval index finds the most relevant published records for the question</p>
            <p>2. Those records are injected into a focused prompt (RAG)</p>
            <p>3. <span className="font-medium">{status.currentModel}</span> reads only that context and composes a natural answer</p>
          </div>

          {/* Test */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Test Ollama directly</p>
            <TestPanel
              onAsk={async (q) => testOllama(q)}
              placeholder="e.g. What happens during the Umhlanga ceremony?"
              disabled={!available}
            />
          </div>
        </>
      )}
    </div>
  );
};

// ─── ML Model section ──────────────────────────────────────────────────────────
const MLSection = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="card animate-pulse h-36" />;

  return (
    <div className="card mb-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <StatusDot on={isTrained} />
            Retrieval Index — TF-IDF + Naive Bayes
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isTrained
              ? `Last trained: ${fmt(status.trainedAt)} · ${status.stats?.total ?? 0} documents · ${status.stats?.vocab ?? 0} terms`
              : "Not trained — run training to enable Ollama RAG and the ML fallback"}
          </p>
        </div>
        <button onClick={handleTrain} disabled={training}
          className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
          {training
            ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Training…</>
            : <>{isTrained ? "Retrain" : "Train now"}</>}
        </button>
      </div>

      {isTrained && status.stats && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            ["Ceremonies", status.stats.ceremonies, "amber"],
            ["Lineage",    status.stats.lineages,   "blue"],
            ["Clans",      status.stats.clans,      "purple"],
            ["Songs",      status.stats.songs,      "green"],
            ["Vocabulary", status.stats.vocab,      "gray"],
          ].map(([label, val, color]) => (
            <div key={label} className={`rounded-lg p-2.5 text-center border
              ${color === "amber"  ? "bg-amber-50 border-amber-100 text-amber-800"  :
                color === "blue"   ? "bg-blue-50 border-blue-100 text-blue-800"    :
                color === "purple" ? "bg-purple-50 border-purple-100 text-purple-800":
                color === "green"  ? "bg-green-50 border-green-100 text-green-800" :
                                     "bg-gray-50 border-gray-100 text-gray-700"}`}>
              <p className="text-lg font-bold">{val ?? "—"}</p>
              <p className="text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {!isTrained && (
        <p className="text-xs text-gray-400 mb-3">
          The retrieval index powers both Ollama's RAG context and the standalone ML fallback.
          Train it after publishing new ceremonies or lineage records.
        </p>
      )}

      {(trainLog.length > 0 || trainErr) && (
        <div className="mb-4">
          {trainErr && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-2">{trainErr}</div>
          )}
          <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400 space-y-0.5 max-h-40 overflow-y-auto">
            {trainLog.map((line, i) => (
              <div key={i}>
                <span className="text-gray-500 mr-2 select-none">[{String(i + 1).padStart(2, "0")}]</span>{line}
              </div>
            ))}
            {training && (
              <div className="flex items-center gap-2 text-amber-400 mt-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />Running…
              </div>
            )}
          </div>
        </div>
      )}

      {isTrained && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Test retrieval index only</p>
          <TestPanel
            onAsk={async (q) => { const r = await testMLModel(q); return r; }}
            placeholder="e.g. Tell me about Swazi royal lineage"
          />
        </div>
      )}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
const ModelTraining = () => (
  <div className="max-w-3xl">
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Local AI Settings</h1>
      <p className="text-sm text-gray-500 mt-0.5">
        Configure the local AI fallback used when the Gemini API is unavailable.
      </p>
    </div>

    {/* Fallback chain explanation */}
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
      {["Gemini (primary)", "Ollama + RAG", "ML retrieval index", "Keyword search"].map((s, i, arr) => (
        <span key={s} className="flex items-center gap-2">
          <span className="bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700 font-medium">{s}</span>
          {i < arr.length - 1 && <span className="text-gray-300">→ fails →</span>}
        </span>
      ))}
    </div>

    <OllamaSection />
    <MLSection />
  </div>
);

export default ModelTraining;
