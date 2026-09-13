import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
const cookieName = "songlight_admin";
const secret = process.env.SESSION_SECRET || "development-only-change-me";
export function verifyPassword(password: string) { const [scheme, salt, digest] = (process.env.ADMIN_PASSWORD_HASH || "").split(":"); if (scheme !== "scrypt" || !salt || !digest) return false; const expected=Buffer.from(digest,"hex"); const actual=scryptSync(password,salt,expected.length); return expected.length===actual.length && timingSafeEqual(expected,actual); }
export function createSession(email: string) { const payload=`${email}.${Date.now()+1000*60*60*8}`; return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256",secret).update(payload).digest("hex")}`; }
export function validSession(value?: string) { if(!value)return false; const [encoded,signature]=value.split("."); if(!encoded||!signature)return false; const payload=Buffer.from(encoded,"base64url").toString(); const expected=createHmac("sha256",secret).update(payload).digest("hex"); const [email,expiry]=payload.split("."); return !!email&&Number(expiry)>Date.now()&&signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected)); }
export { cookieName };
export function passwordHash(password: string) { const salt=randomBytes(16).toString("hex"); return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`; }
