const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'portfolio.db');
const db = new Database(dbPath);

// Initialize table
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
