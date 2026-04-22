require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const usersRouter = require('./routes/users');

require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.json({ message: 'PostgreSQL API работает' });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к PostgreSQL установлено');

    await sequelize.sync({ alter: true });
    console.log('Таблицы синхронизированы');

    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err.message);
    process.exit(1);
  }
};

start();
