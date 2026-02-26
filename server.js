/**
 * LUMEN AI — Clean Server
 * Chạy được: Windows / macOS / Linux / Render / Railway
 * Không cần express
 */

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');
const url   = require('url');

/* ================= ENV ================= */

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
      if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    });
} catch(e) {}

const PORT    = process.env.PORT || 3000;
const API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();

if (!API_KEY) {
  console.log('\x1b[33m⚠️  ANTHROPIC_API_KEY chưa được set!\x1b[0m');
}

/* ================= MIME ================= */

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.woff2':'font/woff2',
};

/* ================= SERVER ================= */

const server = http.createServer((req, res) => {

  const parsed   = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ================= API CHAT ================= */

  if (pathname === '/api/chat' && req.method === 'POST') {

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', () => {

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'Bad JSON'}));
        return;
      }

      if (!API_KEY) {
        res.writeHead(503, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'API key chưa được cấu hình'}));
        return;
      }

      // giữ tối đa 30 tin nhắn gần nhất
      if (Array.isArray(payload.messages) && payload.messages.length > 30) {
        payload.messages = payload.messages.slice(-30);
      }

      const postData = JSON.stringify(payload);

      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        }
      };

      const proxy = https.request(options, pRes => {

        let data = '';
        pRes.on('data', chunk => data += chunk);

        pRes.on('end', () => {
          res.writeHead(pRes.statusCode, {'Content-Type':'application/json'});
          res.end(data);
          console.log("API Status:", pRes.statusCode);
        });

      });

      proxy.on('error', err => {
        console.error("Proxy error:", err.message);
        res.writeHead(502, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'Không kết nối được API'}));
      });

      proxy.write(postData);
      proxy.end();
    });

    return;
  }

  /* ================= STATIC FILES ================= */

  const routeMap = {
    '/': 'index.html',
    '/advanced': 'lumen-advanced.html',
    '/advanced/': 'lumen-advanced.html',
  };

  let fileName = routeMap[pathname] || pathname.replace(/^\//, '');

  const tryPaths = [
    path.join(__dirname, 'public', fileName),
    path.join(__dirname, fileName),
  ];

  function tryNext(i) {
    if (i >= tryPaths.length) {
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
      res.end('<h2>404 - Không tìm thấy</h2>');
      return;
    }

    fs.readFile(tryPaths[i], (err, data) => {
      if (err) {
        tryNext(i+1);
        return;
      }

      const ext  = path.extname(tryPaths[i]).toLowerCase();
      const mime = MIME[ext] || 'text/plain; charset=utf-8';

      res.writeHead(200, {'Content-Type': mime});
      res.end(data);
    });
  }

  tryNext(0);
});

/* ================= START ================= */

server.listen(PORT, '0.0.0.0', () => {
  console.log("\n🚀 LUMEN AI Server Running");
  console.log("🌿 Chat: http://localhost:" + PORT);
  console.log("⚡ Full: http://localhost:" + PORT + "/advanced");
  console.log("API Key:", API_KEY ? "Loaded ✅" : "Missing ❌");
  console.log("");
});

server.on('error', err => {
  console.error("Server error:", err.message);
  process.exit(1);
});
