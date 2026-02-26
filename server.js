
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const Anthropic = require("@anthropic-ai/sdk");

// 🔥 Đọc API key và loại bỏ khoảng trắng
const API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();

if (!API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is missing!");
}

const anthropic = new Anthropic({
  apiKey: API_KEY,
});

// Route test server sống
app.get("/ping", (req, res) => {
  res.send("alive");
});

// Route chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: response.content[0].text,
    });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
