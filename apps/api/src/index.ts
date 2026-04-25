import express from 'express';

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

app.post('/analyze', (req, res) => {
	try {
		console.log('POST /analyze', { headers: req.headers, body: req.body });

		const { text = '', country = 'US' } = (req.body && typeof req.body === 'object') ? req.body : { text: String(req.body || ''), country: 'US' };

		// same simple tokenization used by frontend mock
		const tokens = String(text)
			.split(/[^A-Za-z0-9\+\#\-]+/)
			.map((t) => t.trim())
			.filter((t) => t.length > 2)
			.slice(0, 8);

		const detected = Array.from(new Set(tokens)).slice(0, 8);

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
