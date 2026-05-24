# Cài đặt hệ thống

Tài liệu này mô tả quy trình cài đặt và khởi chạy hệ thống **We-Connect** trong môi trường phát triển cục bộ. Hệ thống gồm hai thành phần chính: **client** (Next.js) và **server** (NestJS), cùng các dịch vụ hạ tầng (PostgreSQL, Redis, LibreTranslate) được đóng gói qua Docker Compose để đơn giản hóa quá trình thiết lập.

## Mục lục

- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Tải mã nguồn](#tải-mã-nguồn)
- [Cấu hình biến môi trường (server)](#cấu-hình-biến-môi-trường-server)
- [Khởi chạy các dịch vụ hạ tầng](#khởi-chạy-các-dịch-vụ-hạ-tầng)
- [Cài đặt và khởi tạo server](#cài-đặt-và-khởi-tạo-server)
- [Cấu hình và khởi chạy client](#cấu-hình-và-khởi-chạy-client)
- [Kiểm tra sau cài đặt](#kiểm-tra-sau-cài-đặt)
- [Một số lỗi thường gặp](#một-số-lỗi-thường-gặp)
- [Giao diện hệ thống](#giao-diện-hệ-thống)

## Yêu cầu môi trường

Trước khi cài đặt, máy phát triển cần chuẩn bị các công cụ sau:

| Công cụ | Phiên bản / Ghi chú |
|---|---|
| Node.js | 22 LTS hoặc mới hơn |
| Docker Desktop | Dùng để chạy PostgreSQL, Redis, LibreTranslate |
| Git | Dùng để tải mã nguồn dự án |

Ngoài ra, hệ thống sử dụng một số dịch vụ bên thứ ba:

- **Resend** — gửi email xác minh tài khoản và thông báo.
- **Deepgram** — chuyển giọng nói thành văn bản (Speech-to-Text).
- **Vietnix S3 Object Storage** — lưu trữ ảnh và tệp tin do người dùng tải lên.

## Tải mã nguồn

Clone mã nguồn từ GitHub và di chuyển vào thư mục dự án:

```bash
git clone https://github.com/cuonggold2408/We-Connect-Social.git
cd We-Connect-Social
```

Cấu trúc thư mục chính:

```text
We-Connect-Social/
├── client/                      # Giao diện người dùng (Next.js)
├── server/                      # API, WebSocket gateway, background jobs (NestJS)
└── server/docker-compose.yml    # Cấu hình các dịch vụ hạ tầng (Postgres, Redis, LibreTranslate)
```

## Cấu hình biến môi trường (server)

Trong thư mục `server`, tạo file `.env`. File này chứa thông tin kết nối cơ sở dữ liệu, Redis, JWT, dịch vụ gửi email, lưu trữ tệp tin và các dịch vụ AI bên ngoài.

```env
# Application
PORT=8080
FRONTEND_URL=http://localhost:3000

# Database
DB_USERNAME=<db-username>
DB_PASSWORD=<db-password>
DB_NAME=<db-name>
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT & Auth
JWT_ACCESS_SECRET=<access-token-secret>
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
JWT_VERIFICATION_SECRET=<verification-secret>
JWT_VERIFICATION_EXPIRES_IN=15m
PASSWORD_RESET_EXPIRES_IN=15m

# Rate limit
LOGIN_RATE_LIMIT=10
THROTTLE_SHORT_LIMIT=3
THROTTLE_MEDIUM_LIMIT=20
THROTTLE_LONG_LIMIT=100

# Translation
LIBRETRANSLATE_URL=http://127.0.0.1:5000

# Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=<deepgram-api-key>
DEEPGRAM_AUTH_GRANT=https://api.deepgram.com/v1/auth/grant
DEEPGRAM_WEBSOCKET_LISTEN=wss://api.deepgram.com/v1/listen

# Resend (Email)
RESEND_API_KEY=<resend-api-key>
MAIL_FROM=<email-gui-di>

# S3 Storage
S3_ENDPOINT=<s3-endpoint>
S3_REGION=<s3-region>
S3_BUCKET=<s3-bucket>
S3_ACCESS_KEY=<s3-access-key>
S3_SECRET_KEY=<s3-secret-key>
```

> **Lưu ý:** Các giá trị trong dấu `<...>` cần được thay bằng thông tin thật của môi trường triển khai. **Không** commit file `.env` lên kho mã nguồn vì file này chứa khoá truy cập và thông tin bí mật.

## Khởi chạy các dịch vụ hạ tầng

Từ thư mục `server`, khởi động các dịch vụ bằng Docker Compose:

```bash
cd server
docker compose up -d
```

Lệnh trên khởi chạy ba dịch vụ:

- **PostgreSQL** — lưu trữ dữ liệu nghiệp vụ (người dùng, bài viết, bình luận, tin nhắn, bản dịch).
- **Redis** — cache, hàng đợi nền, rate limit và đồng bộ trạng thái WebSocket.
- **LibreTranslate** — cung cấp API dịch văn bản cho chức năng dịch đa ngữ.

Ở lần chạy đầu tiên, LibreTranslate có thể mất vài phút để tải mô hình dịch. Sau khi hoàn tất, dịch vụ lắng nghe tại `http://127.0.0.1:5000`.

## Cài đặt và khởi tạo server

Sau khi các dịch vụ hạ tầng đã hoạt động, cài đặt thư viện cho server:

```bash
cd server
npm install
```

Sinh Prisma Client và áp dụng migration để tạo cấu trúc cơ sở dữ liệu:

```bash
npx prisma generate
npx prisma migrate dev
```

(Tuỳ chọn) Nếu cần dữ liệu mẫu để kiểm thử nhanh, chạy script seed:

```bash
npm run prisma:seed
```

Script này tạo một số tài khoản thử nghiệm. Mật khẩu mặc định cho dữ liệu seed là `123123123`.

Khởi chạy server ở chế độ phát triển:

```bash
npm run start:dev
```

Theo cấu hình mặc định, server lắng nghe tại:

```
http://localhost:8080
```

## Cấu hình và khởi chạy client

Trong thư mục `client`, tạo file `.env.local` để khai báo địa chỉ API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Cài đặt thư viện và khởi chạy giao diện:

```bash
cd client
npm install
npm run dev
```

Ứng dụng web sẽ chạy tại:

```
http://localhost:3000
```

Khi người dùng truy cập địa chỉ trên, client sẽ gọi API tới server thông qua biến `NEXT_PUBLIC_API_URL`. Các chức năng thời gian thực (nhắn tin, thông báo, gọi điện, nhận diện giọng nói) sử dụng WebSocket, nên yêu cầu server, Redis và trình duyệt cùng hoạt động ổn định.

## Kiểm tra sau cài đặt

Sau khi khởi chạy toàn bộ hệ thống, thực hiện các bước kiểm tra sau:

1. Truy cập `http://localhost:3000` và xác nhận giao diện hiển thị bình thường.
2. Đăng ký tài khoản mới hoặc đăng nhập bằng tài khoản seed.
3. Tạo bài viết, bình luận và xác nhận dữ liệu được lưu vào PostgreSQL.
4. Kiểm tra chức năng nhắn tin thời gian thực giữa hai tài khoản.
5. Kiểm tra chức năng dịch bằng cách rê chuột lên nội dung văn bản có hỗ trợ dịch.
6. Kiểm tra chức năng ghi âm bằng cách nhấn nút micro trên ô soạn tin và cấp quyền microphone cho trình duyệt.

> Nếu chức năng dịch không phản hồi ngay ở lần chạy đầu tiên, nguyên nhân thường là LibreTranslate đang tải mô hình ngôn ngữ. Hãy chờ container khởi động xong và thử lại.

## Một số lỗi thường gặp

| Lỗi | Nguyên nhân thường gặp / Cách kiểm tra |
|---|---|
| Không kết nối được cơ sở dữ liệu | Kiểm tra Docker Compose đã chạy chưa; cổng PostgreSQL có bị trùng với dịch vụ khác không; `DATABASE_URL` có khớp với `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` không. |
| `Redis connection refused` | Kiểm tra container Redis đang chạy; xác nhận `REDIS_HOST` và `REDIS_PORT`. |
| Client gọi API bị lỗi CORS | Kiểm tra `FRONTEND_URL` ở server có trùng với địa chỉ chạy client (`http://localhost:3000`) không. |
| Không gửi được email xác minh | Kiểm tra `RESEND_API_KEY` và `MAIL_FROM`. |
| Không tải được ảnh / tệp tin | Kiểm tra lại các khoá dịch vụ S3 (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`). |
| Ghi âm không hoạt động | Kiểm tra `DEEPGRAM_API_KEY`, quyền microphone của trình duyệt và khả năng mở WebSocket tới Deepgram. |

---

Sau khi hoàn tất các bước trên, hệ thống **We-Connect** sẽ hoạt động đầy đủ trong môi trường phát triển cục bộ, bao gồm giao diện web, API, cơ sở dữ liệu, cache, hàng đợi nền, WebSocket, dịch văn bản và nhận diện giọng nói.

## Giao diện hệ thống

### 1. Xác thực người dùng

| Đăng ký | Xác thực email | Đăng nhập |
|:---:|:---:|:---:|
| ![Đăng ký](<docs/screenshots/Đăng kí.png>) | ![Xác thực email](<docs/screenshots/Xác thực email.png>) | ![Đăng nhập](<docs/screenshots/Đăng nhập.png>) |

### 2. Trang chính & quản lý cá nhân

| Trang chủ | Danh sách bạn bè |
|:---:|:---:|
| ![Trang chủ](<docs/screenshots/Trang chủ.png>) | ![Danh sách bạn bè](<docs/screenshots/Danh sách bạn bè.png>) |

| Trang cá nhân | Cài đặt tài khoản |
|:---:|:---:|
| ![Trang cá nhân](<docs/screenshots/Trang cá nhân.png>) | ![Cài đặt](<docs/screenshots/Cài đặt.png>) |

### 3. Trò chuyện thời gian thực

| Danh sách hội thoại | Trò chuyện 1-1 |
|:---:|:---:|
| ![Trang trò chuyện](<docs/screenshots/Trang trò chuyện.png>) | ![Trò chuyện 1-1](<docs/screenshots/Trò chuyện 1-1.png>) |

### 4. Tính năng dịch & gợi ý câu trả lời (AI)

| Cài đặt dịch | Dịch khi rê chuột vào câu | Dịch khi nháy đúp chuột |
|:---:|:---:|:---:|
| ![Cài đặt dịch](<docs/screenshots/Setting dịch.png>) | ![Dịch khi di chuột](<docs/screenshots/Di chuột dịch text.png>) | ![Dịch khi nháy đúp chuột](<docs/screenshots/Nháy đúp chuột hiện dịch.png>) |

| Hỗ trợ soạn câu trả lời | Dịch giọng nói thời gian thực kèm AI gợi ý |
|:---:|:---:|
| ![Hỗ trợ câu trả lời](<docs/screenshots/Hỗ trợ câu trả lời.png>) | ![Dịch giọng nói kèm AI gợi ý](<docs/screenshots/dịch lời nói kèm ai gợi ý.jpg>) |

