# 🎨 Smart Travel — Color Palette Reference

> Bảng màu chuẩn dùng cho toàn bộ giao diện. Áp dụng nhất quán trên tất cả các trang.

---

## 1. Backgrounds — Nền giao diện

| Tên | Mã màu | Dùng cho |
|---|---|---|
| Main Page Background | `#F0FDFA` | Nền trang tổng thể (`bg-[#F0FDFA]`) |
| Card / Container Background | `#FFFFFF` | Form, card, container nội dung |
| Active / Selected Background | `#CCFBF1` | Nút/thẻ đang được chọn, hover nhẹ |

---

## 2. Typography — Hệ thống chữ

| Tên | Mã màu | Dùng cho |
|---|---|---|
| Heading (H1, H2, H3, H4) | `#0F4C5C` | Tiêu đề chính |
| Body Text / User Input | `#3F3F46` | Đoạn văn bản, chữ nhập liệu |
| Placeholder / Secondary Text | `#A1A1AA` | Gợi ý trong form, chữ phụ, footer note |
| Brand Accent | `#5FCBC4` | Badge nhãn, giá tour, label trang trí |

---

## 3. Buttons & Interactions — Nút bấm

| Tên | Mã màu | Dùng cho |
|---|---|---|
| Primary Button Background | `#5FCBC4` | Nút CTA chính (bg) |
| Primary Button Hover | `#4AB8B0` | Hover nút CTA chính |
| Primary Button Text | `#FFFFFF` | Chữ bên trong nút CTA |
| Secondary Button Text | `#3F3F46` | Chữ nút phụ (outlined) |
| Secondary Button Hover BG | `#CCFBF1` | Hover nút phụ (outlined) |

---

## 4. Borders — Viền

| Tên | Mã màu | Dùng cho |
|---|---|---|
| Input / Card Border | `#E4E4E7` | Viền ô nhập liệu, viền card |
| Accent Border (hover) | `#5FCBC4` | Viền khi hover card/input |

---

## 5. Footer

| Tên | Mã màu | Dùng cho |
|---|---|---|
| Footer Background | `#1E293B` | Nền footer |
| Footer Text | `#94A3B8` | Chữ trong footer |
| Footer Link Hover | `#5FCBC4` | Màu link khi hover |

---

## 6. Tailwind Utility Classes — Tham khảo nhanh

```tsx
// Nền trang
className="bg-[#F0FDFA]"

// Tiêu đề
className="text-[#0F4C5C]"

// Chữ nội dung
className="text-[#3F3F46]"

// Chữ phụ / placeholder
className="text-[#A1A1AA]"

// Nút CTA chính
className="bg-[#5FCBC4] text-white hover:bg-[#4AB8B0]"

// Nút phụ (outlined)
className="border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]"

// Viền card / input
className="border border-[#E4E4E7]"

// Card nền trắng
className="bg-white"

// Active / Selected
className="bg-[#CCFBF1]"

// Footer
className="bg-[#1E293B] text-[#94A3B8]"
```

---

## 7. Swatch nhanh

| | Màu | Hex |
|---|---|---|
| 🟦 | Nền trang | `#F0FDFA` |
| ⬜ | Card nền | `#FFFFFF` |
| 🟩 | Active nền | `#CCFBF1` |
| 🔵 | Tiêu đề | `#0F4C5C` |
| ⬛ | Body text | `#3F3F46` |
| 🔘 | Placeholder | `#A1A1AA` |
| 🩵 | Teal accent | `#5FCBC4` |
| 🩵 | Teal hover | `#4AB8B0` |
| 🔲 | Viền | `#E4E4E7` |
| 🌑 | Footer BG | `#1E293B` |
