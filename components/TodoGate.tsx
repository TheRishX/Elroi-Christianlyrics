"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";

export function TodoGate() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function unlock(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/todo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
    if (response.ok) window.location.reload(); else { setError("That passcode is not correct."); setBusy(false); setPasscode(""); }
  }
  return <main className="todo-gate"><div className="todo-gate-card"><span className="todo-lock"><LockKeyhole size={24} /></span><span className="eyebrow">PRIVATE SONG MANAGER</span><h1>Enter your passcode.</h1><p>This workspace is only available to the lyrics team.</p><form onSubmit={unlock}><label htmlFor="todo-passcode">Passcode</label><input id="todo-passcode" value={passcode} onChange={(event) => setPasscode(event.target.value)} inputMode="numeric" autoComplete="off" type="password" maxLength={32} autoFocus /><button type="submit" disabled={busy || !passcode}>{busy ? "Checking…" : "Unlock manager"}</button>{error && <span className="todo-gate-error" role="alert">{error}</span>}</form></div></main>;
}
