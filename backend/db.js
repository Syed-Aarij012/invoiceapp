const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'invoices.db'));

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`);

// Seed from data.json if table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM invoices').get();
if (count.c === 0) {
  
  const dataPath = path.join(__dirname, '../starter-code/data.json');
  if (fs.existsSync(dataPath)) {
    const invoices = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const insert = db.prepare('INSERT INTO invoices (id, data) VALUES (?, ?)');
    const insertMany = db.transaction(list => {
      for (const inv of list) insert.run(inv.id, JSON.stringify(inv));
    });
    insertMany(invoices);
    console.log(`Seeded ${invoices.length} invoices from data.json`);
  }
}

module.exports = db;
