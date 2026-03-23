import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BYPASS_TOKEN } from "../config";

export default function LoginPage() {
  const { login, bypassLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleBypassLogin = async () => {
    await bypassLogin(BYPASS_TOKEN);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📁</div>
        <h1>VReal Storage</h1>
        <p className="auth-sub">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              placeholder="••••••••"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-msg">⚠ {error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <div style={{ display: "flex", alignItems: "center", margin: "16px 0", gap: 8 }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb" }} />
            <span style={{ color: "#9ca3af", fontSize: 13 }}>or</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb" }} />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={handleBypassLogin}
            style={{ width: "100%" }}
          >
            Demo Login (bypass token)
          </button>
        </form>
        <p className="auth-link">
          Don’t have an account?{" "}
          <a style={{ cursor: "pointer" }} onClick={() => navigate("/register")}>
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
