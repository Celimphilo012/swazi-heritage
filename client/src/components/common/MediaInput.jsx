import { useState, useRef } from "react";
import { uploadFile } from "../../api/upload.api";

const MediaInput = ({ value, onChange, accept, type, placeholder }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [mode, setMode] = useState("url");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const url = await uploadFile(file);
      onChange(url);
      setMode("url");
    } catch {
      setUploadErr("Upload failed. Try again or paste a URL.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const isImage = type === "image";
  const isYouTube = value && /(?:youtube\.com|youtu\.be)/.test(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit text-xs">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            mode === "url" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); setTimeout(() => fileRef.current?.click(), 50); }}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            mode === "upload" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
      </div>

      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />

      {mode === "url" && (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        />
      )}

      {uploadErr && <p className="text-xs text-red-600">{uploadErr}</p>}

      {value && isImage && !isYouTube && (
        <img
          src={value}
          alt="preview"
          className="h-24 rounded-lg object-cover border border-gray-200"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      {value && !isImage && !isYouTube && (
        <p className="text-xs text-gray-500 truncate">
          {value.startsWith("/uploads/") ? `Uploaded: ${value.split("/").pop()}` : value}
        </p>
      )}
    </div>
  );
};

export default MediaInput;
