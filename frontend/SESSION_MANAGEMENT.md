# Session Management - Remember Me Feature

## Tổng quan (Overview)

Hệ thống đăng nhập hiện tại đã được cập nhật để hỗ trợ tính năng "Remember me" (Ghi nhớ đăng nhập):

- ✅ **Đăng nhập có ghi nhớ**: Session được lưu trong **7 ngày (1 tuần)**
- ✅ **Đăng nhập không ghi nhớ**: Session được lưu trong **24 giờ (1 ngày)**
- ✅ **Tự động đăng xuất**: Session tự động hết hạn sau thời gian được thiết lập
- ✅ **Đăng xuất thủ công**: Người dùng có thể đăng xuất bất kỳ lúc nào

## Các file đã được cập nhật (Updated Files)

### 1. `frontend/types/domain.d.ts`
```typescript
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean  // ✨ NEW: Optional "remember me" parameter
}
```

### 2. `frontend/services/auth.service.ts`
**Chức năng mới:**
- Thêm tham số `remember` vào phương thức `login()`
- Tự động set thời gian hết hạn token:
  - `remember = true`: 7 ngày
  - `remember = false`: 1 ngày
- Lưu `token_expiry` vào localStorage
- Kiểm tra token expiry khi `getStoredToken()` được gọi

```typescript
static async login(credentials: LoginCredentials & { remember?: boolean }): Promise<AuthData> {
  // ... login logic ...
  
  // Set token expiry
  const expiryTime = credentials.remember 
    ? Date.now() + (7 * 24 * 60 * 60 * 1000)  // 7 days
    : Date.now() + (24 * 60 * 60 * 1000)      // 1 day
  
  localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString())
}

static getStoredToken(): string | null {
  const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY)
  if (expiry && Date.now() > parseInt(expiry)) {
    this.logout()  // Auto logout if expired
    return null
  }
  return localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN)
}
```

### 3. `frontend/store/useAuthStore.ts`
**Cập nhật:**
- Interface `AuthActions` hiện hỗ trợ tham số `remember`
- Phương thức `login()` truyền tham số `remember` đến `AuthService`

### 4. `frontend/app/login/page.tsx`
**Cập nhật:**
- State `remember` được truyền vào hàm `login()`
- Checkbox "Keep me logged in" đã được kết nối với logic backend

```typescript
const [remember, setRemember] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  await login({ email, password, remember })  // ✨ Pass remember parameter
  router.push("/dashboard")
}
```

## Cách sử dụng (Usage)

### Đăng nhập với Remember Me
1. Người dùng nhập email và password
2. **Tick vào checkbox "Keep me logged in"**
3. Nhấn "Sign In"
4. → Session sẽ được lưu trong **7 ngày**

### Đăng nhập không Remember Me
1. Người dùng nhập email và password
2. **KHÔNG tick vào checkbox**
3. Nhấn "Sign In"
4. → Session sẽ được lưu trong **24 giờ**

### Đăng xuất
Người dùng có thể đăng xuất bằng cách:
- Click vào dropdown menu ở header
- Chọn "Logout"
- → Tất cả session data sẽ bị xóa

## Bảo mật (Security)

### Token Storage
- Token được lưu trong `localStorage`
- Token expiry được kiểm tra mỗi khi gọi `getStoredToken()`
- Token tự động bị xóa khi hết hạn

### Auto Logout
- System tự động đăng xuất khi token hết hạn
- Xóa tất cả dữ liệu trong localStorage:
  - `auth_token`
  - `user_data`
  - `token_expiry`
  - `refresh_token`

### Session Duration
| Tùy chọn | Thời gian lưu session |
|----------|----------------------|
| Remember Me: **ON** | **7 ngày** (604,800,000 ms) |
| Remember Me: **OFF** | **1 ngày** (86,400,000 ms) |

## Testing

### Test Case 1: Đăng nhập với Remember Me
```
1. Mở trang login
2. Nhập email & password
3. Tick checkbox "Keep me logged in"
4. Đăng nhập
5. Kiểm tra localStorage:
   - auth_token: [token_value]
   - token_expiry: [timestamp + 7 days]
6. Đóng browser và mở lại sau vài giờ
7. Vẫn còn đăng nhập ✅
```

### Test Case 2: Đăng nhập không Remember Me
```
1. Mở trang login
2. Nhập email & password
3. KHÔNG tick checkbox
4. Đăng nhập
5. Kiểm tra localStorage:
   - auth_token: [token_value]
   - token_expiry: [timestamp + 1 day]
6. Đóng browser và mở lại sau vài giờ
7. Vẫn còn đăng nhập trong 24h ✅
```

### Test Case 3: Auto Logout khi hết hạn
```
1. Đăng nhập với Remember Me OFF (1 day)
2. Mock Date.now() để giả lập sau 25 giờ
3. Refresh page hoặc gọi bất kỳ API nào
4. System tự động logout ✅
5. Redirect về login page ✅
```

### Test Case 4: Manual Logout
```
1. Đăng nhập (với hoặc không Remember Me)
2. Click vào user dropdown menu
3. Click "Logout"
4. Kiểm tra localStorage: tất cả token đã bị xóa ✅
5. Redirect về login page ✅
```

## API Endpoints

Không cần thay đổi backend API. Tất cả logic session management được xử lý ở frontend:

- `POST /api/auth/login` - Đăng nhập (backend trả về token)
- `POST /api/auth/logout` - Đăng xuất (backend xóa session)

## LocalStorage Keys

```typescript
STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',      // JWT token
  USER_DATA: 'user_data',        // User profile data
  REFRESH_TOKEN: 'refresh_token', // (Optional) Refresh token
  TOKEN_EXPIRY: 'token_expiry',  // ✨ NEW: Token expiry timestamp
}
```

## Lưu ý quan trọng (Important Notes)

1. **Token Expiry**: Expiry time được tính bằng milliseconds từ epoch time
2. **Timezone**: Thời gian được tính theo client timezone (Date.now())
3. **Auto Logout**: Được trigger khi gọi `getStoredToken()` và phát hiện token đã hết hạn
4. **Browser Compatibility**: localStorage được support trên tất cả modern browsers

## Troubleshooting

### Vấn đề: TypeScript Error
```
Error: Property 'remember' does not exist on type 'LoginCredentials'
```
**Giải pháp**: Restart TypeScript server:
- VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
- hoặc restart IDE

### Vấn đề: Session không được lưu
```
Kiểm tra localStorage trong DevTools:
- F12 → Application → Local Storage
- Xác nhận có các keys: auth_token, user_data, token_expiry
```

### Vấn đề: Auto logout không hoạt động
```
Kiểm tra:
1. token_expiry có giá trị trong localStorage không?
2. So sánh Date.now() với token_expiry
3. Xem console có error không
```

---

## Tóm tắt (Summary)

✅ **Đã hoàn thành:**
- Tính năng "Remember me" với 2 options: 7 ngày hoặc 1 ngày
- Auto logout khi token hết hạn
- Manual logout bất kỳ lúc nào
- Token expiry được lưu và kiểm tra tự động

🎯 **Không cần thay đổi:**
- Backend API endpoints
- Database schema
- Auth guards hoặc middleware

📝 **Next Steps (Optional):**
- Thêm refresh token mechanism
- Implement sliding window session
- Add "Remember this device" feature
