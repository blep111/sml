const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const uaList = [
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/105.0.5195.136 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/87.0.4280.141 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/106.0.5249.126 Mobile Safari/537.36"
];

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

function parseCookies(cookieString) {
  const cookies = {};
  cookieString.split(';').forEach(item => {
    const [key, value] = item.split('=');
    if (key && value) cookies[key.trim()] = value.trim();
  });
  return cookies;
}

async function extractToken(cookie, ua) {
  try {
    const response = await axios.get('https://business.facebook.com/business_locations', {
      headers: {
        'User-Agent': ua,
        'Referer': 'https://www.facebook.com/'
      },
      headersCookie: cookie
    });
    const tokenMatch = response.data.match(/(EAAG\w+)/);
    return tokenMatch ? tokenMatch[1] : null;
  } catch (e) {
    return null;
  }
}

app.post('/api/share', async (req, res) => {
  const { cookie, link, limit } = req.body;
  if (!cookie || !link || !limit) {
    return res.json({ status: false, message: "Missing input." });
  }

  const ua = uaList[Math.floor(Math.random() * uaList.length)];
  const token = await extractToken(cookie, ua);
  if (!token) {
    return res.json({ status: false, message: "Token extraction failed. Check cookie." });
  }

  let success = 0;
  for (let i = 0; i < limit; i++) {
    try {
      const response = await axios.post(`https://graph.facebook.com/v18.0/me/feed`, null, {
        params: {
          link: link,
          access_token: token,
          published: 0
        },
        headers: { "User-Agent": ua },
        headersCookie: cookie
      });

      if (response.data && response.data.id) {
        success++;
      } else {
        break;
      }
    } catch (err) {
      break;
    }
  }

  res.json({ status: true, message: `✅ Shared ${success} times.`, success_count: success });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));