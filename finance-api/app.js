const express = require('express');
const bodyParser = require('body-parser');
const transactionRoutes = require('./routes/transactions');

const app = express();

app.use(bodyParser.json());
app.use('/api', transactionRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = app;
