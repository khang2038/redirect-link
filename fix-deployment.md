# 🔧 Fix Deployment - Facebook Preview Issue

## ❌ Vấn đề đã phát hiện:

Từ logs, tôi thấy:
1. **Path parsing sai**: Function nhận path từ query parameter thay vì URL path
2. **Target URL sai**: Đang redirect đến Google thay vì todayonus.com
3. **Meta info lỗi**: "301 Moved" thay vì title thực tế

## ✅ Đã sửa:

### 1. **Function parsing:**
- Lấy path từ `queryStringParameters.path` hoặc `event.path`
- Xử lý đúng path để tạo target URL

### 2. **Redirects:**
- Sử dụng `:splat` để pass path vào function
- Format: `/posts/*` → `?path=/posts/:splat`

## 🚀 Deploy Steps:

1. **Upload files đã sửa:**
   ```
   netlify/functions/simple-render.js (updated)
   netlify.toml (updated)
   ```

2. **Redeploy trên Netlify**

3. **Test function:**
   ```
   https://newspaper24h.netlify.app/posts/test-article
   ```

## 🧪 Expected Results:

Sau khi deploy, function sẽ:
- Nhận đúng path: `/posts/test-article`
- Tạo target URL: `https://todayonus.com/posts/test-article`
- Fetch meta info từ todayonus.com
- Hiển thị title và image thực tế

## 📋 Test Checklist:

- [ ] Upload files mới
- [ ] Redeploy
- [ ] Test URL: `/posts/test-article`
- [ ] Check logs xem target URL có đúng không
- [ ] Test Facebook Debugger
- [ ] Verify og:title và og:image

**Bây giờ function sẽ nhận đúng path và fetch meta info từ todayonus.com!** 🎯
