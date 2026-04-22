require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/practice20';

app.use(express.json());

app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.json({ message: 'MongoDB API работает' });
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Подключение к MongoDB установлено');

    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err.message);
    process.exit(1);
  }
};

start();
