let db;
let isMock = false;
let mockMessages = [];

try {
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  let dbPath = path.join(__dirname, 'portfolio.db');
  
  if (process.env.VERCEL) {
    dbPath = '/tmp/portfolio.db';
    const srcPath = path.join(__dirname, 'portfolio.db');
    if (fs.existsSync(srcPath) && !fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(srcPath, dbPath);
      } catch (e) {
        console.error('Failed to copy portfolio.db to /tmp:', e);
      }
    }
  }

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0
    )
  `);
} catch (err) {
  console.error('Failed to initialize SQLite database, using mock in-memory database:', err);
  isMock = true;
}

if (!isMock && db) {
  const insertMessageStmt = db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)');
  const getAllMessagesStmt = db.prepare('SELECT * FROM messages ORDER BY created_at DESC');
  const getMessageStmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  const markAsReadStmt = db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?');
  const deleteMessageStmt = db.prepare('DELETE FROM messages WHERE id = ?');

  module.exports = {
    insertMessage: (name, email, subject, message) => insertMessageStmt.run(name, email, subject, message),
    getAllMessages: () => getAllMessagesStmt.all(),
    getMessage: (id) => getMessageStmt.get(id),
    markAsRead: (id) => markAsReadStmt.run(id),
    deleteMessage: (id) => deleteMessageStmt.run(id)
  };
} else {
  module.exports = {
    insertMessage: (name, email, subject, message) => {
      const msg = {
        id: mockMessages.length + 1,
        name,
        email,
        subject,
        message,
        created_at: new Date().toISOString(),
        is_read: 0
      };
      mockMessages.push(msg);
      return { lastInsertRowid: msg.id };
    },
    getAllMessages: () => [...mockMessages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    getMessage: (id) => mockMessages.find(m => m.id == id),
    markAsRead: (id) => {
      const msg = mockMessages.find(m => m.id == id);
      if (msg) msg.is_read = 1;
    },
    deleteMessage: (id) => {
      mockMessages = mockMessages.filter(m => m.id != id);
    }
  };
}
