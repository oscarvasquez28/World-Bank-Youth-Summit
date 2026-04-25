type Json = Record<string, unknown> | string | number | boolean | null;

type ApiResponse = any;

type EndpointConfig = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
};

const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request(path: string, opts: { method?: string; body?: Json } = {}) {
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json().catch(() => ({}));
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
