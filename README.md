# DA Smart Travel 🌍✈️

Nền tảng lập kế hoạch du lịch thông minh, hỗ trợ tìm kiếm chuyến bay, đặt tour, gợi ý địa điểm và tạo lịch trình cá nhân hóa tự động.

---

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
  - [Front-end](#front-end)
  - [Back-end](#back-end)
    - [API & Service Layer](#api--service-layer)
    - [Content Management](#content-management)
    - [Recommendation & Search](#recommendation--search)
- [Cài đặt & Khởi chạy](#cài-đặt--khởi-chạy)

---

## Giới thiệu

**DA Smart Travel** là ứng dụng du lịch toàn diện giúp người dùng:

- Tìm kiếm và đặt vé máy bay thông qua Amadeus API
- Khám phá địa điểm, nhà hàng, khách sạn và hoạt động du lịch
- Đặt tour trọn gói
- Tạo lịch trình du lịch thông minh, cá nhân hóa
- Thanh toán trực tuyến qua VNPay
- Giao diện đa ngôn ngữ (Tiếng Việt / English)

---

## Công nghệ sử dụng

### Front-end

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router + Turbopack) | 15 |
| **Ngôn ngữ** | [TypeScript](https://www.typescriptlang.org/) | 5 |
| **UI Runtime** | [React](https://react.dev/) | 19.1.0 |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | 4.4.7 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | 4.1.13 |
| **UI Headless Components** | [Radix UI](https://www.radix-ui.com/) (Dialog, Tabs, Select, Dropdown, Carousel, Accordion, Tooltip, …) | latest |
| **Rich UI Components** | [PrimeReact](https://primereact.org/) | 10.9.7 |
| **Icon Libraries** | [Lucide React](https://lucide.dev/), [PrimeIcons](https://primereact.org/icons/) | — |
| **Data Visualization** | [Recharts](https://recharts.org/), [Chart.js](https://www.chartjs.org/) | 3.6.0 / 4.5.0 |
| **HTTP Client** | [Axios](https://axios-http.com/) | 1.6.0 |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/) | 7.69.0 |
| **Internationalization** | [next-intl](https://next-intl-docs.vercel.app/) (Tiếng Việt / English) | 4.8.3 |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) | 2.0.7 |
| **Theme Management** | [Next Themes](https://github.com/pacocoursey/next-themes) | 0.4.6 |
| **Date Picker** | [React Day Picker](https://daypicker.dev/) | 9.13.0 |
| **CSS Utilities** | [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/nicktindall/tailwind-merge), [class-variance-authority](https://cva.style/) | — |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) | 1.6.1 |

---

### Back-end

#### API & Service Layer

Phía back-end được xây dựng trên **Flask 3.0** (Python 3.12), tổ chức theo kiến trúc Blueprint RESTful.

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| **Framework** | [Flask](https://flask.palletsprojects.com/) | 3.0.0 |
| **Ngôn ngữ** | Python | 3.12 |
| **Database** | [MongoDB](https://www.mongodb.com/) (Atlas / Local) | — |
| **ODM / Driver** | [PyMongo](https://pymongo.readthedocs.io/), [Flask-PyMongo](https://flask-pymongo.readthedocs.io/) | 4.5.0 / 2.3.0 |
| **Authentication** | [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/), [PyJWT](https://pyjwt.readthedocs.io/), [Flask-Bcrypt](https://flask-bcrypt.readthedocs.io/) | 4.5.0 / 2.8.0 |
| **Session Management** | [Flask-Login](https://flask-login.readthedocs.io/) | 0.6.0 |
| **CORS** | [Flask-CORS](https://flask-cors.readthedocs.io/) | 4.0.0 |
| **Rate Limiting** | [Flask-Limiter](https://flask-limiter.readthedocs.io/) | 3.5.0 |
| **Biến môi trường** | [python-dotenv](https://pypi.org/project/python-dotenv/) | 1.0.0 |
| **Múi giờ & Ngày tháng** | [pytz](https://pypi.org/project/pytz/), [python-dateutil](https://dateutil.readthedocs.io/) | 2023.3 / 2.8.0 |
| **Flight API** | [Amadeus SDK](https://developers.amadeus.com/) | latest |
| **Airport Data** | [airportsdata](https://pypi.org/project/airportsdata/) | — |
| **Email Service** | SMTP (Gmail) qua `smtplib` | — |
| **Payment Gateway** | [VNPay](https://vnpay.vn/) (HMAC-SHA512) | — |

**Các nhóm API (Blueprints):**

| Endpoint | Chức năng |
|---|---|
| `/api/auth` | Đăng ký, đăng nhập, refresh token, đặt lại mật khẩu |
| `/api/users` | Quản lý tài khoản người dùng |
| `/api/places` | Địa điểm, nhà hàng, khách sạn, hoạt động |
| `/api/tours` | Danh sách và chi tiết tour du lịch |
| `/api/tour-bookings` | Đặt và quản lý đơn tour |
| `/api/flights` | Tìm kiếm và đặt vé máy bay |
| `/api/itinerary` | Tạo và quản lý lịch trình thông minh |
| `/api/payments` | Thanh toán và quản lý gói đăng ký |
| `/api/citys` | Dữ liệu thành phố |
| `/api/devices` | Xác minh thiết bị |
| `/api/admin` | Quản trị hệ thống |

---

#### Content Management

| Hạng mục | Công nghệ | Mô tả |
|---|---|---|
| **Image Hosting & CDN** | [ImageKit](https://imagekit.io/) | Upload ảnh phía client với xác thực HMAC, token 10 phút |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Lưu trữ dữ liệu địa điểm, tour, người dùng, đặt chỗ, thanh toán |
| **Static Reference Data** | CSV (`airports_clean.csv`) | Dữ liệu mã IATA sân bay |
| **Email Notifications** | SMTP Gmail | Xác nhận đăng ký, thông báo thanh toán, reset mật khẩu |
| **Subscription Plans** | VNPay (Monthly / Yearly / Lifetime) | Gói hàng tháng, hàng năm và trọn đời với quy đổi USD → VND |
| **Đa ngôn ngữ** | next-intl (JSON messages) | Nội dung tiếng Việt và tiếng Anh toàn giao diện |

---

#### Recommendation & Search

| Hạng mục | Công nghệ | Mô tả |
|---|---|---|
| **Content-based Filtering** | [Scikit-learn](https://scikit-learn.org/) - TF-IDF + Cosine Similarity | Gợi ý địa điểm dựa trên đặc điểm (loại, tên, thành phố) |
| **Collaborative Filtering** | [SciPy](https://scipy.org/) - SVD (Singular Value Decomposition) | Ma trận phân rã người dùng × địa điểm |
| **Semantic Embeddings** | [Sentence Transformers](https://www.sbert.net/) - BERT Multilingual | Biểu diễn ngữ nghĩa đa ngôn ngữ |
| **Numerical Computation** | [NumPy](https://numpy.org/) | Tính toán vector và ma trận similarity |
| **Full-text Search** | MongoDB Regex Queries | Tìm kiếm tour theo tên và điểm đến |
| **Place Search** | MongoDB Query (city, type filter) | Lọc địa điểm theo thành phố và danh mục |
| **Flight Search** | Amadeus API | Tìm kiếm chuyến bay theo ngày, điểm đi/đến |
| **Smart Itinerary** | Rule-based Scheduling | Phân bổ địa điểm theo khung thời gian: bữa sáng, buổi sáng, buổi chiều, buổi tối, khách sạn |
| **Transport Planning** | Custom Logic | Tính toán tuyến đường, thời gian và chi phí (đi bộ, xe máy, taxi) |

**Chi tiết bộ gợi ý TF-IDF:**

```
TfidfVectorizer(
    max_features = 5000,
    ngram_range  = (1, 2),   # unigrams + bigrams
    stop_words   = "english"
)
→ Cosine Similarity → Top-K recommendations
```

**Phân bổ lịch trình thông minh theo khung giờ:**

| Khung thời gian | Số địa điểm |
|---|---|
| Bữa sáng | 1 |
| Buổi sáng | 2 |
| Bữa trưa | 1 |
| Buổi chiều | 3 |
| Bữa tối | 1 |
| Tối | 1 |
| Khách sạn | 1 |

---

## Cài đặt & Khởi chạy

### Yêu cầu hệ thống

- **Node.js** >= 18, **pnpm** >= 8
- **Python** 3.12, **pip**
- **MongoDB** (Atlas URI hoặc local)

### 1. Back-end (Flask API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Điền: SECRET_KEY, JWT_SECRET_KEY, MONGO_URI, MONGODB_DB_NAME,
#        SMTP_USERNAME, SMTP_PASSWORD,
#        VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL,
#        IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT,
#        AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET

python run.py
# API chạy tại http://localhost:5000
```

### 2. Front-end (Next.js)

```bash
cd frontend
pnpm install
pnpm rebuild       # build native deps (tailwindcss/oxide, sharp, …)

# Tạo file .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000" > .env.local

pnpm dev
# Ứng dụng chạy tại http://localhost:3000
```

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│           Next.js 15 · TypeScript · Tailwind CSS                │
│           Zustand (state) · Axios (HTTP) · next-intl (i18n)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (HTTP/JSON)
┌───────────────────────────▼─────────────────────────────────────┐
│                    Flask 3.0  (Python 3.12)                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Auth /    │  │  Business   │  │  Recommendation Engine   │  │
│  │  Security  │  │  Services   │  │  TF-IDF · SVD · BERT     │  │
│  │  JWT/Bcrypt│  │  (routes/   │  │  Cosine Similarity       │  │
│  └────────────┘  │  services/) │  └──────────────────────────┘  │
│                  └─────────────┘                                 │
└────────┬──────────────┬──────────────┬───────────────┬──────────┘
         │              │              │               │
    MongoDB        Amadeus API     ImageKit        VNPay / SMTP
    (Atlas)       (Flights)       (Images)        (Payment / Email)
```
