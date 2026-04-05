const express    = require('express');
const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const socketIo   = require('socket.io');
const webpush    = require('web-push');
const bodyParser = require('body-parser');
const cors       = require('cors');
const path       = require('path');

const vapidKeys = {
  publicKey:  'BF3hMzWLmlPCGty0JMFwRPJqLlUmOZAjjZmFkmzecNeD6VESEFIYsdkcv2eRaOg98us4C4ghBBFSJt5OYXZJkIU',
  privateKey: 'TDkcsO1wpceaZhz7FtUdiRWVIb167-4lWZbPRly24Ps'
};

webpush.setVapidDetails(
  'mailto:rodnov.ilya777@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let server;
try {
  const sslOptions = {
    key:  fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem')),
  };
  server = https.createServer(sslOptions, app);
  console.log('Режим: HTTPS (сертификаты найдены)');
} catch (e) {
  server = http.createServer(app);
  console.log('Режим: HTTP (сертификаты не найдены, Push может не работать)');
  console.log('Для HTTPS выполни: mkcert localhost 127.0.0.1 ::1');
}

const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

let subscriptions = [];

io.on('connection', (socket) => {
  console.log('[Socket.IO] Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    console.log('[Socket.IO] Новая задача:', task.text);
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body:  task.text
    });

    subscriptions.forEach((sub, index) => {
      webpush.sendNotification(sub, payload)
        .catch(err => {
          console.error('[Push] Ошибка отправки:', err.statusCode);
          if (err.statusCode === 410) {
            subscriptions.splice(index, 1);
          }
        });
    });
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    console.log('[Push] Новая подписка, всего:', subscriptions.length);
  }
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  console.log('[Push] Подписка удалена, всего:', subscriptions.length);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/test-push', (req, res) => {
  const payload = JSON.stringify({
    title: 'Тест TaskFlow',
    body:  'Тестовое push-уведомление'
  });
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, payload)
      .catch(err => console.error('[Push] Ошибка:', err));
  });
  res.json({ message: `Push отправлен ${subscriptions.length} подписчикам` });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  const proto = server instanceof https.Server ? 'https' : 'http';
  console.log(`\nСервер запущен: ${proto}://localhost:${PORT}`);
  console.log(`WebSocket готов`);
  console.log(`Push API готов\n`);
});