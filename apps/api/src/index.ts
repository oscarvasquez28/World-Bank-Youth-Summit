import express from 'express';
import { randomUUID } from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

// Parse JSON bodies
app.use(express.json());

// Minimal CORS handling for local development (send methods + headers)
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	if (req.method === 'OPTIONS') return res.sendStatus(200);
	next();
});

app.get('/', (_req, res) => res.send('Hello from apps/api'));

app.post('/analyze', async (req, res) => {
	try {
		console.log('POST /analyze', { headers: req.headers, body: req.body });

		const { text = '', country = 'US' } = (req.body && typeof req.body === 'object') ? req.body : { text: String(req.body || ''), country: 'US' };

		// default/simple tokenization used as a fallback
		const tokens = String(text)
			.split(/[^A-Za-z0-9\+\#\-]+/)
			.map((t) => t.trim())
			.filter((t) => t.length > 2)
			.slice(0, 8);

		// Start with the fallback detected list, but attempt to call the external model
		let detected = Array.from(new Set(tokens)).slice(0, 8);

		try {
			const modelRes = await fetch('http://localhost:8000/api/skills/extract', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({ texts: [String(text)] }),
			});

			if (modelRes.ok) {
				const json = await modelRes.json();

				// Expected structure: { results: [ { text: string, skills: [ { raw, mapped } ] } ] }
				if (json && Array.isArray(json.results) && json.results[0] && Array.isArray(json.results[0].skills)) {
					const mapped = json.results[0].skills
						.map((s: any) => (s && (s.mapped || s.raw) ? (s.mapped || s.raw) : null))
						.filter(Boolean)
						.slice(0, 8);

						console.log('Model detected skills', mapped);
						detected = Array.from(new Set(mapped)).slice(0, 8);
				} else {
					console.warn('Unexpected model response shape', { body: json });
				}
			} else {
				console.warn('Model API returned non-ok status', modelRes.status, await modelRes.text().catch(() => ''));
			}
		} catch (e) {
			console.warn('Failed to call external skills model, falling back to tokenization', e);
		}

		const opportunities = detected.slice(0, 4).map((s) => ({
			role: `${s} Specialist`,
			salary: country === 'US' ? '$60k - $95k' : '$20k - $40k',
		}));

		res.json({ skills: detected, opportunities });
	} catch (err) {
		console.error('Error in /analyze handler', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Simple in-memory user store (for demo / dev only)
type User = { id: string; name?: string; email: string; password: string };
const users: User[] = [];

app.post('/auth/register', (req, res) => {
	try {
		const { name, email, password } = req.body || {};
		if (!email || !password) return res.status(400).json({ error: 'email and password required' });

		const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
		if (exists) return res.status(409).json({ error: 'user already exists' });

		const user: User = { id: randomUUID(), name: name || '', email: String(email), password: String(password) };
		users.push(user);

		// Return sanitized user
		const { password: _p, ...safe } = user as any;
		res.status(201).json({ user: safe });
	} catch (err) {
		console.error('Error in /auth/register', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.post('/auth/signin', (req, res) => {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) return res.status(400).json({ error: 'email and password required' });

		const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === String(password));
		if (!user) return res.status(401).json({ error: 'invalid credentials' });

		const { password: _p, ...safe } = user as any;
		res.json({ user: safe });
	} catch (err) {
		console.error('Error in /auth/signin', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Error handler middleware to catch unexpected errors
app.use((err: any, _req: any, res: any, _next: any) => {
	console.error('Uncaught error:', err && err.stack ? err.stack : err);
	try {
		res.status(500).json({ error: 'Internal server error' });
	} catch (e) {
		// If response cannot be sent, just log
		console.error('Failed to send error response', e);
	}
});

app.listen(port, () => console.log(`API running on ${port}`));
