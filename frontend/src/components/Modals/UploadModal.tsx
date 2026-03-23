import React, { useState, useRef, useEffect } from "react";
import { useFiles } from "../../context/FilesContext";
import { useUI } from "../../context/UIContext";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 20 * 1024 * 1024;

export default function UploadModal() {
  const { uploadFile, currentParentId, loading, error } = useFiles();
  const { closeUpload } = useUI();
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const pick = (f: File) => {
    if (!ALLOWED.includes(f.type)) {
      setLocalError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setLocalError("File size must be under 20 MB.");
      return;
    }
    setLocalError("");
    if (preview) URL.revokeObjectURL(preview);
    setFileState(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (currentParentId) fd.append("parentId", currentParentId);
    await uploadFile(fd);
    if (!error) closeUpload();
  };

  const displayError = localError || error;

  return (
    <div className="modal-overlay" onClick={closeUpload}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⬆ Upload Image</h2>
          <button className="modal-close" onClick={closeUpload}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className={`upload-zone${dragActive ? " active" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) pick(f);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
              }}
            />
            <div className="upload-icon">🖼</div>
            <p>Click or drag &amp; drop an image here</p>
            <p style={{ fontSize: 11, marginTop: 4, color: "#bbb" }}>JPEG, PNG, WebP · max 20 MB</p>
          </div>
          {preview && file && (
            <div className="upload-preview">
              <img src={preview} alt="preview" />
              <div>
                <div className="upload-file-name">{file.name}</div>
                <div className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          )}

          {displayError && (
            <p className="error-msg" style={{ marginTop: 8 }}>
              ⚠ {displayError}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeUpload}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!file || loading}>
              {loading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
