// File cấu hình để dễ dàng thay đổi link redirect
// Chỉ cần thay đổi các giá trị bên dưới để tùy chỉnh website

const CONFIG = {
    // Link đích mà bạn muốn redirect đến
    targetUrl: 'https://todayonus.com/posts/sad-news-just-15-minutes-ago-bruce-willis-family-broke-down-in-tears-as-they-announced-heartbreaking-news-to-fans-at-the-age-of-70-he-had-reached-a-devastating-turning-point-in-h',
    
    // Thông tin hiển thị trên Facebook/Twitter
    title: 'SAD NEWS: Just 15 minutes ago, Bruce Willis\' family broke down in tears as they announced heartbreaking news to fans — at the age of 70, he had reached a devastating turning point in his life, a truth so painful that it has left Hollywood in silence and millions of fans around the world shattered…',
    
    description: 'Known for his iconic roles in Die Hard, Pulp Fiction, The Sixth Sense, and countless other films, Willis has long been celebrated for his charisma, courage, and ability to bring intensity and humanity to every character.',
    
    // URL ảnh thumbnail (nên sử dụng ảnh từ link gốc)
    imageUrl: 'https://todayonus.com/wp-content/uploads/2025/01/bruce-willis-news.jpg',
    
    // URL của website gốc (để hiển thị trong preview)
    originalUrl: 'https://todayonus.com/posts/sad-news-just-15-minutes-ago-bruce-willis-family-broke-down-in-tears-as-they-announced-heartbreaking-news-to-fans-at-the-age-of-70-he-had-reached-a-devastating-turning-point-in-h',
    
    // Tên website
    siteName: 'TodayOnUs',
    
    // Thời gian delay trước khi redirect (milliseconds)
    redirectDelay: 2000,
    
    // Text hiển thị khi đang redirect
    loadingText: 'Đang chuyển hướng...',
    
    // Text hướng dẫn
    instructionText: 'Nếu không tự động chuyển hướng, vui lòng click vào link bên dưới:',
    
    // Text link thủ công
    manualLinkText: 'Click vào đây để tiếp tục'
};

// Export config để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
