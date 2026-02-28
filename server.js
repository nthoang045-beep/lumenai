/**
 * LUMEN SCHOOL OFFICIAL — COMPLETE EDITION
 * Risk Detection + Local Privacy + Admin Alert
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const url = require("url");

/* ================= ENV ================= */

try {
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
      if (m)
        process.env[m[1]] = m[2]
          .trim()
          .replace(/^["']|["']$/g, "");
    });
} catch {}

const PORT = process.env.PORT || 3000;
const API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

if (!API_KEY) {
  console.log("⚠️ Missing ANTHROPIC_API_KEY");
}

/* ================= SCHOOL SYSTEM PROMPT ================= */

const SYSTEM_PROMPT = `
Bạn là LUMEN — Hệ thống hỗ trợ cảm xúc chính thức dành cho học sinh Việt Nam (13–18 tuổi).

Phân tầng:
Level 1: cảm xúc nhẹ
Level 2: căng thẳng trung bình
Level 3: nguy cơ cao (bạo lực, tự hại, tuyệt vọng)

Nếu Level 3:
- Nhấn mạnh không phải lỗi của học sinh
- Khuyến khích tìm giáo viên / phụ huynh
- Gợi ý gọi 111 (Tổng đài bảo vệ trẻ em VN)

Không nói "cố lên", không giáo điều.

Output JSON:

{
  "emotion_score": number,
  "risk_level": 1 | 2 | 3,
  "detected_patterns": [array],
  "reply": "..."
}

Chỉ trả JSON.
`;

/* ================= SERVER ================= */

const server = http.createServer((req, res) => {

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ================= CHAT ================= */

  if (pathname === "/api/chat" && req.method === "POST") {

    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", () => {

      let userInput;
      try {
        userInput = JSON.parse(body).message;
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const payload = JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userInput }]
      });

      const options = {
        hostname: "api.anthropic.com",
        port: 443,
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01"
        }
      };

      const proxy = https.request(options, pRes => {

        let data = "";
        pRes.on("data", chunk => data += chunk);

        pRes.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.content?.[0]?.text || "{}";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(text);
          } catch {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "AI parse error" }));
          }
        });

      });

      proxy.on("error", err => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });

      proxy.write(payload);
      proxy.end();
    });

    return;
  }

  /* ================= ADMIN ALERT ================= */

  if (pathname === "/api/alert-admin" && req.method === "POST") {

    let body = "";

    req.on("data", chunk => body += chunk);

    req.on("end", () => {

      const data = JSON.parse(body);

      const message = `
🚨 LUMEN SCHOOL ALERT 🚨

Risk Level: ${data.risk}
Emotion Score: ${data.score}

Full Conversation:
${JSON.stringify(data.history, null, 2)}
`;

      // DISCORD
      if (DISCORD_WEBHOOK) {
        const parsedUrl = new URL(DISCORD_WEBHOOK);
        const payload = JSON.stringify({ content: message });

        const options = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        };

        const alertReq = https.request(options);
        alertReq.write(payload);
        alertReq.end();
      }

      // TELEGRAM
      if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {

        const payload = JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message
        });

        const options = {
          hostname: "api.telegram.org",
          path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        };

        const tgReq = https.request(options);
        tgReq.write(payload);
        tgReq.end();
      }

      res.writeHead(200);
      res.end(JSON.stringify({ status: "alert processed" }));
    });

    return;
  }

  /* ================= STATIC FILES ================= */

  const filePath =
    pathname === "/"
      ? path.join(__dirname, "index.html")
      : path.join(__dirname, pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200);
    res.end(data);
  });

});

/* ================= START ================= */

server.listen(PORT, () => {
  console.log("🎓 LUMEN SCHOOL OFFICIAL RUNNING ON PORT", PORT);
});
