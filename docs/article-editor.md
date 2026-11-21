# Trình soạn cẩm nang trực quan

Trang tạo và chỉnh sửa trong Admin đều dùng `ArticleEditor` qua export `MarkdownEditor` cũ.

- Vùng soạn dùng TipTap/ProseMirror. Menu kiểu đoạn có Văn bản thường và H2–H6, cập nhật theo vị trí con trỏ.
- Bảng có lưới 10 cột × 8 hàng, hỗ trợ phím mũi tên/Enter và nhập kích thước thủ công từ 1 đến 20 cho mỗi chiều. Số hàng bao gồm hàng tiêu đề.
- Tab/Shift+Tab chuyển ô; Tab ở ô cuối thêm hàng theo quy tắc của TipTap. Thanh chỉnh sửa bảng cung cấp thêm/xóa hàng, cột, bảng. Kéo đường phân cách để đổi độ rộng cột.
- Tay nắm ⠿ kéo cả bảng giữa các đoạn; có nút lên/xuống và Alt+↑/Alt+↓ trên tay nắm cho bàn phím.
- Ba chế độ Soạn nội dung, Soạn & xem trước và Xem trước vẫn tồn tại. Vùng soạn được giữ khi đổi chế độ để bảo toàn selection/history.

## Lưu trữ và tương thích

API và cột `CareerArticle.Content` tiếp tục lưu chuỗi, tối đa 20.000 ký tự. Bài Markdown cũ được phân tích bằng remark/GFM để mở thành nội dung trực quan, bao gồm bảng. Mở bài không tự ghi lại hoặc tự chuyển đổi dữ liệu.

Sau khi sửa, nội dung được lưu thành HTML đã lọc với tiền tố `<!--jobtot:article-html:v1-->`. Tiền tố phân biệt định dạng mới với Markdown cũ; không cần migration DB. HTML giữ `colwidth` ở ô và `colgroup` để độ rộng cột tồn tại sau khi mở lại. Nếu chuỗi vượt giới hạn 20.000 ký tự, form báo lỗi và không gửi yêu cầu lưu.

`article-content.js` chỉ giữ các thẻ định dạng cần thiết, ảnh/liên kết với giao thức an toàn và thuộc tính kích thước bảng. CSS tác giả, sự kiện, ID, script, iframe, SVG và biểu mẫu bị loại bỏ. Chỉ `width`/`min-width` dạng số px hoặc `100%` được giữ trên table/col. `ArticleBody` chỉ đưa HTML sau bộ lọc này vào DOM.

Editor, bản xem trước và bài công khai cùng dùng `shared/ui/article-content.css`, giới hạn chiều rộng nội dung 760px. Ở cùng chiều rộng khả dụng, phông chữ, khoảng cách, ảnh, bảng và độ rộng cột dùng chung quy tắc. Tay nắm, viền chọn và thanh đổi độ rộng chỉ do NodeView của editor tạo ra, không được tuần tự hóa để xuất bản.

## Kiểm tra

Từ FE:

```powershell
node --test tests/article-editor.test.mjs tests/article-editor-ui.test.mjs
npm.cmd run lint
npm.cmd run build
```

Hai bộ test dùng happy-dom: editor thật, lưới chọn kích thước, thao tác ô, Tab/Shift+Tab, kéo đổi độ rộng, drag/drop bảng, Heading, mở Markdown cũ và lưu/mở lại. Hit-testing và kích thước ô trong kiểm tra kéo được mô phỏng vì happy-dom không có layout engine. Chúng không thay thế kiểm tra trực quan trên trình duyệt thật.

Test editor xuất `.artifacts/article-editor-checks/visual-content.json` ở gốc workspace. Có thể kiểm tra POST/PUT/GET công khai và tải lại từ API bằng host InMemory độc lập:

```powershell
dotnet run --project ../BE/tools/ArticleEditorChecks/ArticleEditorChecks.csproj -- ../.artifacts/article-editor-checks
```

Host kiểm thử không dùng dữ liệu hoặc tài khoản thật. Khi nghiệm thu thủ công, kiểm tra thêm ở 1280px và 390px: chọn vài kích thước trên lưới, nhập ô, kéo cột/tay nắm, lưu rồi mở lại; so sánh ba chế độ ở cùng chiều rộng nội dung.
