import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const uaList = [
  "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite)...",
  "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro)...",
  "Mozilla/5.0 (Linux; Android 11; G91 Pro)..."
];

const extractToken = async (cookie, ua) => {
  try {
    const cookieMap = Object.fromEntries(cookie.split("; ").map(c => c.split("=")));
    const res = await axios.get("https://business.facebook.com/business_locations", {
      headers: {
        "User-Agent": ua,
        "Referer": "https://www.facebook.com/"
      },
      headersCookie: cookie,
    });

    const match = res.data.match(/EAAG\w+/);
    return match ? match[0] : null;
  } catch (err) {
    console.error("Token extraction error:", err.message);
    return null;
  }
};

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
        headers: {
          "User-Agent": ua,
          "Cookie": cookie
        }
      });

      if (response.data.id) success++;
    } catch (e) {
      break;
    }
  }

  res.json({
    status: true,
    message: `✅ Shared ${success} times.`,
    success_count: success
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});