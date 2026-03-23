import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGetSharePublic } from "../api/shares.api";

type ChildNode = { id: string; name: string; type: string; filePath: string | null; mimeType: string | null };

function SharedImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        style={{
          width: "100%",
          paddingTop: "75%",
          background: "#f3f4f6",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          🖼
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, display: "block" }}
    />
  );
}

export default function SharedPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }
    apiGetSharePublic(shareToken)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Share not found or has been revoked.");
        setLoading(false);
      });
  }, [shareToken]);

  return (
    <div className="shared-page">
      <div className="shared-header">
        <h1>📁 VReal Storage — Shared File</h1>
      </div>
      <div className="shared-content">
        {loading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}
        {error && (
          <div className="shared-info" style={{ textAlign: "center", color: "#ff4f64" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
            <p>{error}</p>
          </div>
        )}
        {data && (
          <div className="shared-info">
            <h2 style={{ marginBottom: 4 }}>
              {data.type === "folder" ? "📁" : "🖼"} {data.name}
            </h2>
            {data.size && (
              <p style={{ color: "#aaa", fontSize: 12, marginBottom: 16 }}>Size: {(data.size / 1024).toFixed(1)} KB</p>
            )}

            {/* Single file */}
            {data.type === "file" && data.filePath && <SharedImage src={`/uploads/${data.filePath}`} alt={data.name} />}

            {/* Folder — image grid */}
            {data.type === "folder" && (
              <>
                {!data.children || data.children.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: 13, marginTop: 16 }}>This folder is empty.</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: 16,
                      marginTop: 16,
                    }}
                  >
                    {data.children.map((child: ChildNode) => (
                      <div key={child.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {child.type === "file" && child.filePath ? (
                          <SharedImage src={`/uploads/${child.filePath}`} alt={child.name} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              paddingTop: "75%",
                              background: "#f3f4f6",
                              borderRadius: 8,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 32,
                              }}
                            >
                              📁
                            </span>
                          </div>
                        )}
                        <p
                          style={{
                            fontSize: 12,
                            color: "#444",
                            textAlign: "center",
                            wordBreak: "break-word",
                            margin: 0,
                          }}
                        >
                          {child.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
