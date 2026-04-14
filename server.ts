import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import qrcode from 'qrcode';
import fs from 'fs';

const JWT_SECRET = 'farmacia-secret-key-2026';
const db = new Database('pharmacy.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    concentration TEXT,
    presentation TEXT,
    quantity INTEGER,
    price REAL,
    low_stock_threshold INTEGER DEFAULT 10,
    batch TEXT,
    expiration_date TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    status TEXT DEFAULT 'created',
    type TEXT,
    total REAL,
    shipping_fee REAL DEFAULT 0,
    address TEXT,
    phone TEXT,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    slip_path TEXT,
    payment_confirmed INTEGER DEFAULT 0,
    FOREIGN KEY(customer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    medication_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(medication_id) REFERENCES medications(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const clerkPass = bcrypt.hashSync('clerk123', salt);
  const customerPass = bcrypt.hashSync('user123', salt);

  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run('admin@farmacia.com', adminPass, 'admin', 'Administrador');
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run('clerk@farmacia.com', clerkPass, 'clerk', 'Dependiente Juan');
  db.prepare('INSERT INTO users (email, password, role, name, address) VALUES (?, ?, ?, ?, ?)').run('cliente@gmail.com', customerPass, 'customer', 'Carlos Pérez', 'Calle Principal 123');

  // Seed medications
  const meds = [
    ['Paracetamol', '500mg', 'Tabletas', 100, 5.50],
    ['Ibuprofeno', '400mg', 'Cápsulas', 50, 8.20],
    ['Amoxicilina', '500mg', 'Cápsulas', 20, 15.00],
    ['Loratadina', '10mg', 'Tabletas', 5, 12.00], // Low stock
    ['Omeprazol', '20mg', 'Cápsulas', 80, 9.50]
  ];
  const insertMed = db.prepare('INSERT INTO medications (name, concentration, presentation, quantity, price) VALUES (?, ?, ?, ?, ?)');
  meds.forEach(m => insertMed.run(...m));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  app.use('/uploads', express.static('uploads'));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  const upload = multer({ storage });

  // --- API Routes ---

  // Auth
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, role: user.role, name: user.name } });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  });

  // Medications (Inventory)
  app.get('/api/medications', (req, res) => {
    const meds = db.prepare('SELECT * FROM medications').all();
    res.json(meds);
  });

  app.post('/api/medications', (req, res) => {
    const { name, concentration, presentation, quantity, price, low_stock_threshold, batch, expiration_date } = req.body;
    db.prepare('INSERT INTO medications (name, concentration, presentation, quantity, price, low_stock_threshold, batch, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(name, concentration, presentation, quantity, price, low_stock_threshold || 10, batch, expiration_date);
    res.json({ success: true });
  });

  app.put('/api/medications/:id', (req, res) => {
    const { id } = req.params;
    const { name, concentration, presentation, quantity, price, low_stock_threshold, batch, expiration_date } = req.body;
    db.prepare('UPDATE medications SET name=?, concentration=?, presentation=?, quantity=?, price=?, low_stock_threshold=?, batch=?, expiration_date=? WHERE id=?')
      .run(name, concentration, presentation, quantity, price, low_stock_threshold, batch, expiration_date, id);
    res.json({ success: true });
  });

  // Orders
  app.post('/api/orders', upload.single('slip'), async (req, res) => {
    const { customer_id, type, items, address, phone, reference, shipping_fee } = req.body; // items is JSON string
    const parsedItems = JSON.parse(items);
    
    let total = 0;
    parsedItems.forEach((item: any) => {
      total += item.price * item.quantity;
    });

    const finalTotal = total + (parseFloat(shipping_fee) || 0);

    const info = db.prepare('INSERT INTO orders (customer_id, type, total, shipping_fee, address, phone, reference, slip_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(customer_id, type, finalTotal, shipping_fee || 0, address, phone, reference, req.file ? req.file.path : null);
    
    const orderId = info.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, medication_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    
    parsedItems.forEach((item: any) => {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    });

    // Generate Lightning Invoice QR (Mock)
    const lightningInvoice = `lnbc${finalTotal}u1p...mock_invoice_for_order_${orderId}`;
    const qrCodeDataUrl = await qrcode.toDataURL(lightningInvoice);

    res.json({ orderId, qrCodeDataUrl, total: finalTotal });
  });

  app.get('/api/orders', (req, res) => {
    const { role, userId } = req.query;
    let orders;
    if (role === 'customer') {
      orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(userId);
    } else {
      orders = db.prepare(`
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        ORDER BY created_at DESC
      `).all();
    }
    res.json(orders);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    const items = db.prepare(`
      SELECT oi.*, m.name, m.concentration 
      FROM order_items oi 
      JOIN medications m ON oi.medication_id = m.id 
      WHERE oi.order_id = ?
    `).all(req.params.id);
    res.json({ ...order, items });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/orders/:id/confirm-payment', (req, res) => {
    db.prepare('UPDATE orders SET payment_confirmed = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Reports
  app.get('/api/reports/sales', (req, res) => {
    const { period } = req.query; // daily, weekly, monthly
    let dateFilter = "date(created_at) = date('now')";
    if (period === 'weekly') dateFilter = "created_at >= date('now', '-7 days')";
    if (period === 'monthly') dateFilter = "created_at >= date('now', '-30 days')";

    const sales = db.prepare(`
      SELECT m.name, SUM(oi.quantity) as total_quantity, SUM(oi.quantity * oi.unit_price) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN medications m ON oi.medication_id = m.id
      WHERE o.payment_confirmed = 1 AND ${dateFilter}
      GROUP BY m.id
    `).all();

    const total = db.prepare(`
      SELECT SUM(total) as grand_total 
      FROM orders 
      WHERE payment_confirmed = 1 AND ${dateFilter}
    `).get() as any;

    res.json({ sales, grandTotal: total.grand_total || 0 });
  });

  app.get('/api/reports/orders', (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'created' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN created_at < datetime('now', '-24 hours') AND status != 'delivered' THEN 1 ELSE 0 END) as older_than_24h
      FROM orders
    `).get();
    res.json(stats);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
