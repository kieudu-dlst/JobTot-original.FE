export function validateAuth(values, mode) {
  const errors = {};
  if (mode === "register" && values.fullName.trim().length < 2)
    errors.fullName = "Vui lòng nhập họ và tên (ít nhất 2 ký tự).";
  if (mode === "register" && values.fullName.trim().length > 200)
    errors.fullName = "Họ và tên tối đa 200 ký tự.";
  const identity = values.identity.trim();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity) &&
    !/^(0|\+?84)[35789]\d{8}$/.test(identity.replace(/[\s().-]/g, ""))
  )
    errors.identity = "Vui lòng nhập email hoặc số điện thoại hợp lệ.";
  if (mode === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity))
    errors.identity = "Đăng ký cần email hợp lệ để xác thực tài khoản.";
  if (identity.length > 320) errors.identity = "Email hoặc số điện thoại tối đa 320 ký tự.";
  if (!values.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (mode === "register" && values.password.length < 8)
    errors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
  if (values.password.length > 128) errors.password = "Mật khẩu tối đa 128 ký tự.";
  if (mode === "register" && values.confirmPassword !== values.password)
    errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
  return errors;
}
