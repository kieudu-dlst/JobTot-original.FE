// Dữ liệu mẫu; thay bằng API khi backend sẵn sàng.
export const jobs = [
  {
    id: "frontend-developer",
    title: "Frontend Developer (React)",
    company: "TechViet",
    initials: "TV",
    location: "Hồ Chí Minh",
    type: "Toàn thời gian",
    salary: "25 – 40 triệu",
    tags: ["React", "JavaScript", "Tailwind CSS"],
    description:
      "Xây dựng trải nghiệm web cho sản phẩm công nghệ, làm việc cùng đội ngũ thiết kế và backend.",
    featured: true,
  },
  {
    id: "product-designer",
    title: "Product Designer",
    company: "Studio North",
    initials: "SN",
    location: "Hà Nội",
    type: "Toàn thời gian",
    salary: "20 – 35 triệu",
    tags: ["Figma", "UI/UX", "Design System"],
    description:
      "Nghiên cứu người dùng và thiết kế giao diện cho những sản phẩm số lấy con người làm trung tâm.",
    featured: true,
  },
  {
    id: "backend-developer",
    title: "Backend Developer (Node.js)",
    company: "CloudNine",
    initials: "CN",
    location: "Remote",
    type: "Toàn thời gian",
    salary: "30 – 50 triệu",
    tags: ["Node.js", "PostgreSQL", "Docker"],
    description: "Phát triển API và hệ thống dữ liệu phục vụ nền tảng thương mại điện tử.",
    featured: false,
  },
  {
    id: "marketing-intern",
    title: "Digital Marketing Intern",
    company: "Bloom Agency",
    initials: "BA",
    location: "Hồ Chí Minh",
    type: "Thực tập",
    salary: "5 – 8 triệu",
    tags: ["Content", "SEO", "Social Media"],
    description:
      "Cùng đội ngũ sáng tạo triển khai nội dung và đo lường các chiến dịch truyền thông.",
    featured: false,
  },
];

export function filterJobs(items, { query = "", location = "", type = "" }) {
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  const keyword = normalize(query.trim());
  return items.filter(
    (job) =>
      normalize([job.title, job.company, ...job.tags].join(" ")).includes(keyword) &&
      (!location || job.location === location) &&
      (!type || job.type === type),
  );
}
