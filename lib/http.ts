const DEFAULT_UA = 'Clarence-Golf-App/1.0 (+https://clarence-1zva.onrender.com)';

// Some hosts silently reject requests with no User-Agent (no error, just a
// non-2xx or a blocked connection) — always send one. Also enforces a
// timeout so a hung request fails fast with a clear reason in the logs
// instead of an ambiguous stall.
export async function fetchWithTimeout(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { 'User-Agent': DEFAULT_UA, ...headers }, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
