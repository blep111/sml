// === server.js (Node.js + Express) ===

const express = require('express'); const axios = require('axios'); const path = require('path'); const app = express();

app.use(express.static('public')); app.use(express.json());

// Share Endpoint (requires token input) app.post('/api/share', async (req, res) => { const { token, link, limit } = req.body;

if (!token || !link || !limit) { return res.json({ status: false, message: '❌ Missing input fields.' }); }

let success = 0; for (let i = 0; i < limit; i++) { try { const response = await axios.post('https://graph.facebook.com/v18.0/me/feed', null, { params: { link, access_token: token, published: 0, }, }); if (response.data.id) { success++; } else { break; } } catch (err) { break; } }

res.json({ status: true, message: ✅ Shared ${success} times., success_count: success, }); });

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

const port = process.env.PORT || 5000; app.listen(port, () => console.log(✅ Server running at http://localhost:${port}));

