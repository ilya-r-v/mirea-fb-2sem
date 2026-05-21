import amqplib from 'amqplib';
import {
  createChannel,
  setupQueues,
  QUEUES,
  MAX_RETRIES,
} from '../config/rabbitmq.js';
import { calcBackoff, sleep } from '../utils/retry.js';

const WORKER_ID = process.env.WORKER_ID || '1';

async function processTask(task) {
  console.log(`[Worker ${WORKER_ID}] Обработка задачи #${task.id} (тип: ${task.type})`);

  await sleep(1000 + Math.random() * 1000);

  if (Math.random() < 0.6) {
    throw new Error(`Сервис "${task.type}" временно недоступен`);
  }

  console.log(`[Worker ${WORKER_ID}] Задача #${task.id} успешно выполнена`);
}

async function handleMessage(channel, msg) {
  if (!msg) return;

  const task       = JSON.parse(msg.content.toString());
  const retryCount = msg.properties.headers?.['x-retry-count'] ?? 0;

  console.log(`\n[Worker ${WORKER_ID}] Получена задача (попытка ${retryCount + 1}/${MAX_RETRIES + 1}):`, task.id);

  try {
    await processTask(task);
    channel.ack(msg);
  } catch (err) {
    console.error(`[Worker ${WORKER_ID}] Ошибка: ${err.message}`);

    if (retryCount < MAX_RETRIES) {
      const delay = calcBackoff(retryCount);
      console.warn(
        `[Worker ${WORKER_ID}] Повтор через ${delay}ms` +
        ` (попытка ${retryCount + 1}/${MAX_RETRIES})`
      );

      channel.nack(msg, false, false);

      await sleep(delay);
      channel.sendToQueue(
        QUEUES.MAIN,
        msg.content,
        {
          persistent: true,
          headers:    { 'x-retry-count': retryCount + 1 },
        }
      );
    } else {
      console.error(
        `[Worker ${WORKER_ID}] Задача #${task.id} отправлена в DLQ` +
        ` после ${MAX_RETRIES + 1} попыток`
      );
      channel.nack(msg, false, false);
    }
  }
}

(async () => {
  const { channel } = await createChannel();
  await setupQueues(channel);

  channel.prefetch(1);

  channel.consume(QUEUES.MAIN, (msg) => handleMessage(channel, msg));

  console.log(`[Worker ${WORKER_ID}] Запущен, ожидание задач из "${QUEUES.MAIN}"...`);
})();