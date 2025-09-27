# Redirect Link Website

Website redirect động với khả năng hiển thị preview tùy chỉnh trên Facebook và các mạng xã hội khác.

## 🚀 Cách hoạt động

Website sẽ tự động phân tích URL hiện tại và redirect theo logic sau:

- **Nếu URL có dạng**: `https://your-website.com/posts/[bất-kỳ-gì]`
  - → Fetch thông tin từ: `https://todayonus.com/posts/[bất-kỳ-gì]`
  - → Hiển thị preview với tiêu đề, mô tả, ảnh từ URL đích
  - → Redirect đến: `https://todayonus.com/posts/[bất-kỳ-gì]`
  
- **Nếu URL chỉ có**: `https://your-website.com/posts` (không có phần sau)
  - → Redirect đến: `https://google.com`
  
- **Nếu URL không có "posts"**:
  - → Redirect đến: `https://google.com`

## 🎯 Tính năng mới: Dynamic Meta Tags

Website sẽ **tự động lấy thông tin** từ URL đích để hiển thị preview chính xác:

- ✅ **Tiêu đề** - Lấy từ `og:title` hoặc `<title>` của trang đích
- ✅ **Mô tả** - Lấy từ `og:description` hoặc `meta description` của trang đích  
- ✅ **Ảnh thumbnail** - Lấy từ `og:image` hoặc `twitter:image` của trang đích
- ✅ **URL** - Hiển thị URL đích thực tế

## 📝 Cách sử dụng

1. **Upload files lên hosting** của bạn (có thể dùng GitHub Pages, Netlify, Vercel, hoặc bất kỳ hosting nào)

2. **Chia sẻ link**:
   - Chia sẻ URL với format: `https://your-website.com/posts/[tên-bài-viết]`
   - Website sẽ tự động fetch thông tin từ URL đích
   - Facebook sẽ hiển thị preview với **tiêu đề, mô tả, ảnh thực tế** từ trang đích
   - Khi click vào, người dùng sẽ được redirect đến link tương ứng trên todayonus.com

## 📁 Cấu trúc files

- `index.html` - File HTML chính với meta tags và JavaScript redirect động
- `config.js` - File cấu hình để dễ dàng thay đổi các thông số
- `test-examples.html` - File demo các ví dụ hoạt động
- `README.md` - Hướng dẫn sử dụng

## ⚙️ Tùy chỉnh

### Thay đổi base URL
Sửa trong file `index.html`, hàm `getRedirectUrl()`:

```javascript
// Thay đổi từ:
return `https://todayonus.com/posts/${pathAfterPosts}`;

// Thành:
return `https://your-target-site.com/posts/${pathAfterPosts}`;
```

### Thay đổi URL mặc định (khi không có posts)
Sửa trong file `index.html`:

```javascript
// Thay đổi từ:
return 'https://google.com';

// Thành:
return 'https://your-default-site.com';
```

### Thay đổi preview trên Facebook
Cập nhật các thông tin sau trong `config.js`:
- `title` - Tiêu đề hiển thị
- `description` - Mô tả hiển thị  
- `imageUrl` - URL ảnh thumbnail
- `originalUrl` - URL gốc để hiển thị trong preview

### Thay đổi thời gian redirect
Sửa `redirectDelay` trong `config.js` (tính bằng milliseconds):
```javascript
redirectDelay: 3000 // 3 giây
```

## Lưu ý

- Đảm bảo ảnh thumbnail có URL công khai và có thể truy cập được
- Test link trên Facebook Debugger để đảm bảo preview hiển thị đúng
- Có thể sử dụng với bất kỳ link nào, không chỉ link tin tức

## Facebook Debugger

Sử dụng [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) để test và refresh cache của Facebook khi cần thiết.
