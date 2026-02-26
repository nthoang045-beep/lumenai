# 🌐 Deploy LUMEN AI Lên Internet (Miễn Phí)

## ✅ Render.com — Dễ nhất, miễn phí, không cần thẻ tín dụng

### Bước 1 — Tạo tài khoản
1. Mở trình duyệt → vào **https://render.com**
2. Click **Get Started for Free**
3. Đăng ký bằng GitHub hoặc email

---

### Bước 2 — Upload code
Render cần code trong GitHub. Làm theo 1 trong 2 cách:

#### Cách A: Dùng GitHub (Khuyên dùng)
1. Tạo tài khoản **https://github.com** nếu chưa có
2. New repository → đặt tên `lumen-ai` → Private
3. Upload thư mục `lumen-fixed`:
   - Vào repo → **Add file → Upload files**
   - Kéo thả toàn bộ files vào
   - Commit changes

#### Cách B: Dùng Render Shell (Không cần GitHub)
1. Đăng nhập Render → Dashboard
2. **New → Web Service → Deploy manually**

---

### Bước 3 — Tạo Web Service trên Render
1. Render Dashboard → **New +** → **Web Service**
2. Chọn GitHub repo `lumen-ai` (hoặc Public Git URL)
3. Điền thông tin:
   ```
   Name:          lumen-ai
   Region:        Singapore (gần VN nhất)
   Branch:        main
   Build Command: (để trống)
   Start Command: node server.js
   ```
4. **Instance Type**: Free

---

### Bước 4 — Thêm API Key (QUAN TRỌNG)
1. Cuộn xuống phần **Environment Variables**
2. Click **Add Environment Variable**
3. Điền:
   ```
   Key:   ANTHROPIC_API_KEY
   Value: sk-ant-api03-xxxx-your-key-here
   ```
4. Click **Save Changes**

---

### Bước 5 — Deploy
1. Click **Create Web Service**
2. Đợi ~2-3 phút để build
3. Nhận URL dạng: `https://lumen-ai-xxxx.onrender.com`
4. Mở URL → LUMEN AI đã live! 🎉

---

## ⚡ Railway.app — Thay thế nhanh hơn

1. Vào **https://railway.app** → Login với GitHub
2. **New Project → Deploy from GitHub repo**
3. Chọn repo `lumen-ai`
4. Variables tab → Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
5. Railway tự detect Node.js → Deploy tự động
6. Settings → Domains → Generate domain

---

## 🔑 Lấy Anthropic API Key

1. Vào **https://console.anthropic.com**
2. Đăng ký / đăng nhập
3. Settings → **API Keys** → **Create Key**
4. Copy key (bắt đầu bằng `sk-ant-api03-...`)
5. Lưu cẩn thận — chỉ hiện 1 lần!

---

## ⚠️ Lưu ý bảo mật

- **KHÔNG** commit file `.env` lên GitHub
- Thêm `.env` vào `.gitignore`:
  ```
  echo .env >> .gitignore
  ```
- Trên Render/Railway: nhập key trực tiếp vào Environment Variables
- API key chỉ nằm phía server — users không thấy được

---

## 🆘 Gặp lỗi?

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| `Port already in use` | Port 3000 đang bị chiếm | Đổi `PORT=3001` trong `.env` |
| `401 Unauthorized` | API key sai | Kiểm tra lại key trong `.env` |
| `Cannot find module` | Thiếu file | Chạy lại `CHAY-TREN-WINDOWS.bat` |
| Trình duyệt không mở | Firewall chặn | Mở thủ công: `http://localhost:3000` |
| Render deploy fail | Start command sai | Đổi thành `node server.js` |
