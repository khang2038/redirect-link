# 🚀 Hướng dẫn Deploy với Netlify Functions

## 📁 Cấu trúc files cần upload:

```
📁 Root directory:
├── index.html                    ← File gốc (có thể xóa)
├── netlify.toml                 ← Cấu hình Netlify
├── netlify/
│   └── functions/
│       ├── render-page.js       ← Function chính
│       └── fetch-meta.js        ← Function phụ
└── _redirects                   ← File redirect (có thể xóa)
```

## 🔧 Cách hoạt động:

1. **User truy cập** `/posts/anything` → Netlify Function `render-page.js` chạy
2. **Function fetch meta info** từ `https://todayonus.com/posts/anything`
3. **Generate HTML** với meta tags đầy đủ
4. **Facebook crawler** thấy meta tags ngay lập tức
5. **User thường** redirect ngay lập tức

## ✅ Ưu điểm:

- **Server-side rendering** - Meta tags có sẵn ngay từ đầu
- **Facebook preview** hiển thị đúng tiêu đề, ảnh từ link gốc
- **Tốc độ nhanh** - User redirect ngay lập tức
- **Dynamic content** - Mỗi link có preview khác nhau

## 🚀 Deploy:

1. **Upload tất cả files** lên Netlify
2. **Deploy** - Netlify sẽ tự động build functions
3. **Test** các URL:
   - `https://your-site.netlify.app/posts/test`
   - `https://your-site.netlify.app/posts/anything`

## 🧪 Test Facebook Preview:

1. Vào [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Nhập URL của bạn
3. Xem preview hiển thị đúng tiêu đề, ảnh từ link gốc

## 🔍 Debug:

- Vào **Functions** tab trong Netlify Dashboard
- Xem logs của function `render-page`
- Kiểm tra có lỗi gì không

**Giải pháp này sẽ hoạt động hoàn hảo với Facebook preview!** 🎉
