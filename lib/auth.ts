import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
const cookieName = "songlight_admin";
const env = (name: string) => process.env[name];
// Use the configured portal credential as the session signing source. This
// keeps independently deployed route handlers consistent even when a legacy
// SESSION_SECRET value is scoped differently in a hosting dashboard.
function sessionSecret() {
  return env("ADMIN_PASSWORD")?.trim() || env("SESSION_SECRET") || "development-only-change-me";
}
export function hasPasswordConfiguration() {
  const plaintext = env("ADMIN_PASSWORD")?.trim();
  if (plaintext) return true;
  const [scheme, salt, digest] = (env("ADMIN_PASSWORD_HASH") || "").split(":");
  return scheme === "scrypt" && Boolean(salt) && Boolean(digest);
}
export function verifyPassword(password: string) {
  // Trim environment-only whitespace: it is common when a value is pasted into
  // a dashboard. The password typed in the form remains exact.
  const configured = env("ADMIN_PASSWORD")?.trim();
  if (configured) {
    const expected = Buffer.from(configured);
    const actual = Buffer.from(password);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  const [scheme, salt, digest] = (env("ADMIN_PASSWORD_HASH") || "").split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createSession(email: string) { const payload=`${email}.${Date.now()+1000*60*60*8}`; return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256",sessionSecret()).update(payload).digest("hex")}`; }
export function validSession(value?: string) { if(!value)return false; const [encoded,signature]=value.split("."); if(!encoded||!signature)return false; const payload=Buffer.from(encoded,"base64url").toString(); const expected=createHmac("sha256",sessionSecret()).update(payload).digest("hex"); const [email,expiry]=payload.split("."); return !!email&&Number(expiry)>Date.now()&&signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }
export { cookieName };
export function passwordHash(password: string) { const salt=randomBytes(16).toString("hex"); return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`; }
