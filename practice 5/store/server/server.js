const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${nanoid(10)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});


let products = [
  { id: nanoid(6), name: 'Классическая футболка', category: 'Футболки', description: 'Хлопок 100%, оверсайз', price: 1290, stock: 25, image: null },
  { id: nanoid(6), name: 'Джинсы скинни', category: 'Джинсы', description: 'Синие, эластичные, размеры 28-34', price: 3490, stock: 12, image: null },
  { id: nanoid(6), name: 'Кожаная куртка', category: 'Куртки', description: 'Натуральная кожа, чёрная', price: 8990, stock: 5, image: null },
  { id: nanoid(6), name: 'Спортивные штаны', category: 'Штаны', description: 'Трикотаж, утеплённые', price: 1990, stock: 18, image: null },
  { id: nanoid(6), name: 'Рубашка поло', category: 'Рубашки', description: 'Хлопок, пике, тёмно-синяя', price: 1790, stock: 10, image: null },
  { id: nanoid(6), name: 'Платье', category: 'Платья', description: 'Вискоза, цветочный принт', price: 2490, stock: 8, image: null },
  { id: nanoid(6), name: 'Кепка бейсболка', category: 'Аксессуары', description: 'Хлопок, чёрная, регулируемая', price: 890, stock: 30, image: null },
  { id: nanoid(6), name: 'Тёплый свитер', category: 'Свитеры', description: 'Шерсть с акрилом, серый', price: 2790, stock: 7, image: null },
  { id: nanoid(6), name: 'Шорты джинсовые', category: 'Шорты', description: 'Деним, летние', price: 1390, stock: 15, image: null },
  { id: nanoid(6), name: 'Толстовка с капюшоном', category: 'Толстовки', description: 'Флис, серая', price: 2990, stock: 11, image: null },
  { id: nanoid(6), name: 'Носки классические', category: 'Аксессуары', description: 'Хлопок, набор 3 пары', price: 590, stock: 40, image: null }
];

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fashion Store API',
      version: '1.0.0',
      description: 'API для управления товарами одежды (учебный пример)',
    },
    servers: [{ url: 'http://localhost:3000/api', description: 'Локальный сервер' }],
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['id', 'name', 'category', 'description', 'price', 'stock'],
          properties: {
            id: { type: 'string', example: 'abc123' },
            name: { type: 'string', example: 'Классическая футболка' },
            category: { type: 'string', example: 'Футболки' },
            description: { type: 'string', example: 'Хлопок 100%, оверсайз' },
            price: { type: 'number', example: 1290 },
            stock: { type: 'integer', example: 25 },
            image: { type: 'string', example: '/images/abc123.jpg', nullable: true }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'category', 'description', 'price', 'stock'],
          properties: {
            name: { type: 'string', example: 'Новый товар' },
            category: { type: 'string', example: 'Аксессуары' },
            description: { type: 'string', example: 'Описание' },
            price: { type: 'number', example: 990 },
            stock: { type: 'integer', example: 10 },
            image: { type: 'string', example: '/images/abc123.jpg', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string', example: 'Product not found' } }
        }
      }
    }
  },
  apis: ['./server.js']
};

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Раздача статических файлов из папки images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.is('json')) {
      console.log('Body:', req.body);
    }
  });
  next();
});

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}


/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Загрузить изображение
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Файл загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 path:
 *                   type: string
 *                   example: /images/abc123.jpg
 *       400:
 *         description: Ошибка загрузки
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imagePath = `/images/${req.file.filename}`;
  res.json({ path: imagePath });
});

/**
 * @swagger
 * /images/{filename}:
 *   delete:
 *     summary: Удалить изображение
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя файла (например, abc123.jpg)
 *     responses:
 *       204:
 *         description: Файл удалён
 *       404:
 *         description: Файл не найден
 */
app.delete('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const safePath = path.join(__dirname, 'images', path.basename(filename));
  if (!safePath.startsWith(path.join(__dirname, 'images'))) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  fs.unlinkSync(safePath);
  res.status(204).send();
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (product) res.json(product);
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Не заполнены обязательные поля
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, image } = req.body;

  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    image: image || null
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Обновить существующий товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { name, category, description, price, stock, image } = req.body;

  if (image !== undefined && product.image && product.image !== image) {
    const oldFilename = path.basename(product.image);
    const oldPath = path.join(__dirname, 'images', oldFilename);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (image !== undefined) product.image = image;

  res.json(product);
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удалён
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.image) {
    const filename = path.basename(product.image);
    const imagePath = path.join(__dirname, 'images', filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// 404 для остальных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
});