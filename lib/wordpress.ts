const timeoutMs = 10_000;

export class UpstreamError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function publisherBase() {
  const configured = process.env.WORDPRESS_PUBLISH_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const legacy = process.env.WORDPRESS_PUBLISH_URL?.trim();
  if (legacy) return legacy.replace(/\/songs(?:\/\d+)?\/?$/, "").replace(/\/$/, "");
  const api = process.env.WORDPRESS_API_URL?.trim();
  if (!api) throw new Error("WordPress is not configured yet.");
  return new URL("/wp-json/elroi-publisher/v1", api).toString().replace(/\/$/, "");
}
export function publisherHeaders() {
  const token = process.env.WORDPRESS_API_TOKEN?.trim();
  if (!token) throw new Error("WordPress publishing is not configured yet.");
  return { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token, Authorization: `Bearer ${token}` };
}
export async function wordpressFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" }); }
  catch (error) { throw new UpstreamError(error instanceof Error && error.name === "AbortError" ? "WordPress timed out." : "WordPress is unavailable.", 504); }
  finally { clearTimeout(timer); }
}
export function upstreamResponse(data: unknown, response: Response, fallback: string) {
  const message = typeof data === "object" && data && ("message" in data || "error" in data) ? String((data as { message?: unknown; error?: unknown }).message || (data as { error?: unknown }).error) : fallback;
  throw new UpstreamError(message, response.status >= 400 && response.status < 600 ? response.status : 502);
}
