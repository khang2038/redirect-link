# 🚀 Hướng dẫn chạy Website Redirect Link

## 📋 Cách 1: Chạy Local Server (Nhanh nhất)

### Bước 1: Mở Terminal
```bash
cd /Users/baonguyen/Downloads/redirect-link
```

### Bước 2: Chạy Python Server
```bash
# Python 3
python3 -m http.server 8000

# Hoặc Python 2
python -m SimpleHTTPServer 8000
```

### Bước 3: Mở trình duyệt
Truy cập: `http://localhost:8000`

---

## 📋 Cách 2: Sử dụng Node.js (Nếu có cài Node.js)

### Bước 1: Cài đặt http-server
```bash
npm install -g http-server
```

### Bước 2: Chạy server
```bash
cd /Users/baonguyen/Downloads/redirect-link
http-server -p 8000
```

### Bước 3: Mở trình duyệt
Truy cập: `http://localhost:8000`

---

## 📋 Cách 3: Deploy lên hosting miễn phí

### Option A: GitHub Pages (Miễn phí)
1. Tạo repository trên GitHub
2. Upload file `index.html` lên repository
3. Vào Settings > Pages
4. Chọn source: Deploy from a branch
5. Chọn branch: main
6. Website sẽ có URL: `https://username.github.io/repository-name`

### Option B: Netlify (Miễn phí)
1. Truy cập: https://netlify.com
2. Kéo thả folder chứa `index.html` vào Netlify
3. Website sẽ có URL ngẫu nhiên
4. Có thể đổi tên miền tùy chỉnh

### Option C: Vercel (Miễn phí)
1. Truy cập: https://vercel.com
2. Import project từ GitHub hoặc upload files
3. Deploy tự động

---

## 🧪 Test Website

### Test 1: URL có posts
```
http://localhost:8000/posts/sad-news-bruce-willis
```
**Kết quả mong đợi:**
- Hiển thị preview với thông tin từ todayonus.com
- Redirect đến: `https://todayonus.com/posts/sad-news-bruce-willis`

### Test 2: URL chỉ có posts
```
http://localhost:8000/posts
```
**Kết quả mong đợi:**
- Redirect đến: `https://google.com`

### Test 3: URL không có posts
```
http://localhost:8000/
```
**Kết quả mong đợi:**
- Redirect đến: `https://google.com`

---

## 🔧 Debug và Troubleshooting

### Kiểm tra Console
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Xem log để debug:
   - Current URL
   - Target URL
   - Meta info fetch

### Lỗi CORS
Nếu gặp lỗi CORS khi fetch meta info:
- Website vẫn hoạt động bình thường
- Chỉ preview có thể không hiển thị đúng
- Có thể thay đổi CORS proxy khác

### Test Facebook Preview
1. Sử dụng: https://developers.facebook.com/tools/debug/
2. Nhập URL của website
3. Xem preview hiển thị
4. Click "Scrape Again" để refresh cache

---

## 📱 Test trên Mobile

### Test trên điện thoại
1. Tìm IP của máy tính: `ifconfig` (Mac) hoặc `ipconfig` (Windows)
2. Truy cập: `http://[IP-ADDRESS]:8000/posts/test`
3. Test trên Facebook mobile app

---

## ⚡ Quick Start (Nhanh nhất)

```bash
# Mở Terminal và chạy:
cd /Users/baonguyen/Downloads/redirect-link
python3 -m http.server 8000

# Mở trình duyệt:
open http://localhost:8000/posts/sad-news-bruce-willis
```

**Xong! Website đã chạy! 🎉**
