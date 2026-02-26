/**
 * LUMEN AI — Server (Windows / macOS / Linux / Render / Railway)
 * Không cần npm install — chỉ cần Node.js
 * 
 * LOCAL:  node server.js  →  http://localhost:3000
 * WEB:    Deploy lên Render/Railway/Vercel với ANTHROPIC_API_KEY env var
 */

// ── Load .env nếu có ────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
      if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    });
} catch(e) {}

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT    = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

if (!API_KEY) {
  console.log('\x1b[33m');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║  ⚠️  ANTHROPIC_API_KEY chưa được set!    ║');
  console.log('  ║  Tạo file .env với nội dung:             ║');
  console.log('  ║  ANTHROPIC_API_KEY=sk-ant-...            ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('\x1b[0m');
}

// ── Static files: serve from ./public/ hoặc ./ ─────────────────────────────
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

function serveFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'text/plain; charset=utf-8';
  fs.readFile(filePath, (err, data) => {
    if (err) return null; // signal not found
    res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache'});
    res.end(data);
  });
  return true;
}

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API PROXY ─────────────────────────────────────────────────────────────
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); }
      catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'Bad JSON'}));
        return;
      }

      // Sliding window: giữ 30 messages gần nhất
      if (Array.isArray(payload.messages) && payload.messages.length > 30)
        payload.messages = payload.messages.slice(-30);

      if (!API_KEY) {
        res.writeHead(503, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:'API key chưa được cài đặt. Thêm ANTHROPIC_API_KEY vào file .env rồi restart server.'}}));
        return;
      }

      const postData = JSON.stringify(payload);
      const opts = {
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

      const pReq = https.request(opts, pRes => {
        let data = '';
        pRes.on('data', c => data += c);
        pRes.on('end', () => {
          res.writeHead(pRes.statusCode, {'Content-Type':'application/json'});
          res.end(data);
          const status = pRes.statusCode === 200 ? '\x1b[32m200 OK\x1b[0m' : `\x1b[31m${pRes.statusCode}\x1b[0m`;
          console.log(`  [${new Date().toLocaleTimeString('vi-VN')}] /api/chat → ${status} | msgs: ${(payload.messages||[]).length}`);
        });
      });
      pReq.on('error', err => {
        console.error('  Proxy error:', err.message);
        res.writeHead(502, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:'Không thể kết nối Anthropic API: ' + err.message}}));
      });
      pReq.write(postData);
      pReq.end();
    });
    return;
  }

  // ── STATIC FILES ──────────────────────────────────────────────────────────
  // Route mapping
  const routeMap = {
    '/': 'index.html',
    '/advanced': 'lumen-advanced.html',
    '/advanced/': 'lumen-advanced.html',
  };

  let fileName = routeMap[pathname] || pathname.replace(/^\//, '');

  // Try public/ first, then root
  const tryPaths = [
    path.join(__dirname, 'public', fileName),
    path.join(__dirname, fileName),
  ];

  let served = false;
  function tryNext(i) {
    if (i >= tryPaths.length) {
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
      res.end(`<!DOCTYPE html><html lang="vi"><body style="font-family:sans-serif;padding:48px 40px;background:#0e1117;color:#f5f0e8;max-width:600px;margin:0 auto">
        <h2 style="color:#e0956e">404 — Không tìm thấy</h2>
        <p style="color:#a0948c;margin-top:8px">Đường dẫn: <code>${pathname}</code></p>
        <div style="margin-top:32px;display:flex;gap:12px">
          <a href="/" style="padding:10px 20px;background:#c4735a;color:white;text-decoration:none;border-radius:50px;font-size:.9rem">🌿 LUMEN Chat</a>
          <a href="/advanced" style="padding:10px 20px;border:1px solid #c4735a;color:#e0956e;text-decoration:none;border-radius:50px;font-size:.9rem">⚡ Full App</a>
        </div>
      </body></html>`);
      return;
    }
    fs.readFile(tryPaths[i], (err, data) => {
      if (err) { tryNext(i+1); return; }
      const ext  = path.extname(tryPaths[i]).toLowerCase();
      const mime = MIME[ext] || 'text/plain; charset=utf-8';
      res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache'});
      res.end(data);
    });
  }
  tryNext(0);
});

server.listen(PORT, '0.0.0.0', () => {
  const line = '═'.repeat(44);
  console.log('\x1b[36m');
  console.log(`  ╔${line}╗`);
  console.log(`  ║          LUMEN AI — Server Running              ║`);
  console.log(`  ╠${line}╣`);
  console.log(`  ║  🌿  http://localhost:${PORT}          (Chat)        ║`);
  console.log(`  ║  ⚡  http://localhost:${PORT}/advanced  (Full App)   ║`);
  console.log(`  ╠${line}╣`);
  console.log(`  ║  API Key: ${API_KEY ? '✅ Loaded                              ' : '❌ Missing — tạo file .env             '}║`);
  console.log(`  ╚${line}╝`);
  console.log('\x1b[0m');
  console.log('  Nhấn Ctrl+C để dừng server\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m  ❌ Port ${PORT} đang được dùng. Đổi PORT trong .env hoặc đóng app đang dùng port này.\x1b[0m`);
  } else {
    console.error('\x1b[31m  ❌ Server error:', err.message, '\x1b[0m');
  }
  process.exit(1);
});
