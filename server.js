require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const path     = require('path');
const db       = require('./db');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,          // set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 4   // 4 hours
  }
}));

// Serve static files (but NOT admin.html directly — that goes through auth)
app.use(express.static(__dirname, {
  index: false                    // don't auto-serve index.html for "/"
}));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Auth middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }
  // For API calls return 401, for page visits redirect
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in at /admin.' });
  }
  return res.redirect('/admin-login');
}

// ── Admin login routes ──────────────────────────────────────────────────────
app.get('/admin-login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.post('/api/admin/login', (req, res) => {
  const { token } = req.body;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Admin token not configured on server.' });
  }

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid password. Access denied.' });
  }

  req.session.isAdmin = true;
  req.session.loginTime = new Date().toISOString();
  return res.json({ success: true, redirect: '/admin' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ── Admin page (protected) ──────────────────────────────────────────────────
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Contact form API ────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const info = db.insertMessage(name, email, subject, message);

    // Send email notification (in background)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password_here') {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `New Portfolio Message: ${subject}`,
        text: `You received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<p>You received a new message from your portfolio website.</p>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
      }).catch(err => console.error('Error sending email:', err));
    }

    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Messages API (protected) ────────────────────────────────────────────────
app.get('/api/messages', requireAdmin, (req, res) => {
  try {
    const messages = db.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/messages/:id/read', requireAdmin, (req, res) => {
  try {
    db.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/messages/:id', requireAdmin, (req, res) => {
  try {
    db.deleteMessage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Fallback ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}/`);
    console.log(`🔐 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`   (Login at: http://localhost:${PORT}/admin-login)`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
  });
}

module.exports = app;
