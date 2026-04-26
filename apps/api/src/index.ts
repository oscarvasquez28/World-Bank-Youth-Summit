import express from 'express';
import { randomUUID } from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

// Normalize skill strings to Title Case (first letter of each word uppercase)
const titleCase = (v: any) => String(v || '')
	.toLowerCase()
	.replace(/\b\w/g, (c) => c.toUpperCase());

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
					const mapped: string[] = json.results[0].skills
						.map((s: any) => (s && (s.mapped || s.raw) ? (s.mapped || s.raw) : null))
						.filter(Boolean)
						.map((s: any) => String(s))
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
			role: String(s),
			salary: country === 'US' ? '$60k - $95k' : '$20k - $40k',
		}));

		res.json({ skills: detected, opportunities });
	} catch (err) {
		console.error('Error in /analyze handler', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// POST /lens: forward a skills list to the risk model and return its response
app.post('/lens', async (req, res) => {
	try {
		console.log('POST /lens', { body: req.body });

		const body = req.body && typeof req.body === 'object' ? req.body : {};
		const skills = Array.isArray((body as any).skills) ? (body as any).skills : [];
		const countryInput = (body as any).country_code || (body as any).country || (body as any).locale || 'USA';

		// normalize to ISO-3166 alpha-3 where possible (best-effort)
		const countryMap: Record<string, string> = {
			US: 'USA',
			MX: 'MEX',
			GB: 'GBR',
			UK: 'GBR',
			CA: 'CAN',
			FR: 'FRA',
			DE: 'DEU',
			CN: 'CHN',
			IN: 'IND',
			BR: 'BRA',
			ES: 'ESP',
			IT: 'ITA',
			AU: 'AUS',
		};

		let country_code = String(countryInput || 'USA').trim();
		if (country_code.length === 2) {
			country_code = countryMap[country_code.toUpperCase()] || country_code.toUpperCase();
		} else if (country_code.length > 3) {
			country_code = country_code.slice(0, 3).toUpperCase();
		} else {
			country_code = country_code.toUpperCase();
		}

		// Call the external risk model API with the expected schema
		try {
			const modelRes = await fetch('http://localhost:8000/api/risk/lens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({ country_code, skills_profile: skills }),
			});

			if (!modelRes.ok) {
				const t = await modelRes.text().catch(() => '');
				console.warn('Risk model returned non-ok status', modelRes.status, t);
				return res.status(502).json({ error: 'Risk model error', status: modelRes.status, body: t });
			}

			const json = await modelRes.json();

			// Ensure expected top-level keys exist to avoid frontend crashes
			const out = {
				skills_at_risk: Array.isArray(json.skills_at_risk) ? json.skills_at_risk : [],
				durable_skills: Array.isArray(json.durable_skills) ? json.durable_skills : [],
				resilience_pathways: Array.isArray(json.resilience_pathways) ? json.resilience_pathways : [],
				market_context: json.market_context || {},
			};

			return res.json(out);
		} catch (e) {
			console.error('Failed to call risk model', e);
			return res.status(502).json({ error: 'Failed to call risk model', message: String(e) });
		}
	} catch (err) {
		console.error('Error in /lens handler', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// POST /occupations: forward skills + country to occupations model endpoint
app.post('/occupations', async (req, res) => {
	try {
		console.log('POST /occupations', { body: req.body });

		const body = req.body && typeof req.body === 'object' ? req.body : {};
		const skills = Array.isArray((body as any).skills) ? (body as any).skills : [];
		const countryInput = (body as any).country_code || (body as any).country || 'USA';

		// normalize to ISO-3166 alpha-3 where possible (best-effort)
		const countryMap: Record<string, string> = {
			US: 'USA',
			MX: 'MEX',
			GB: 'GBR',
			UK: 'GBR',
			CA: 'CAN',
			FR: 'FRA',
			DE: 'DEU',
			CN: 'CHN',
			IN: 'IND',
			BR: 'BRA',
			ES: 'ESP',
			IT: 'ITA',
			AU: 'AUS',
		};

		let country_code = String(countryInput || 'USA').trim();
		if (country_code.length === 2) {
			country_code = countryMap[country_code.toUpperCase()] || country_code.toUpperCase();
		} else if (country_code.length > 3) {
			country_code = country_code.slice(0, 3).toUpperCase();
		} else {
			country_code = country_code.toUpperCase();
		}

		const top_n_input = (body as any).top_n ?? (body as any).topN;
		const top_n = Number.isFinite(Number(top_n_input)) ? Number(top_n_input) : 10;

		try {
			const modelRes = await fetch('http://127.0.0.1:8000/api/risk/occupations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({
					skills,
					locale: country_code,
					top_n,
				}),
			});

			if (!modelRes.ok) {
				const t = await modelRes.text().catch(() => '');
				console.warn('Occupations model returned non-ok status', modelRes.status, t);
				return res.status(502).json({ error: 'Occupations model error', status: modelRes.status, body: t });
			}

			const json = await modelRes.json();
			const out = json && typeof json === 'object' ? json : {};
			return res.json(out);
		} catch (e) {
			console.error('Failed to call occupations model', e);
			return res.status(502).json({ error: 'Failed to call occupations model', message: String(e) });
		}
	} catch (err) {
		console.error('Error in /occupations handler', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Simple in-memory user store (for demo / dev only)
type User = { id: string; name?: string; email: string; password: string; skills: string[] };
const users: User[] = [];

function normalizeSkillList(input: any): string[] {
	if (!Array.isArray(input)) return [];
	const normalized = input
		.map((s) => titleCase(String(s || '').trim()))
		.filter((s) => s.length > 0);
	return Array.from(new Set(normalized));
}

app.post('/auth/register', (req, res) => {
	try {
		const { name, email, password, skills } = req.body || {};
		if (!email || !password) return res.status(400).json({ error: 'email and password required' });

		const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
		if (exists) return res.status(409).json({ error: 'user already exists' });

		const user: User = {
			id: randomUUID(),
			name: name || '',
			email: String(email),
			password: String(password),
			skills: normalizeSkillList(skills),
		};
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

app.post('/auth/match', (req, res) => {
	try {
		const { requiredSkills } = req.body || {};
		const required = normalizeSkillList(requiredSkills);

		if (required.length === 0) {
			return res.status(400).json({ error: 'requiredSkills is required' });
		}

		const matches = users
			.map((u) => {
				const userSkills = normalizeSkillList(u.skills);
				const matchedSkills = required.filter((r) => userSkills.some((s) => s.toLowerCase() === r.toLowerCase()));
				const missingSkills = required.filter((r) => !matchedSkills.some((m) => m.toLowerCase() === r.toLowerCase()));
				const score = Math.round((matchedSkills.length / required.length) * 100);

				return {
					id: u.id,
					name: u.name || u.email,
					email: u.email,
					skills: userSkills,
					matchedSkills,
					missingSkills,
					score,
				};
			})
			.filter((u) => u.matchedSkills.length > 0)
			.sort((a, b) => b.score - a.score || b.matchedSkills.length - a.matchedSkills.length);

		res.json({ requiredSkills: required, candidates: matches });
	} catch (err) {
		console.error('Error in /auth/match', err);
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
