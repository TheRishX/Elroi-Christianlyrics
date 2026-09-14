const wordpressBase = process.env.WORDPRESS_API_URL;
const token = process.env.WORDPRESS_API_TOKEN;

function endpoint(path: string) {
  if (!wordpressBase || !token)
    throw new Error("WordPress task storage is not configured.");
  return `${wordpressBase.replace(/\/$/, "")}${path}`;
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("X-Elroi-API-Token", token || "");
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(endpoint(path), {
    ...init,
    headers,
    cache: "no-store",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Invalid WordPress response." }));
  if (!response.ok) {
    const error =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : "WordPress request failed.";
    throw new Error(error);
  }
  return data;
}

export function getTasks() {
  return request("/tasks");
}

export function createTask(body: unknown) {
  return request("/tasks", { method: "POST", body: JSON.stringify(body) });
}

export function updateTask(id: string, body: unknown) {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteTask(id: string) {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}
