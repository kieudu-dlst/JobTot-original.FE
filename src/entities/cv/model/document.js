export const blankCv = () => ({
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  layout: "one-column",
  color: "#ff5722",
  font: "Roboto",
  fontSize: 10.5,
  margin: 15,
  sections: [
    {
      id: "summary",
      title: "TÓM TẮT CHUYÊN MÔN",
      body: "Giới thiệu kinh nghiệm, thế mạnh chuyên môn và mục tiêu nghề nghiệp của bạn.",
      visible: true,
    },
    {
      id: "experience",
      title: "KINH NGHIỆM LÀM VIỆC",
      body: "Tên công ty • Chức danh • Thời gian\n• Mô tả công việc và trách nhiệm chính.\n• Thành tựu nổi bật, kèm số liệu cụ thể.",
      visible: true,
    },
    {
      id: "skills",
      title: "KỸ NĂNG CHUYÊN MÔN",
      body: "Kỹ năng chuyên môn\nCông cụ và công nghệ\nNgoại ngữ",
      visible: true,
    },
    {
      id: "education",
      title: "HỌC VẤN & CHỨNG CHỈ",
      body: "Tên trường • Chuyên ngành • Thời gian\nBằng cấp hoặc chứng chỉ liên quan.",
      visible: true,
    },
  ],
});
