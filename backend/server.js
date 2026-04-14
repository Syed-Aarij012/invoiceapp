const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));
// API routes
app.use('/api/invoices', require('./routes/invoices'));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


