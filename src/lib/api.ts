const API = "http://127.0.0.1:8000";

export async function apiGet<T>(path: string): Promise<T> {
  await ensureBackendReady();

  const res = await fetch(`http://127.0.0.1:8000${path}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function waitForBackend(timeoutMs = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      if (res.ok) return;
    } catch {
      // backend not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error("Backend not ready");
}

let backendReadyPromise: Promise<void> | null = null;

async function waitForBackendOnce(timeoutMs = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error("Backend not ready");
}

function ensureBackendReady() {
  if (!backendReadyPromise) {
    backendReadyPromise = waitForBackendOnce();
  }
  return backendReadyPromise;
}
