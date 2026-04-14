// Vercel Serverless Function — in-memory store seeded from data.json
const data = require('../starter-code/data.json');

// In-memory store (persists per serverless instance, resets on cold start)
// For production persistence, replace with a cloud DB like Vercel Postgres
let store = null;
function getStore() {
  if (!store) store = JSON.parse(JSON.stringify(data));
  return store;
}

function generateId() {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => L[Math.floor(Math.random() * 26)];
  const n = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${n()}${n()}${n()}${n()}`;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const invoices = getStore();
  // Extract id from URL: /api/invoices/:id or /api/invoices/:id/status
  const url = req.url.replace(/\?.*$/, '');
  const parts = url.split('/').filter(Boolean);
  // parts: ['api','invoices'] or ['api','invoices','XM9141'] or ['api','invoices','XM9141','status']
  const id = parts[2] || null;
  const isStatus = parts[3] === 'status';

  // GET /api/invoices
  if (req.method === 'GET' && !id) {
    return res.status(200).json(invoices);
  }

  // GET /api/invoices/:id
  if (req.method === 'GET' && id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(inv);
  }

  // POST /api/invoices
  if (req.method === 'POST' && !id) {
    const inv = req.body;
    if (!inv.id) inv.id = generateId();
    if (invoices.find(i => i.id === inv.id))
      return res.status(409).json({ error: 'Duplicate ID' });
    invoices.push(inv);
    return res.status(201).json(inv);
  }

  // PUT /api/invoices/:id
  if (req.method === 'PUT' && id && !isStatus) {
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    invoices[idx] = { ...req.body, id };
    return res.status(200).json(invoices[idx]);
  }

  // PATCH /api/invoices/:id/status
  if (req.method === 'PATCH' && id && isStatus) {
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    invoices[idx] = { ...invoices[idx], status: req.body.status };
    return res.status(200).json(invoices[idx]);
  }

  // DELETE /api/invoices/:id
  if (req.method === 'DELETE' && id) {
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    invoices.splice(idx, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
