import React, { useState, useRef, useEffect } from "react";
import { useFiles } from "../../context/FilesContext";
import { useUI } from "../../context/UIContext";

export default function RenameModal() {
  const { renameNode, loading } = useFiles();
  const { modals, closeRename } = useUI();
  const { nodeId, currentName } = modals.rename;
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !nodeId) return;
    await renameNode(nodeId, trimmed);
    closeRename();
  };

  return (
    <div className="modal-overlay" onClick={closeRename}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Rename</h2>
          <button className="modal-close" onClick={closeRename}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>New name</label>
              <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeRename}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim() || name.trim() === currentName}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
