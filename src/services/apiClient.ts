export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.warn(`[safeFetchJson] Non-JSON response from ${url} (${res.status}):`, text.slice(0, 100));
    throw new Error(`Server returned non-JSON response (${res.status}). Check backend routes.`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status} Error`);
  }

  return data;
}
