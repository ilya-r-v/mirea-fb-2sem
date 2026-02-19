const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Товары одежды (11 штук) — поля rating и image удалены
let products = [
  { id: nanoid(6), name: 'Классическая футболка', category: 'Футболки', description: 'Хлопок 100%, оверсайз', price: 1290, stock: 25 },
  { id: nanoid(6), name: 'Джинсы скинни', category: 'Джинсы', description: 'Синие, эластичные, размеры 28-34', price: 3490, stock: 12 },
  { id: nanoid(6), name: 'Кожаная куртка', category: 'Куртки', description: 'Натуральная кожа, чёрная', price: 8990, stock: 5 },
  { id: nanoid(6), name: 'Спортивные штаны', category: 'Штаны', description: 'Трикотаж, утеплённые', price: 1990, stock: 18 },
  { id: nanoid(6), name: 'Рубашка поло', category: 'Рубашки', description: 'Хлопок, пике, тёмно-синяя', price: 1790, stock: 10 },
  { id: nanoid(6), name: 'Платье', category: 'Платья', description: 'Вискоза, цветочный принт', price: 2490, stock: 8 },
  { id: nanoid(6), name: 'Кепка бейсболка', category: 'Аксессуары', description: 'Хлопок, чёрная, регулируемая', price: 890, stock: 30 },
  { id: nanoid(6), name: 'Тёплый свитер', category: 'Свитеры', description: 'Шерсть с акрилом, серый', price: 2790, stock: 7 },
  { id: nanoid(6), name: 'Шорты джинсовые', category: 'Шорты', description: 'Деним, летние', price: 1390, stock: 15 },
  { id: nanoid(6), name: 'Толстовка с капюшоном', category: 'Толстовки', description: 'Флис, серая', price: 2990, stock: 11 },
  { id: nanoid(6), name: 'Носки классические', category: 'Аксессуары', description: 'Хлопок, набор 3 пары', price: 590, stock: 40 }
];

app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

// CORS для клиента на порту 3001
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Вспомогательная функция для поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// ----- Маршруты -----

// GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (product) res.json(product);
});

// POST /api/products (без rating и image)
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;

  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, category, description, price, stock' });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /api/products/:id (без rating и image)
app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { name, category, description, price, stock } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

// DELETE /api/products/:id
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// 404 для остальных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});