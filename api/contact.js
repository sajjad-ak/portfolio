const nodemailer = require('nodemailer');

// Shared in-memory storage (note: each serverless function instance has its own memory)
let messages = [];

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    // Allow the admin dashboard to fetch messages from this endpoint too
    return res.status(200).json(messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Store message in memory
    const msg = {
      id: Date.now(),
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    messages.push(msg);

    // Send email notification if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `New Portfolio Message: ${subject}`,
        text: `You received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<p>You received a new message from your portfolio website.</p>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Subject:</strong> ${subject}</p>
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      });
    }

    return res.status(200).json({ success: true, id: msg.id });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
