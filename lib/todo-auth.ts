import { createHmac, timingSafeEqual } from "crypto";

export const todoCookieName = "elroi_todo_access_v2";
export const legacyTodoCookieName = "elroi_todo_access";
const secret = process.env.SESSION_SECRET || "development-only-change-me";
const ttl = 1000 * 60 * 60 * 8;

function signature(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyTodoPasscode(passcode: string) {
  const expected = process.env.TODO_PASSCODE || "9664";
  const actual = Buffer.from(passcode);
  const target = Buffer.from(expected);
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function createTodoSession() {
  const payload = `todo.${Date.now() + ttl}`;
  return `${Buffer.from(payload).toString("base64url")}.${signature(payload)}`;
}

export function validTodoSession(value?: string) {
  if (!value) return false;
  const [encoded, supplied] = value.split(".");
  if (!encoded || !supplied) return false;
  const payload = Buffer.from(encoded, "base64url").toString();
  const expected = signature(payload);
  const [scope, expiry] = payload.split(".");
  return (
    scope === "todo" &&
    Number(expiry) > Date.now() &&
    supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}
