const express = require('express');
const os = require('os');
const app = express();

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || os.hostname();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Response from backend server',
    server: SERVER_NAME,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_NAME, port: PORT });
});

app.get('/api/data', (req, res) => {
  res.json({
    message: 'Data from server',
    server: SERVER_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server [${SERVER_NAME}] started on port ${PORT}`);
});