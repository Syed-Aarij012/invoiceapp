const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all invoices
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT data FROM invoices').all();
  res.json(rows.map(r => JSON.parse(r.data)));
});

// GET single invoice
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT data FROM invoices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  res.json(JSON.parse(row.data));
});

// POST create invoice
router.post('/', (req, res) => {
  const inv = req.body;
  if (!inv.id) return res.status(400).json({ error: 'id is required' });
  try {
    db.prepare('INSERT INTO invoices (id, data) VALUES (?, ?)').run(inv.id, JSON.stringify(inv));
    res.status(201).json(inv);
  } catch (e) {
    res.status(409).json({ error: 'Invoice with this ID already exists' });
  }
});

// PUT update full invoice
router.put('/:id', (req, res) => {
  const inv = { ...req.body, id: req.params.id };
  const result = db.prepare('UPDATE invoices SET data = ? WHERE id = ?')
    .run(JSON.stringify(inv), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

// PATCH update status only
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const row = db.prepare('SELECT data FROM invoices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  const inv = { ...JSON.parse(row.data), status };
  db.prepare('UPDATE invoices SET data = ? WHERE id = ?').run(JSON.stringify(inv), req.params.id);
  res.json(inv);
});

// DELETE invoice
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

module.exports = router;
