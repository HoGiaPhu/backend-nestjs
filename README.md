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

Tạo file `.env` tại thư mục gốc của dự án:

```env
DATABASE_URL="postgresql://<postgres_username>:<postgres_password>@localhost:5432/nest_auth_db?schema=public"

JWT_SECRET="<jwt_secret>"
JWT_EXPIRES_IN="1d"

PORT=3000
```


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
