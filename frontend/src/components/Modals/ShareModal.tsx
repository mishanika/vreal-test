import React, { useState, useEffect, useCallback } from "react";
import { useUI } from "../../context/UIContext";
import { apiCreateShare, apiListShares, apiRevokeShare } from "../../api/shares.api";

interface ShareRecord {
  id: string;
  token: string;
  permission: string;
  email: string | null;
}

export default function ShareModal() {
  const { modals, closeShare } = useUI();
  const { nodeId, nodeName } = modals.share;
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const loadShares = useCallback(async () => {
    if (!nodeId) return;
    setSharesLoading(true);
    try {
      const res = await apiListShares(nodeId);
      setShares(res.data);
    } finally {
      setSharesLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleCreate = async () => {
    if (!nodeId) return;
    setCreating(true);
    try {
      const res = await apiCreateShare(nodeId);
      setShareUrl(`${window.location.origin}/shared/${res.data.token}`);
      loadShares();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    await apiRevokeShare(shareId);
    loadShares();
  };

  return (
    <div className="modal-overlay" onClick={closeShare}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔗 Share "{nodeName}"</h2>
          <button className="modal-close" onClick={closeShare}>
            ✕
          </button>
        </div>

        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "🔗 Create Share Link"}
        </button>

        {shareUrl && (
          <div>
            <p style={{ fontSize: 12, color: "#888", marginTop: 12, marginBottom: 4 }}>Share link created:</p>
            <div className="share-link-box">
              <span>{shareUrl}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(shareUrl)}>
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {shares.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 8,
              }}
            >
              Active Share Links
            </p>
            {sharesLoading ? (
              <div className="loading-center">
                <div className="spinner" />
              </div>
            ) : (
              <div className="perm-list">
                {shares.map((s) => (
                  <div key={s.id} className="perm-item">
                    <span className="perm-email">…{s.token.slice(-8)}</span>
                    <span className="perm-level">{s.permission}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(s.id)}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeShare}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
