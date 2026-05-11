import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getCeremony,
  createCeremony,
  updateCeremony,
  addSong,
  deleteSong,
  addImvunulo,
  deleteImvunulo,
  getImvunuloPresets,
  getCeremonyMonths,
} from "../../../api/ceremonies.api";
import MediaInput from "../../../components/common/MediaInput";

// ─── Tiny reusable pieces ─────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}
    {required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                disabled:bg-gray-50 resize-none ${className}`}
    {...props}
  />
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Song sub-form ────────────────────────────────────────────────────────────
const SongItem = ({ song, index, onChange, onRemove }) => (
  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">
        Song {index + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-600 hover:text-red-800 font-medium"
      >
        Remove
      </button>
    </div>
    <div>
      <Label required>Title</Label>
      <Input
        value={song.title}
        onChange={(e) => onChange("title", e.target.value)}
        placeholder="e.g. Siyabonga Nkosi"
        required
      />
    </div>
    <div>
      <Label>Description</Label>
      <Textarea
        rows={2}
        value={song.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="What is this song about? When is it sung?"
      />
    </div>
    <div>
      <Label>Audio / Song link</Label>
      <MediaInput
        value={song.audio_url}
        onChange={(val) => onChange("audio_url", val)}
        accept="audio/*"
        type="audio"
        placeholder="https://youtube.com/watch?v=... or direct audio URL"
      />
      <p className="text-xs text-gray-400 mt-1">
        Upload an audio file or paste a YouTube / direct audio link.
      </p>
    </div>
  </div>
);

// ─── Imvunulo preset card ─────────────────────────────────────────────────────
const PresetCard = ({ preset, selected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(preset)}
    className={`w-full text-left border-2 rounded-xl p-3 transition-all ${
      selected
        ? "border-red-600 bg-red-50"
        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
    }`}
  >
    <div className="flex items-start gap-2">
      <div
        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "border-red-600 bg-red-600" : "border-gray-300"
        }`}
      >
        {selected && (
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 10 8"
            fill="none"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {preset.image_url && (
          <img src={preset.image_url} alt={preset.name}
            className="w-full h-20 object-cover rounded-lg mb-2 border border-gray-100"
            onError={(e) => { e.target.style.display = "none"; }} />
        )}
        <p className="text-sm font-medium text-gray-900">{preset.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {preset.description}
        </p>
        <span
          className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded font-medium ${
            preset.gender === "male"
              ? "bg-blue-50 text-blue-700"
              : preset.gender === "female"
                ? "bg-pink-50 text-pink-700"
                : preset.gender === "child"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-gray-100 text-gray-600"
          }`}
        >
          {preset.gender}
        </span>
      </div>
    </div>
  </button>
);

// ─── Imvunulo detail form (shown when a preset is selected) ───────────────────
const ImvunuloDetail = ({ selection, presetName, onUpdate, onRemove }) => (
  <div className="border border-red-200 rounded-xl p-4 bg-white space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-red-800">{presetName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-600 hover:text-red-800 font-medium"
      >
        Remove
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Colour description</Label>
        <Input
          value={selection.color_desc || ""}
          onChange={(e) => onUpdate("color_desc", e.target.value)}
          placeholder="e.g. Bright red and white beads"
        />
      </div>
      <div>
        <Label>Attire image</Label>
        <MediaInput
          value={selection.image_url || ""}
          onChange={(val) => onUpdate("image_url", val)}
          accept="image/*"
          type="image"
          placeholder="https://... or upload a photo"
        />
      </div>
    </div>
    <div>
      <Label>Notes for this ceremony</Label>
      <Textarea
        rows={2}
        value={selection.notes || ""}
        onChange={(e) => onUpdate("notes", e.target.value)}
        placeholder="Any specific details about how this attire is worn at this ceremony..."
      />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const CeremonyFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    description: "",
    month_celebrated: "",
    immunology_notes: "",
  });

  // ── Songs state ─────────────────────────────────────────────────────────────
  // Each song has a _key (local id for React), an optional id (DB id), and fields
  const [songs, setSongs] = useState([]);
  const [removedSongIds, setRemovedSongIds] = useState([]);

  // ── Imvunulo state ───────────────────────────────────────────────────────────
  const [presets, setPresets] = useState([]);
  const [imvSelections, setImvSelections] = useState([]);
  const [removedImvIds, setRemovedImvIds] = useState([]);

  // ── Resources state ──────────────────────────────────────────────────────────
  const [months, setMonths] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [fetching, setFetching] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Load resources (presets + months) on mount ──────────────────────────────
  useEffect(() => {
    Promise.all([getImvunuloPresets(), getCeremonyMonths()])
      .then(([p, m]) => {
        setPresets(p);
        setMonths(m);
      })
      .catch(() =>
        setError("Could not load form resources. Please refresh the page."),
      )
      .finally(() => setPresetsLoading(false));
  }, []);

  // ── Load existing ceremony in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;

    getCeremony(id)
      .then((c) => {
        setForm({
          name: c.name,
          description: c.description || "",
          month_celebrated: c.month_celebrated || "",
          immunology_notes: c.immunology_notes || "",
        });
        // Existing songs — add a _key so React can track them
        setSongs(c.songs.map((s) => ({ ...s, _key: `s-${s.id}` })));
        // Existing imvunulo — map preset_id so the grid highlights them
        setImvSelections(
          c.imvunulo.map((iv) => ({
            ...iv,
            _key: `iv-${iv.id}`,
            preset_name: iv.name, // joined from preset in API
          })),
        );
      })
      .catch(() =>
        setError("Could not load ceremony. Please go back and try again."),
      )
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  // ── Field change helpers ──────────────────────────────────────────────────────
  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Song helpers ─────────────────────────────────────────────────────────────
  const addSongRow = useCallback(() => {
    setSongs((prev) => [
      ...prev,
      {
        _key: `new-${Date.now()}`,
        id: null,
        title: "",
        description: "",
        audio_url: "",
      },
    ]);
  }, []);

  const updateSong = useCallback((_key, field, value) => {
    setSongs((prev) =>
      prev.map((s) => (s._key === _key ? { ...s, [field]: value } : s)),
    );
  }, []);

  const removeSongRow = useCallback((song) => {
    setSongs((prev) => prev.filter((s) => s._key !== song._key));
    if (song.id) setRemovedSongIds((prev) => [...prev, song.id]);
  }, []);

  // ── Imvunulo helpers ──────────────────────────────────────────────────────────
  const isSelected = (presetId) =>
    imvSelections.some((s) => s.preset_id === presetId);

  const togglePreset = useCallback(
    (preset) => {
      if (isSelected(preset.id)) {
        const existing = imvSelections.find((s) => s.preset_id === preset.id);
        setImvSelections((prev) =>
          prev.filter((s) => s.preset_id !== preset.id),
        );
        if (existing?.id) setRemovedImvIds((prev) => [...prev, existing.id]);
      } else {
        setImvSelections((prev) => [
          ...prev,
          {
            _key: `new-${Date.now()}`,
            id: null,
            preset_id: preset.id,
            preset_name: preset.name,
            notes: "",
            color_desc: "",
            image_url: "",
          },
        ]);
      }
    },
    [imvSelections],
  );

  const updateImv = useCallback((presetId, field, value) => {
    setImvSelections((prev) =>
      prev.map((s) =>
        s.preset_id === presetId ? { ...s, [field]: value } : s,
      ),
    );
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // 1. Create or update the ceremony record
      let ceremonyId = id;
      if (isEdit) {
        await updateCeremony(id, form);
      } else {
        const created = await createCeremony(form);
        ceremonyId = created.id;
      }

      // 2. Run all deletes and inserts in parallel for speed
      await Promise.all([
        // Remove deleted songs
        ...removedSongIds.map((sid) => deleteSong(ceremonyId, sid)),
        // Remove deselected imvunulo
        ...removedImvIds.map((iid) => deleteImvunulo(ceremonyId, iid)),
      ]);

      await Promise.all([
        // Add new songs (only those without an id and with a title)
        ...songs
          .filter((s) => !s.id && s.title.trim())
          .map((s) =>
            addSong(ceremonyId, {
              title: s.title.trim(),
              description: s.description,
              audio_url: s.audio_url,
            }),
          ),
        // Add newly selected imvunulo
        ...imvSelections
          .filter((s) => !s.id)
          .map((s) =>
            addImvunulo(ceremonyId, {
              preset_id: s.preset_id,
              notes: s.notes,
              color_desc: s.color_desc,
              image_url: s.image_url,
            }),
          ),
      ]);

      setSuccess(
        isEdit
          ? "Ceremony updated successfully and re-submitted for admin review."
          : "Ceremony submitted successfully. It will be reviewed by the admin before publishing.",
      );

      setTimeout(() => navigate("/practitioner/ceremonies"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state (edit mode fetching) ───────────────────────────────────────
  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading ceremony...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <Link
          to="/practitioner/ceremonies"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to ceremonies
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? "Edit Ceremony" : "Add New Ceremony"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit
            ? "Editing a published ceremony will re-submit it for admin review."
            : "Fill in the ceremony details below. The admin will review before publishing."}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {success} Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SECTION 1: Basic information ──────────────────────────────────── */}
        <div className="card">
          <SectionHeader
            title="Basic Information"
            subtitle="Core details about this ceremony"
          />
          <div className="space-y-4">
            <div>
              <Label required>Ceremony name</Label>
              <Input
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. Incwala, Umhlanga Reed Dance"
                required
              />
            </div>

            <div>
              <Label required>Time of year</Label>
              <select
                value={form.month_celebrated}
                onChange={setField("month_celebrated")}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                           bg-white disabled:bg-gray-50"
              >
                <option value="">— Select when this ceremony is held —</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={setField("description")}
                placeholder="Describe this ceremony — its meaning, history, who participates, and what happens..."
              />
            </div>

            <div>
              <Label>Immunology & health notes</Label>
              <Textarea
                rows={3}
                value={form.immunology_notes}
                onChange={setField("immunology_notes")}
                placeholder="Any health precautions, restrictions, or ritual purity requirements associated with this ceremony..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Include any dietary restrictions, abstinence requirements, or
                health-related protocols.
              </p>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Songs ──────────────────────────────────────────────── */}
        <div className="card">
          <SectionHeader
            title="Associated Songs"
            subtitle={`${songs.length} song${songs.length !== 1 ? "s" : ""} added`}
            action={
              <button
                type="button"
                onClick={addSongRow}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add song
              </button>
            }
          />

          {songs.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <p className="text-sm text-gray-400">No songs added yet.</p>
              <button
                type="button"
                onClick={addSongRow}
                className="mt-2 text-sm text-red-700 hover:underline font-medium"
              >
                Add the first song
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {songs.map((song, i) => (
                <SongItem
                  key={song._key}
                  song={song}
                  index={i}
                  onChange={(field, value) =>
                    updateSong(song._key, field, value)
                  }
                  onRemove={() => removeSongRow(song)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── SECTION 3: Imvunulo (traditional attire) ──────────────────────── */}
        <div className="card">
          <SectionHeader
            title="Traditional Attire (Imvunulo)"
            subtitle="Select all attire items associated with this ceremony, then add details for each"
          />

          {presetsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl p-3 animate-pulse"
                >
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : presets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No imvunulo presets configured yet. Ask the admin to add them in
              System Config.
            </p>
          ) : (
            <>
              {/* Preset selection grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={isSelected(preset.id)}
                    onToggle={togglePreset}
                  />
                ))}
              </div>

              {/* Detail forms for selected presets */}
              {imvSelections.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details for selected attire ({imvSelections.length}{" "}
                    selected)
                  </p>
                  {imvSelections.map((sel) => (
                    <ImvunuloDetail
                      key={sel._key}
                      selection={sel}
                      presetName={
                        sel.preset_name || sel.name || `Preset ${sel.preset_id}`
                      }
                      onUpdate={(field, value) =>
                        updateImv(sel.preset_id, field, value)
                      }
                      onRemove={() =>
                        togglePreset({
                          id: sel.preset_id,
                          name: sel.preset_name,
                        })
                      }
                    />
                  ))}
                </div>
              )}

              {imvSelections.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  Click the items above to select attire for this ceremony.
                </p>
              )}
            </>
          )}
        </div>

        {/* ─── Form actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <Link to="/practitioner/ceremonies" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || Boolean(success)}
            className="btn-primary flex items-center gap-2 min-w-[160px] justify-center"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save & resubmit for review"
            ) : (
              "Submit for review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CeremonyFormPage;
