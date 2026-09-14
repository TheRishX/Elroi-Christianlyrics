import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
const cookieName = "songlight_admin";
// Keep these direct references: Vercel traces them and injects the values into
// every server function that imports this module (login, session and upload).
const configuredAdminPassword = process.env.ADMIN_PASSWORD;
const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
// Use the configured portal credential as the session signing source. This
// keeps independently deployed route handlers consistent even when a legacy
// SESSION_SECRET value is scoped differently in a hosting dashboard.
function sessionSecret() {
  return configuredAdminPassword?.trim() || "development-only-change-me";
}
export function hasPasswordConfiguration() {
  const plaintext = configuredAdminPassword?.trim();
  if (plaintext) return true;
  const [scheme, salt, digest] = configuredPasswordHash.split(":");
  return scheme === "scrypt" && Boolean(salt) && Boolean(digest);
}
export function verifyPassword(password: string) {
  // Trim environment-only whitespace: it is common when a value is pasted into
  // a dashboard. The password typed in the form remains exact.
  const configured = configuredAdminPassword?.trim();
  if (configured) {
    const expected = Buffer.from(configured);
    const actual = Buffer.from(password);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  const [scheme, salt, digest] = configuredPasswordHash.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createSession(email: string) { const payload=`${email}.${Date.now()+1000*60*60*8}`; return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256",sessionSecret()).update(payload).digest("hex")}`; }
export function validSession(value?: string) { if(!value)return false; const [encoded,signature]=value.split("."); if(!encoded||!signature)return false; const payload=Buffer.from(encoded,"base64url").toString(); const expected=createHmac("sha256",sessionSecret()).update(payload).digest("hex"); const [email,expiry]=payload.split("."); return !!email&&Number(expiry)>Date.now()&&signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }
export { cookieName };
export function passwordHash(password: string) { const salt=randomBytes(16).toString("hex"); return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`; }
