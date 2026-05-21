import express    from 'express';
import { createChannel, setupQueues, QUEUES } from '../config/rabbitmq.js';

const app  = express();
app.use(express.json());

let channel;

app.post('/tasks', async (req, res) => {
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: 'Поля type и payload обязательны' });
  }

  const task = {
    id:        crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

  try {
    channel.sendToQueue(
      QUEUES.MAIN,
      Buffer.from(JSON.stringify(task)),
      {
        persistent: true,
        headers:    { 'x-retry-count': 0 },
      }
    );

    console.log(`[Producer] Задача поставлена в очередь:`, task);
    res.status(202).json({ message: 'Задача принята', taskId: task.id });
  } catch (err) {
    console.error('[Producer] Ошибка отправки:', err.message);
    res.status(500).json({ error: 'Не удалось поставить задачу в очередь' });
  }
});

(async () => {
  const { channel: ch } = await createChannel();
  channel = ch;
  await setupQueues(channel);

  app.listen(3000, () => {
    console.log('[Producer] Express API запущен на http://localhost:3000');
    console.log('[Producer] POST /tasks — { type, payload }');
  });
})();