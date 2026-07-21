# NestJS Authentication API

REST API xác thực và phân quyền xây dựng bằng NestJS, Prisma và PostgreSQL.

## Các yêu cầu chức năng

- Đăng ký tài khoản bằng `username` và `password`
- Mã hóa mật khẩu bằng bcrypt trước khi lưu vào cơ sở dữ liệu
- Đăng nhập, xác thực thông tin và trả về JWT access token
- Lấy thông tin của người dùng đang đăng nhập
- Phân quyền `ADMIN` và `USER`
- ADMIN xem danh sách người dùng
- Ghi lại lịch sử đăng nhập thành công/thất bại, IP và User-Agent
- ADMIN xem lịch sử đăng nhập
- Giới hạn API đăng nhập: 5 lần/phút/IP
- ValidationPipe và Exception Filter dùng toàn cục
- Swagger UI để mô tả và kiểm tra API
- Đăng xuất, refresh token, đổi mật khẩu, quên mật khẩu và reset mật khẩu qua email
- Cập nhật thông tin cá nhân: họ tên, địa chỉ, CCCD, giới tính và số điện thoại
- ADMIN xem chi tiết người dùng, khóa/mở khóa tài khoản và soft delete người dùng
- Role và Permission theo mô hình RBAC đơn giản: tạo role, gán role và kiểm tra permission
- Quản lý bài viết: tạo, xem, cập nhật và xóa; USER chỉ sửa/xóa bài của chính mình
- Quản lý danh mục bài viết
- Quản lý bài viết theo tag
- Upload ảnh bài viết lên Amazon S3 private và tạo signed URL tạm thời để xem ảnh
- Tìm kiếm bài viết theo `title` bằng query `q`
- Sắp xếp bài viết theo `title` hoặc `createAt`, với `asc` hoặc `desc`
- Audit log ghi nhận ai chỉnh sửa bài viết và thời điểm chỉnh sửa
- API trả về mã lỗi và cấu trúc lỗi thống nhất: `400`, `401`, `403`, `404`, `409`

## Các công nghệ đã sử dụng

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT và Passport
- bcrypt
- class-validator, class-transformer
- Swagger

## Yêu cầu môi trường

Trước khi chạy dự án, máy cần cài:

- Node.js 20 trở lên
- npm
- PostgreSQL
- pgAdmin

## Cài đặt

Clone source code và đi vào thư mục dự án:

```bash
git clone <repo-url>
cd backend-nestjs
```

Cài đặt dependencies:

```bash
npm install
```

Tạo file `.env` tại thư mục gốc của dự án, cấu trúc file tham khảo `.env.expamle`:

## Khởi tạo cơ sở dữ liệu

Tạo database PostgreSQL có tên `nest_auth_db`.

Chạy migration để Prisma tạo các bảng trong file `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

Có thể mở Prisma Studio để xem dữ liệu trực quan hoặc xem trong pgAdmin:

```bash
npx prisma studio
```

## Chạy dự án

Chạy development:

```bash
npm run start:dev
```

API mặc định chạy tại:

```text
http://localhost:3000
```

Build project:

```bash
npm run build
```

Chạy bản đã build:

```bash
npm run start:prod
```

## Swagger API Documentation

Sau khi ứng dụng đã chạy, truy cập Swagger UI tại:

```text
http://localhost:3000/api/docs
```

Các API chính gồm:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/admin-check`
- `GET /users`
- `GET /logs`
- `POST /auth/refresh`
- `POST /auth/Logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `PATCH /auth/change-password`
- `PATCH /users/me`
- `GET /users/:id`
- `PATCH /users/:id/role`
- `PATCH /users/:id/lock`
- `PATCH /users/:id/unlock`
- `DELETE /users/:id`
- `POST /roles`
- `GET /roles`
- `PATCH /roles/:id/permissions`
- `GET /logs/post-audits`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `GET /tags`
- `POST /tags`
- `PATCH /tags/:id`
- `DELETE /tags/:id`
- `POST /posts`
- `GET /posts?q=<keyword>&sortBy=<createAt|title>&sortOrder=<asc|desc>`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/image`
- `GET /posts/:id/image-url`

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run start` | Khởi động ứng dụng |
| `npm run start:dev` | Khởi động ở chế độ theo dõi thay đổi mã nguồn |
| `npm run build` | Build project |
| `npm run start:prod` | Chạy bản đã build |
| `npm run lint` | Kiểm tra và tự sửa một số lỗi lint |

## Phân quyền

| Role | Quyền |
| --- | --- |
| `USER` | Xem thông tin của chính mình qua `GET /auth/me` |
| `ADMIN` | Xem danh sách người dùng và lịch sử đăng nhập |

## Cấu trúc thư mục

```text
src/
  auth/       # Đăng ký, đăng nhập và JWT
  users/      # API danh sách người dùng
  logs/       # Ghi và xem lịch sử đăng nhập
  roles/      # Phân quyền
  common/     # Guards, decorators, filters
  prisma/     # PrismaService và PrismaModule
prisma/
  schema.prisma
```
