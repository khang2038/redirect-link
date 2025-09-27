# 🚀 Hướng dẫn Deploy lên Netlify

## ❌ Vấn đề hiện tại:
- `https://newspaper24h.netlify.app/posts` → 404 Page not found
- `https://newspaper24h.netlify.app/posts/anything` → 404 Page not found

## ✅ Giải pháp:

### Bước 1: Upload đầy đủ files
Upload **TẤT CẢ** các files sau lên Netlify:

```
📁 Root directory:
├── index.html          ← File chính
├── _redirects          ← File cấu hình redirect (QUAN TRỌNG!)
├── netlify.toml        ← File cấu hình Netlify (QUAN TRỌNG!)
├── config.js           ← File cấu hình
├── README.md           ← Hướng dẫn
└── test-examples.html  ← File test
```

### Bước 2: Cấu hình Netlify
1. Vào **Site settings** > **Build & deploy** > **Deploy settings**
2. Đảm bảo **Publish directory** = `.` (root)
3. **Build command** = để trống
4. **Publish directory** = `.`

### Bước 3: Kiểm tra _redirects file
File `_redirects` phải có nội dung:
```
/*    /index.html   200
```

### Bước 4: Redeploy
1. Vào **Deploys** tab
2. Click **Trigger deploy** > **Deploy site**

## 🧪 Test sau khi deploy:

### ✅ Các URL sẽ hoạt động:
- `https://newspaper24h.netlify.app/` → Google
- `https://newspaper24h.netlify.app/posts` → Google  
- `https://newspaper24h.netlify.app/posts/anything` → todayonus.com

### 🔍 Debug nếu vẫn lỗi:
1. Vào **Functions** tab xem có lỗi gì không
2. Vào **Deploys** tab xem log deploy
3. Kiểm tra file `_redirects` có được upload không

## 📋 Checklist:
- [ ] Upload file `index.html`
- [ ] Upload file `_redirects` 
- [ ] Upload file `netlify.toml`
- [ ] Redeploy site
- [ ] Test URL `/posts`
- [ ] Test URL `/posts/anything`

## 🆘 Nếu vẫn lỗi:
1. Xóa toàn bộ files cũ trên Netlify
2. Upload lại từ đầu
3. Đảm bảo file `_redirects` ở root directory
4. Redeploy
