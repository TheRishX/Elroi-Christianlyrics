import { createHmac, timingSafeEqual } from "crypto";

export const todoCookieName = "elroi_todo_access_v2";
export const legacyTodoCookieName = "elroi_todo_access";
const ttl = 1000 * 60 * 60 * 8;
function secret() { return process.env.TODO_SESSION_SECRET?.trim() || ""; }

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function hasTodoConfiguration() { return Boolean(process.env.TODO_PASSCODE?.trim() && secret().length >= 32); }

export function verifyTodoPasscode(passcode: string) {
  const expected = process.env.TODO_PASSCODE?.trim();
  if (!expected) return false;
  const actual = Buffer.from(passcode);
  const target = Buffer.from(expected);
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function createTodoSession() {
  if (!hasTodoConfiguration()) throw new Error("Todo authentication is not configured.");
  const payload = `todo.${Date.now() + ttl}`;
  return `${Buffer.from(payload).toString("base64url")}.${signature(payload)}`;
}

export function validTodoSession(value?: string) {
  if (!hasTodoConfiguration() || !value) return false;
  const [encoded, supplied, extra] = value.split(".");
  if (!encoded || !supplied || extra) return false;
  let payload: string; try { payload = Buffer.from(encoded, "base64url").toString("utf8"); } catch { return false; }
  const expected = signature(payload);
  const [scope, expiry] = payload.split(".");
  return (
    scope === "todo" &&
    Number(expiry) > Date.now() &&
    supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}
