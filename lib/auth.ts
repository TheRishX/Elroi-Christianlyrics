import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
export const cookieName = "songlight_admin";
const sessionTtlMs = 1000 * 60 * 60 * 8;
function sessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : "";
}
export function hasSessionConfiguration() { return Boolean(sessionSecret()); }
export function hasPasswordConfiguration() {
  const plaintext = process.env.ADMIN_PASSWORD?.trim();
  if (plaintext) return true;
  const [scheme, salt, digest] = (process.env.ADMIN_PASSWORD_HASH || "").split(":");
  return scheme === "scrypt" && Boolean(salt) && Boolean(digest);
}
export function verifyPassword(password: string) {
  // Trim environment-only whitespace: it is common when a value is pasted into
  // a dashboard. The password typed in the form remains exact.
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) {
    const expected = Buffer.from(configured);
    const actual = Buffer.from(password);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  const [scheme, salt, digest] = (process.env.ADMIN_PASSWORD_HASH || "").split(":");
  if (scheme !== "scrypt" || !salt || !digest || !/^[a-f0-9]+$/i.test(digest)) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createSession(email: string) { const secret=sessionSecret(); if(!secret) throw new Error("Portal session signing is not configured."); const payload=`${email}.${Date.now()+sessionTtlMs}`; return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256",secret).update(payload).digest("hex")}`; }
export function validSession(value?: string) { const secret=sessionSecret(); if(!secret||!value)return false; const [encoded,signature,extra]=value.split("."); if(!encoded||!signature||extra)return false; let payload:string;try{payload=Buffer.from(encoded,"base64url").toString("utf8");}catch{return false;} const expected=createHmac("sha256",secret).update(payload).digest("hex"); const separator=payload.lastIndexOf("."); const email=payload.slice(0,separator); const expiry=Number(payload.slice(separator+1)); return separator>0&&!!email&&Number.isFinite(expiry)&&expiry>Date.now()&&signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }
export function passwordHash(password: string) { const salt=randomBytes(16).toString("hex"); return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`; }
