# TalentHub — Recruitment frontend

React **JavaScript/JSX**, Vite, React Router, Tailwind CSS v4 và shadcn/ui. Dự án tổ chức theo Feature-Sliced Design (FSD).

## Format code

FE dùng Prettier với cấu hình trong `.prettierrc.json`:

```bash
npm run format
npm run format:check
```

## Chạy dự án

Yêu cầu Node.js 22.13+ (hoặc bản LTS mới hơn tương thích), npm.

```sh
npm ci
npm run dev
```

Mở URL Vite hiển thị trong terminal (mặc định http://localhost:5173).

```sh
npm run lint     # ESLint + kiểm tra import FSD
npm run build    # Build production vào dist/
npm run preview  # Xem bản build
npm run check    # Lint + build
```

## Kiến trúc

```text
src/
├── app/                  # Entry, router, providers toàn app, global styles
├── pages/
│   └── jobs/             # Ghép tính năng thành trang việc làm
├── widgets/
│   └── site-header/      # Khối giao diện độc lập
├── features/
│   ├── search-jobs/      # Tìm kiếm, lọc việc làm
│   └── save-job/         # Lưu/bỏ lưu, state và localStorage
├── entities/
│   └── job/              # Model, dữ liệu mẫu, JobCard
└── shared/
    ├── ui/               # Component shadcn/ui dùng chung
    └── lib/              # Tiện ích không chứa nghiệp vụ
```

Chiều phụ thuộc: `app → pages → widgets → features → entities → shared`. Có thể bỏ qua layer trung gian. Mỗi slice tách segment `ui`, `model`, `api`, `lib` khi thực sự cần; không tạo sẵn thư mục rỗng.

- Slice không import slice khác cùng layer hoặc layer cao hơn.
- Import từ slice khác qua `index.js`: `import { JobCard } from '@/entities/job'`.
- Nội bộ cùng slice dùng relative imports.
- `app` và `shared` không chia slice; có thể import giữa các segment trong cùng layer.
- `shared` không chứa nghiệp vụ tuyển dụng. shadcn dùng direct imports như `@/shared/ui/button`.
- `JobCard` nhận prop `action` để page truyền `SaveJobButton`; entity không phụ thuộc feature.
- ESLint kiểm tra chiều phụ thuộc, cross-slice và deep import với static imports/re-exports; dynamic imports cần review theo cùng quy tắc.

## Chức năng khởi tạo

- `/jobs`: danh sách việc làm mẫu, tìm theo tên/công ty/kỹ năng (hỗ trợ không dấu), lọc địa điểm và hình thức.
- Bộ lọc lưu trong query string, có thể tải lại hoặc chia sẻ URL.
- `/saved-jobs`: danh sách việc làm đã lưu; lưu bằng localStorage trên trình duyệt hiện tại.
- Trang 404, trạng thái không có kết quả và giao diện responsive.

**Chưa có backend, xác thực tài khoản thật, đăng tin hoặc nộp hồ sơ.** Dữ liệu mẫu ở `src/entities/job/model/jobs.js`. Khi tích hợp backend, đặt truy cập dữ liệu việc làm trong `entities/job/api`, còn hành động ứng tuyển trong feature riêng `features/apply-job`. Không lưu token hoặc dữ liệu hồ sơ nhạy cảm chung với danh sách bookmark mẫu.

## Giao diện xác thực Job Tốt

Trang `/` chuyển đến `/register`. Hai trang `/register` và `/login` được dựng theo ảnh thiết kế cung cấp, có responsive và dùng shadcn Button, Input, Card, Label, Checkbox, Tabs, Dialog. Font và ảnh được lưu cục bộ.

```text
pages/auth/                  # Ghép trang và style giới hạn trong .auth-page
features/authenticate/
  model/validation.js        # Kiểm tra email/điện thoại, tên và mật khẩu
  ui/auth-panel.jsx          # Chọn loại tài khoản, chuyển đăng nhập/đăng ký
  ui/credentials-form.jsx    # State và submit biểu mẫu
  ui/auth-field.jsx          # Label, input, lỗi, hiện/ẩn mật khẩu
  ui/forgot-password-dialog.jsx
widgets/auth-header/         # Header và điều hướng
widgets/auth-introduction/   # Giới thiệu, số liệu, quyền lợi, đánh giá
widgets/career-tools/        # Danh sách tiện ích
widgets/auth-footer/        # Thông tin công ty và liên kết
shared/ui/brand-logo.jsx     # Logo dùng chung
shared/ui/service-notice.jsx # Hộp thoại cho dịch vụ chưa kết nối
```

Form có validation, focus vào trường lỗi, hiện/ẩn mật khẩu và checkbox ghi nhớ. Tham số `?role=employer` chọn nhà tuyển dụng. Chuyển mode/role xóa dữ liệu form. Mật khẩu không được lưu vào localStorage. Login/register ứng viên đã nối API cookie và CSRF. Tài khoản nhà tuyển dụng và gửi email khôi phục chưa có API. Các tiện ích chưa triển khai mở hộp thoại thông báo.

Kiểm tra trình duyệt (cần Chrome cài trên máy):

```sh
npm run test:e2e
```

Playwright tự khởi động Vite nếu cần, kiểm tra validation, hiện mật khẩu, đổi role, login, khôi phục mật khẩu và tràn ngang trên mobile. Ảnh kiểm tra được lưu tại `test-results/` (không commit).

## Thêm component shadcn/ui

```sh
npx shadcn@latest add dialog
```

`components.json` đặt `tsx: false`, alias UI về `src/shared/ui`, utility về `src/shared/lib/utils`. Mã component nằm trong repo để tùy chỉnh. Alias `@/` được cấu hình trong cả Vite và jsconfig.

## Thêm nghiệp vụ

Ví dụ ứng tuyển: tạo `features/apply-job/{ui,model,api}` theo nhu cầu, export API công khai từ `features/apply-job/index.js`, rồi ghép tại page hoặc widget. Chỉ tạo entity `candidate`, `company`, `application` khi có model/UI dùng lại thực tế.

Khi triển khai SPA, cấu hình hosting fallback về `index.html` để các đường dẫn `/jobs` và `/saved-jobs` hoạt động khi truy cập trực tiếp.

Tài liệu: [shadcn/ui + Vite](https://ui.shadcn.com/docs/installation/vite), [shadcn JavaScript](https://ui.shadcn.com/docs/javascript), [Feature-Sliced Design](https://feature-sliced.design/).

## API đăng nhập / đăng ký ứng viên

Chạy backend tại `http://localhost:5049` theo `../BE/JobTot/docs/candidate-auth.md`, sau đó chạy `npm run dev` trong FE. Vite proxy `/api` tới backend.

Đăng ký và đăng nhập thành công chuyển tới `/jobs`. Phiên dùng cookie HttpOnly, khôi phục qua `/me`; nút đăng xuất nằm ở đầu trang việc làm. Mỗi POST lấy CSRF token mới. Không lưu mật khẩu hoặc token vào localStorage.

Production cần reverse proxy `/api` tới backend, hoặc đặt `VITE_API_BASE_URL` trước khi build (ví dụ `https://api.example.com`, không gồm `/api`). Với origin riêng, cấu hình CORS backend cho đúng origin frontend, cho phép credentials và dùng cùng site/HTTPS.

Đăng ký/đăng nhập chỉ hỗ trợ email hoặc số điện thoại và mật khẩu.

API nhà tuyển dụng và khôi phục mật khẩu chưa được triển khai. Kiểm thử giao diện dùng API giả lập: `npm run test:e2e`.

## Quy ước giao diện

Toàn bộ component dùng utility class Tailwind trong `className`. Không tạo stylesheet riêng cho page/component. `src/app/styles/index.css` là CSS đầu vào cho Tailwind v4, font, theme tokens và base styles dùng chung. Màu trang xác thực dùng `auth-orange`, `auth-ink`, `auth-muted`, `auth-border`; các class động phải viết đầy đủ để Tailwind quét được. File `dist/assets/*.css` được sinh khi build, không sửa trực tiếp.
