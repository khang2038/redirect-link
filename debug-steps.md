# 🔧 Debug Steps - Facebook Preview Issue

## ❌ Vấn đề hiện tại:
- Facebook trả về mã lỗi 418 (I'm a teapot)
- Vẫn hiển thị "Loading..." thay vì tiêu đề thực tế
- Timeout sau 11 giây

## ✅ Giải pháp mới:

### 1. **Tạo Function đơn giản hơn:**
- File: `netlify/functions/simple-render.js`
- Timeout ngắn hơn (5 giây)
- Logging chi tiết để debug
- Logic đơn giản hơn

### 2. **Cập nhật redirects:**
- Chuyển từ `render-page` sang `simple-render`
- File: `netlify.toml`

## 🚀 Deploy Steps:

1. **Upload files mới:**
   ```
   netlify/functions/simple-render.js
   netlify.toml (updated)
   ```

2. **Redeploy trên Netlify**

3. **Test function trực tiếp:**
   ```
   https://newspaper24h.netlify.app/.netlify/functions/simple-render?path=/posts/test
   ```

4. **Check logs:**
   - Vào Netlify Dashboard
   - Functions tab
   - Xem logs của `simple-render`

## 🧪 Test Facebook:

1. **Facebook Sharing Debugger:**
   - URL: `https://newspaper24h.netlify.app/posts/test`
   - Click "Scrape Again"

2. **Kiểm tra logs:**
   - Xem có lỗi gì trong function logs
   - Meta info có được fetch đúng không

## 🔍 Debug Info:

Function sẽ log:
- Event details
- Path và Request URL
- Target URL
- Meta info được fetch
- Errors nếu có

## 📋 Checklist:

- [ ] Upload `simple-render.js`
- [ ] Update `netlify.toml`
- [ ] Redeploy
- [ ] Test function trực tiếp
- [ ] Check logs
- [ ] Test Facebook Debugger
- [ ] Verify og:title và og:image

**Nếu vẫn lỗi, check logs để xem function có chạy đúng không!** 🔍
