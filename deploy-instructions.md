# 🚀 Hướng dẫn Deploy với Dynamic Meta Tags

## 📁 Cấu trúc files cần upload:

```
📁 Root directory:
├── index.html                    ← File chính (cho URLs không có posts)
├── _redirects                    ← File redirect rules
├── netlify.toml                  ← File cấu hình Netlify
├── package.json                  ← Dependencies cho Netlify Functions
└── netlify/
    └── functions/
        └── meta.js               ← Netlify Function cho dynamic meta tags
```

## 🔧 Cách hoạt động:

### 1. **URLs có posts** (ví dụ: `/posts/anything`)
- → Được redirect đến Netlify Function `meta.js`
- → Function fetch meta info từ URL đích
- → Trả về HTML với meta tags đầy đủ
- → Facebook crawler thấy meta tags chính xác
- → User redirect ngay lập tức

### 2. **URLs không có posts** (ví dụ: `/`)
- → Được redirect đến `index.html`
- → Redirect đến Google

## 📋 Bước deploy:

### Bước 1: Upload files
Upload **TẤT CẢ** files trên lên Netlify

### Bước 2: Cài đặt dependencies
Netlify sẽ tự động cài `node-fetch` từ `package.json`

### Bước 3: Test
- `https://your-site.netlify.app/posts/anything` → Dynamic meta tags
- `https://your-site.netlify.app/posts` → Google
- `https://your-site.netlify.app/` → Google

## ✅ Kết quả:

- **Facebook preview**: Hiển thị đúng tiêu đề, mô tả, ảnh từ link gốc
- **Tốc độ**: User redirect ngay lập tức
- **Dynamic**: Meta tags thay đổi theo URL đích
- **Server-side**: Facebook crawler thấy meta tags ngay lập tức

## 🧪 Test Facebook:

1. Sử dụng [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Nhập URL: `https://your-site.netlify.app/posts/anything`
3. Xem preview hiển thị đúng thông tin từ link gốc
4. Click "Scrape Again" để refresh cache

## 🆘 Troubleshooting:

- **Function không chạy**: Kiểm tra `package.json` và dependencies
- **Meta tags không hiển thị**: Kiểm tra Netlify Function logs
- **Redirect không hoạt động**: Kiểm tra file `_redirects`
