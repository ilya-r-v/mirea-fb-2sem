const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const app = express();
const port = 3000;

const JWT_SECRET = '19d9b12984014b83483b2b9e7b1cb26659cd4623d42ec01c5a0d1a97734590b0004d91828947e3ffee5e1fafc13b7979cfffcb5417d79f5a71b7140277f95e9f';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_SECRET = '7a6187ba12b25a22e92e89018eaddd8822bbd4f729dea84e87004dc683a1cf6e171692db518feea91e45046be3a2f23af5e62b05b17bdad0e43dd39b5f222a7a';
const REFRESH_EXPIRES_IN = '7d';

app.use(cors());

let users = [];
let products = [];

const refreshTokens = new Set();

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth & Products API',
      version: '1.0.0',
      description: 'API для регистрации, авторизации (JWT + refresh) и управления товарами с RBAC',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const hashPassword = async (password) => {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role middleware
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "abc123"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         first_name:
 *           type: string
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           example: "Петров"
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *           example: "user"
 *         blocked:
 *           type: boolean
 *           example: false
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "prod123"
 *         title:
 *           type: string
 *           example: "Ноутбук"
 *         category:
 *           type: string
 *           example: "Электроника"
 *         description:
 *           type: string
 *           example: "Мощный игровой ноутбук"
 *         price:
 *           type: number
 *           example: 1200.50
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "ivan@example.com"
 *               first_name:
 *                 type: string
 *                 example: "Иван"
 *               last_name:
 *                 type: string
 *                 example: "Иванов"
 *               password:
 *                 type: string
 *                 example: "qwerty123"
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *                 example: "user"
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Не все поля заполнены или email уже существует
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

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    password: hashedPassword,
    role: userRole,
    blocked: false,
  };
  users.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пара токенов
 *       401:
 *         description: Неверные данные или аккаунт заблокирован
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (user.blocked) {
    return res.status(403).json({ error: 'Аккаунт заблокирован' });
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
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

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required in body' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
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
  const userId = req.user.sub;
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ─── Users (admin only) ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const result = users.map(({ password: _, ...u }) => u);
  res.json(result);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя (только admin)
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

  const { password: _, ...userWithoutPassword } = users[idx];
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });

  users[idx].blocked = true;
  res.status(204).send();
});

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (user, seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/products', authMiddleware, (req, res) => {
  res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (user, seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  const { title, category, description, price } = req.body;
  const updatedProduct = { ...products[productIndex] };

  if (title !== undefined) updatedProduct.title = title;
  if (category !== undefined) updatedProduct.category = category;
  if (description !== undefined) updatedProduct.description = description;
  if (price !== undefined) updatedProduct.price = Number(price);

  if (JSON.stringify(products[productIndex]) === JSON.stringify(updatedProduct)) {
    return res.status(400).json({ error: 'Нет данных для обновления' });
  }

  products[productIndex] = updatedProduct;
  res.status(200).json(updatedProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (только admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  products.splice(productIndex, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});