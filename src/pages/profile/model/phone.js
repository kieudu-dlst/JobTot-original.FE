export function validateProfilePhone(value, hasEmail = true) {
  if ((value.match(/[0-9]/g) || []).length > 15)
    return "Số điện thoại chỉ được chứa tối đa 15 chữ số.";
  if (!value.trim())
    return hasEmail ? "" : "Tài khoản đăng nhập bằng số điện thoại cần giữ số điện thoại.";
  const phone = value.trim().replace(/[\s().-]/g, "");
  // Match the candidate login rules, including the 0, 84 and +84 prefixes.
  if (!/^(?:0|\+?84)[35789][0-9]{8}$/.test(phone))
    return "Nhập số điện thoại di động Việt Nam hợp lệ (ví dụ: 0356520207 hoặc +84356520207).";
  return "";
}
