const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('redis');

const app = express();
const port = 3000;

const JWT_SECRET = '19d9b12984014b83483b2b9e7b1cb26659cd4623d42ec01c5a0d1a97734590b0004d91828947e3ffee5e1fafc13b7979cfffcb5417d79f5a71b7140277f95e9f';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_SECRET = '7a6187ba12b25a22e92e89018eaddd8822bbd4f729dea84e87004dc683a1cf6e171692db518feea91e45046be3a2f23af5e62b05b17bdad0e43dd39b5f222a7a';
const REFRESH_EXPIRES_IN = '7d';

const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;

app.use(cors());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Разрешены только изображения (jpeg, jpg, png, webp)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

let users = [];
let products = [];
const refreshTokens = new Set();

app.use(express.json());

const redisClient = createClient({
  url: 'redis://127.0.0.1:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

async function initRedis() {
  await redisClient.connect();
  console.log('Redis подключён');
}

/**
 * Middleware чтения из кэша.
 * Логирует попадание/промах в консоль.
 */
function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`[CACHE HIT] key: ${key}`);
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }
      console.log(`[CACHE MISS] key: ${key}`);
      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error('Cache read error:', err);
      next();
    }
  };
}

async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    console.log(`[CACHE SAVE] key: ${key}, TTL: ${ttl}s`);
  } catch (err) {
    console.error('Cache save error:', err);
  }
}

async function invalidateUsersCache(userId = null) {
  try {
    console.log(`[CACHE INVALIDATE] users:all`);
    await redisClient.del('users:all');
    if (userId) {
      console.log(`[CACHE INVALIDATE] users:${userId}`);
      await redisClient.del(`users:${userId}`);
    }
  } catch (err) {
    console.error('Users cache invalidate error:', err);
  }
}

async function invalidateProductsCache(productId = null) {
  try {
    console.log(`[CACHE INVALIDATE] products:all`);
    await redisClient.del('products:all');
    if (productId) {
      console.log(`[CACHE INVALIDATE] products:${productId}`);
      await redisClient.del(`products:${productId}`);
    }
  } catch (err) {
    console.error('Products cache invalidate error:', err);
  }
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth & Products API (with Redis cache)',
      version: '2.0.0',
      description: 'API с регистрацией, авторизацией (JWT + refresh), RBAC и кэшированием через Redis',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const hashPassword = async (password) => bcrypt.hash(password, 10);
const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);
const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

const generateAccessToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

const generateRefreshToken = (user) =>
  jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (findUserByEmail(email)) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }
  const allowedRoles = ['user', 'seller', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'user';
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    password: await hashPassword(password),
    role: userRole,
    blocked: false,
  };
  users.push(newUser);

  await invalidateUsersCache();

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  const user = findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.blocked) return res.status(403).json({ error: 'Аккаунт заблокирован' });
  if (!await verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  res.status(200).json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов
 *     tags: [Auth]
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список пользователей — кэш 1 минута (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get(
  '/api/users',
  authMiddleware,
  roleMiddleware(['admin']),
  cacheMiddleware(() => 'users:all', USERS_CACHE_TTL),
  async (req, res) => {
    const data = users.map(({ password: _, ...u }) => u);
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: 'server', data });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Пользователь по ID — кэш 1 минута (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get(
  '/api/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const { password: _, ...data } = user;
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: 'server', data });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя + инвалидировать кэш (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });
  const { first_name, last_name, role } = req.body;
  const allowedRoles = ['user', 'seller', 'admin'];
  if (first_name !== undefined) users[idx].first_name = first_name;
  if (last_name !== undefined) users[idx].last_name = last_name;
  if (role !== undefined && allowedRoles.includes(role)) users[idx].role = role;

  await invalidateUsersCache(users[idx].id);

  const { password: _, ...userWithoutPassword } = users[idx];
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя + инвалидировать кэш (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });
  users[idx].blocked = true;

  await invalidateUsersCache(users[idx].id);

  res.status(204).send();
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар + инвалидировать кэш (seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.post(
  '/api/products',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  upload.single('image'),
  async (req, res) => {
    const { title, category, description, price } = req.body;
    if (!title || !category || !description || price === undefined) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    const newProduct = {
      id: nanoid(),
      title,
      category,
      description,
      price: Number(price),
      image: req.file ? `/uploads/${req.file.filename}` : null,
    };
    products.push(newProduct);

    await invalidateProductsCache();

    res.status(201).json(newProduct);
  }
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Список товаров — кэш 10 минут
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get(
  '/api/products',
  authMiddleware,
  cacheMiddleware(() => 'products:all', PRODUCTS_CACHE_TTL),
  async (req, res) => {
    await saveToCache(req.cacheKey, products, req.cacheTTL);
    res.json({ source: 'server', data: products });
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Товар по ID — кэш 10 минут
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get(
  '/api/products/:id',
  authMiddleware,
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    await saveToCache(req.cacheKey, product, req.cacheTTL);
    res.json({ source: 'server', data: product });
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар + инвалидировать кэш (seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.put(
  '/api/products/:id',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  upload.single('image'),
  async (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Товар не найден' });
    }
    const { title, category, description, price } = req.body;
    const updatedProduct = { ...products[productIndex] };
    if (title !== undefined) updatedProduct.title = title;
    if (category !== undefined) updatedProduct.category = category;
    if (description !== undefined) updatedProduct.description = description;
    if (price !== undefined) updatedProduct.price = Number(price);
    if (req.file) {
      if (updatedProduct.image) {
        const oldPath = path.join(__dirname, updatedProduct.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updatedProduct.image = `/uploads/${req.file.filename}`;
    }
    if (JSON.stringify(products[productIndex]) === JSON.stringify(updatedProduct)) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    products[productIndex] = updatedProduct;

    await invalidateProductsCache(updatedProduct.id);

    res.status(200).json(updatedProduct);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар + инвалидировать кэш (только admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) return res.status(404).json({ error: 'Товар не найден' });

  const removedId = products[productIndex].id;
  products.splice(productIndex, 1);

  await invalidateProductsCache(removedId);

  res.status(204).send();
});

initRedis().then(() => {
  app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
  });
});