"use client";
import { FormEvent, useState } from "react";

export function UploadGate() {
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (response.ok) window.location.reload(); else { setError("Invalid email or password."); setBusy(false); }
  }
  return <main className="upload-gate"><div className="upload-gate-shell"><div className="upload-brand"><span>ELROI TUNES</span><small>Private publishing workspace</small></div><div className="upload-gate-card"><span className="eyebrow">SECURE ACCESS</span><h1>Upload a new song.</h1><p>Sign in to prepare and publish lyrics.</p><form onSubmit={login}><label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required /></label><label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label><button type="submit" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>{error && <p className="upload-error" role="alert">{error}</p>}</form></div><p className="upload-gate-note">Lyrics, metadata and publishing in one calm workspace.</p></div></main>;
}
