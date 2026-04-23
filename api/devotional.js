export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let prompt;
    if (typeof req.body === 'string') {
      prompt = JSON.parse(req.body).prompt;
    } else if (req.body && req.body.prompt) {
      prompt = req.body.prompt;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      prompt = JSON.parse(raw).prompt;
    }

    if (!prompt) return res.status(400).json({ error: 'No prompt' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const text = await r.text();
    res.status(r.status).send(text);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
