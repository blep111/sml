const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// User-Agent list
const uaList = [
  "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite)...",
  "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro)...",
  "Mozilla/5.0 (Linux; Android 11; G91 Pro)..."
];

// Extract token
const extractToken = async (cookie, ua) => {
  try {
    const cookieObj = cookie.split('; ').reduce((acc, curr) => {
      const [key, value] = curr.split('=');
      acc[key] = value;
      return acc;
    }, {});

    const response = await axios.get("https://business.facebook.com/business_locations", {
      headers: {
        "User-Agent": ua,
        "Referer": "https://www.facebook.com/"
      },
      headersCookie: cookie, // backup
    });

    const match = response.data.match(/(EAAG\w+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Share endpoint
app.post("/api/share", async (req, res) => {
  const { cookie, link, limit } = req.body;
  if (!cookie || !link || !limit) {
    return res.json({ status: false, message: "Missing input." });
  }

  const ua = uaList[Math.floor(Math.random() * uaList.length)];
  const token = await extractToken(cookie, ua);
  if (!token) {
    return res.json({ status: false, message: "Token extraction failed." });
  }

  let success = 0;
  for (let i = 0; i < limit; i++) {
    try {
      const response = await axios.post("https://graph.facebook.com/v18.0/me/feed", null, {
        params: {
          link,
          access_token: token,
          published: 0
        },
        headers: { "User-Agent": ua }
      });

      if (response.data.id) success++;
      else break;
    } catch {
      break;
    }
  }

  res.json({
    status: true,
    message: `✅ Shared ${success} times.`,
    success_count: success
  });
});

// 🟢 Route fallback to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});