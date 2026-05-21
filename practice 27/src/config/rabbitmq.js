import amqplib from 'amqplib';

export const QUEUES = {
  MAIN:        'task_queue',
  DEAD_LETTER: 'dead_letter_queue',
};

export const EXCHANGES = {
  DLX: 'dlx_exchange',
};

export const MAX_RETRIES = 3;

export async function createChannel(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await amqplib.connect('amqp://localhost');
      const channel    = await connection.createChannel();
      console.log('[RabbitMQ] Подключение установлено');
      return { connection, channel };
    } catch (err) {
      console.warn(`[RabbitMQ] Попытка ${i}/${retries} — не удалось подключиться. Повтор через 3с...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('[RabbitMQ] Не удалось установить соединение');
}

export async function setupQueues(channel) {
  await channel.assertExchange(EXCHANGES.DLX, 'direct', { durable: true });

  await channel.assertQueue(QUEUES.DEAD_LETTER, { durable: true });

  await channel.bindQueue(QUEUES.DEAD_LETTER, EXCHANGES.DLX, 'dead');

  await channel.assertQueue(QUEUES.MAIN, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':    EXCHANGES.DLX,
      'x-dead-letter-routing-key': 'dead',
    },
  });

  console.log(`[RabbitMQ] Очереди готовы: ${QUEUES.MAIN} → [DLX] → ${QUEUES.DEAD_LETTER}`);
}