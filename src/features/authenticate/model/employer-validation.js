export function validateEmployer(values, register) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.length > 320)
    errors.email = "Vui lòng nhập email công việc hợp lệ.";
  if (!values.password || values.password.length > 128 || (register && values.password.length < 8))
    errors.password = register ? "Mật khẩu cần từ 8 đến 128 ký tự." : "Vui lòng nhập mật khẩu.";
  if (register) {
    if (values.fullName.trim().length < 2 || values.fullName.length > 200)
      errors.fullName = "Vui lòng nhập họ và tên người liên hệ.";
    const phone = values.workPhone.replace(/[\s().-]/g, "").replace(/^\+?84/, "0");
    if (!/^0[1-9]\d{8,9}$/.test(phone))
      errors.workPhone = "Vui lòng nhập số điện thoại công việc hợp lệ.";
    if (values.companyName.trim().length < 2 || values.companyName.length > 200)
      errors.companyName = "Vui lòng nhập tên pháp lý đầy đủ của doanh nghiệp.";
    if (!/^\d{10}(-\d{3})?$/.test(values.taxCode.trim()))
      errors.taxCode = "Mã số thuế gồm 10 chữ số hoặc 10 chữ số–3 chữ số chi nhánh.";
    if (!values.headOfficeProvinceId)
      errors.headOfficeProvinceId = "Vui lòng chọn tỉnh/thành của trụ sở chính.";
    if (values.password !== values.confirmPassword)
      errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    if (!values.acceptTerms)
      errors.acceptTerms = "Vui lòng đồng ý điều khoản dịch vụ và chính sách bảo mật.";
    if (!values.recruitmentCommitment)
      errors.recruitmentCommitment = "Vui lòng xác nhận cam kết tuyển dụng minh bạch.";
  }
  return errors;
}
