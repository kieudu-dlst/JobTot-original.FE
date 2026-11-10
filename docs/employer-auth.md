# Tài khoản nhà tuyển dụng

- Đăng ký: `/register?role=employer`; đăng nhập: `/login?role=employer`.
- Dùng lại AuthPage, AuthHeader, AuthIntroduction, AuthField, AuthFooter và CareerResources của ứng viên.
- Đăng ký cần họ tên HR, điện thoại công việc, email, tên pháp lý doanh nghiệp, MST, tỉnh/thành trụ sở, mật khẩu/xác nhận và hai xác nhận bắt buộc. Đăng nhập chỉ cần email và mật khẩu.
- Tỉnh/thành lấy từ `GET /api/employer/auth/provinces`; effect dùng timer zero-delay và AbortController để không gửi hai request khi StrictMode khởi tạo.
- Các endpoint `/api/employer/auth`: `register`, `login`, `me`, `refresh`, `logout`, `forgot-password`, `reset-password`.
- Phiên employer dùng JWT audience `.Employer`, policy `EmployerOnly` và storage `jobtot.employer.tokens`, độc lập với ứng viên. Token truy cập 15 phút; refresh 8 giờ hoặc 30 ngày khi ghi nhớ. Refresh được xoay vòng, phát lại token cũ sẽ thu hồi phiên.
- Đăng ký tạo Account, RecruiterProfile và Company trong một giao dịch; công ty ở trạng thái `Pending`, chưa có quyền quản trị doanh nghiệp. Không tự nhận quyền với MST đã tồn tại: phải được quản trị viên doanh nghiệp thêm HR. Chưa triển khai màn xác minh hay dashboard tuyển dụng trong thay đổi này.
- Thành công chuyển tới `/employer/account` để xem thông tin, trạng thái xác minh và đăng xuất.
- Khôi phục mật khẩu dùng cùng cấu hình `PasswordRecovery:FrontendUrl` và `PasswordRecovery:Smtp` hiện có. Link riêng `/reset-password?role=employer#token=...`, hết hạn 30 phút và chỉ dùng một lần. Cần cấu hình SMTP để gửi email thực tế.
- Dùng các bảng sẵn có; không cần migration mới. Khởi động lại API do người dùng chạy để nạp endpoint mới.

Kiểm tra: `npm run lint`, `npm run build`, `npx playwright test tests/employer-auth.spec.js tests/auth.spec.js`; backend dùng cấu hình `CodexVerify` để tránh ghi đè Debug đang chạy. Test host được dispose, không khởi chạy API lâu dài.
