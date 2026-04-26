type Json = Record<string, unknown> | string | number | boolean | null;

type ApiResponse = any;

type EndpointConfig = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
};

const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request(path: string, opts: { method?: string; body?: Json } = {}) {
  const url = path.startsWith('http') ? path : `${base}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    // Network-level error (DNS, CORS, connection closed)
    const msg = err instanceof Error ? err.message : String(err);
    console.error('api.request fetch failed', { url, method: opts.method, body: opts.body, err });
    throw new Error(`Network error when fetching ${url}: ${msg}`);
  }

  // Log status/headers for easier debugging
  try {
    const headerObj: Record<string, string> = {};
    res.headers.forEach((v, k) => (headerObj[k] = v));
    console.debug('api.request response', { url, status: res.status, headers: headerObj });
  } catch (e) {
    /* ignore header logging failures */
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch (e) {
    console.warn('api.request: response JSON parse failed, returning empty object', { url, err: e });
    return {};
  }
}

const endpoints: Record<string, EndpointConfig> = {};

const api: Record<string, any> = {
  register(name: string, cfg: EndpointConfig) {
    endpoints[name] = cfg;
    api[name] = (body?: Json) => request(cfg.path, { method: cfg.method ?? 'POST', body });
  },

  // low-level request available if needed
  request,
};

export default api;

export type { ApiResponse };
