// Middleware này hiện KHÔNG dùng next-intl routing middleware
// để tránh conflict với cấu trúc app/ không có [locale] segment.
//
// Locale được quản lý qua cookie NEXT_LOCALE, đọc trong app/layout.tsx.
// Khi cần thêm auth guard hoặc logic khác, viết ở đây.

export default function middleware() {
    // Không làm gì — tất cả pages hoạt động bình thường
    return
}

export const config = {
    // Chỉ match các page routes cần thiết (bỏ qua static và api)
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}
