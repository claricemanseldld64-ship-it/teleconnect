require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { BOT_TOKEN, CHAT_ID, PORT = 3000 } = process.env;

const app = express();

app.set('trust proxy', 1);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CSP for connect-up
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

app.use(['/connect-up', '/connect-up.html'], connectUpCsp);

app.use(express.json({ limit: '1kb' }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Connect-up page
app.get(['/connect-up', '/connect-up.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect-up.html'));
});

// Connect page
app.get('/connect.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Too many attempts. Please try again later.'
  }
});

// Telegram API
app.post('/api/colors', limiter, async (req, res) => {
  const colors =
    typeof req.body.colors === 'string'
      ? req.body.colors.trim()
      : '';

  if (
    !colors ||
    colors.length > 100 ||
    !/^[\p{L}\p{N}\s,#-]+$/u.test(colors)
  ) {
    return res.status(400).json({
      ok: false,
      error: 'Please enter valid colours (letters and commas only).'
    });
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('BOT_TOKEN or CHAT_ID is missing.');
    return res.status(500).json({
      ok: false,
      error: 'Server configuration error.'
    });
  }

  try {
    const tg = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: ` New favourite phrase entry:\n${phrase}`
        })
      }
    );

    const data = await tg.json();

    if (!data.ok) {
      console.error('Telegram error:', data.description);

      return res.status(502).json({
        ok: false,
        error: 'Could not send. Please try again.'
      });
    }

    res.json({ ok: true });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      ok: false,
      error: 'Server error. Please try again.'
    });
  }
});

// Local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
  });
}

module.exports = app;