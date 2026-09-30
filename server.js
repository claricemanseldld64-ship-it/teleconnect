require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { BOT_TOKEN, CHAT_ID, PORT = 3000 } = process.env;
if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Missing BOT_TOKEN or CHAT_ID in .env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // needed when hosted behind a proxy (Render, Heroku, Nginx...)

// General security headers for the whole site (your existing pages keep working)
app.use(helmet({ contentSecurityPolicy: false }));

// Strict Content Security Policy, applied ONLY to the connect-up page
const connectUpCsp = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    connectSrc: ["'self'"],
    imgSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  }
});
app.use(['/connect-up', './connect-up.html'], connectUpCsp);

app.use(express.json({ limit: '1kb' })); // reject big payloads
// /connect-up serves the connect-up page (your own index.html stays the home page)
app.get(['/connect-up', '/connect-up.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'connect-up.html'));
});


// Everything in /public is served as normal; "/" loads YOUR existing index.html
const fs = require('fs');

// Look for the home page in these places, in order
const publicDir = path.join(__dirname, 'public');
const rootDir = __dirname;

app.use(express.static(publicDir));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/hero-scanning.mp4', express.static(path.join(__dirname, 'hero-scanning.mp4')));

app.get('/', (req, res) => {
  const inPublic = path.join(publicDir, 'index.html');
  const inRoot = path.join(rootDir, 'index.html');

  if (fs.existsSync(inPublic)) return res.sendFile(inPublic);
  if (fs.existsSync(inRoot)) return res.sendFile(inRoot);

  console.log('index.html not found in:', publicDir, 'or', rootDir);
  res.status(404).send('index.html not found. Check the terminal for where the server is looking.');
});

// Max 5 submissions per IP every 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many attempts. Please try again later.' }
});

app.post('/api/colors', limiter, async (req, res) => {
  const colors = typeof req.body.colors === 'string' ? req.body.colors.trim() : '';

  // Validate: letters, numbers, spaces, commas, # and hyphens only, max 100 chars
  if (!colors || colors.length > 100 || !/^[\p{L}\p{N}\s,#-]+$/u.test(colors)) {
    return res.status(400).json({ ok: false, error: 'Please enter valid colours (letters and commas only).' });
  }

  try {
    const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: `🎨 New favourite colours entry:\n${colors}` })
    });
    const data = await tg.json();
    if (!data.ok) {
      console.error('Telegram error:', data.description); // logged on server only
      return res.status(502).json({ ok: false, error: 'Could not send. Please try again.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error. Please try again.' });
  }
});
app.get('/connect.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'connect.html'));
});

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));