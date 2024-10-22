const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Add a new transaction
router.post('/transactions', (req, res) => {
  const { type, category, amount, date, description } = req.body;

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [type, category, amount, date, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Transaction added', id: this.lastID });
  });
});

// Get all transactions
router.get('/transactions', (req, res) => {
  const query = `SELECT * FROM transactions`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a transaction by ID
router.get('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM transactions WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Update a transaction by ID
router.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;

  db.run(query, [type, category, amount, date, description, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated' });
  });
});

// Delete a transaction by ID
router.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM transactions WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  });
});

// Get a summary of transactions
router.get('/summary', (req, res) => {
  const { from, to, category } = req.query;

  let query = `SELECT type, SUM(amount) as total FROM transactions WHERE 1=1`;
  const params = [];

  if (from) {
    query += ` AND date >= ?`;
    params.push(from);
  }

  if (to) {
    query += ` AND date <= ?`;
    params.push(to);
  }

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` GROUP BY type`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const summary = rows.reduce(
      (acc, row) => {
        if (row.type === 'income') {
          acc.totalIncome = row.total;
        } else if (row.type === 'expense') {
          acc.totalExpense = row.total;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    summary.balance = summary.totalIncome - summary.totalExpense;
    res.json(summary);
  });
});

module.exports = router;
