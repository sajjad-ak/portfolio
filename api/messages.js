// In-memory message storage for Vercel serverless
// Messages persist as long as the serverless function instance is warm
let messages = [];

module.exports = function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }

  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const msg = {
      id: messages.length + 1,
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    messages.push(msg);
    return res.status(201).json({ success: true, id: msg.id });
  }

  if (req.method === 'PATCH') {
    const id = parseInt(req.query.id);
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.is_read = 1;
      return res.status(200).json({ success: true });
    }
    return res.status(404).json({ error: 'Message not found' });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    messages = messages.filter(m => m.id !== id);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
