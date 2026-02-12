const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
  { id: 1, name: 'Дом', price: 20000000 },
  { id: 2, name: 'Новостройка', price: 25000000 },
  { id: 3, name: 'Вторичка', price: 120000000 }
];

app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  product ? res.json(product) : res.status(404).json({ error: 'Товар не найден' });
});

app.post('/products', (req, res) => {
  const { name, price } = req.body;
  const newProduct = { id: Date.now(), name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  const { name, price } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  res.json(product);
});

app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.json({ message: 'Товар удалён' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});