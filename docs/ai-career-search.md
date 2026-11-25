## Trạng thái hiện tại (25/11/2026)

Giao diện dùng hội thoại hai phía, giữ tin nhắn trong bộ nhớ của trang và làm trống ô nhập ngay sau khi gửi. Không tự gửi lại lịch sử hay ảnh cũ. Google Search đã bị bỏ khỏi request; các ghi chú grounding bên dưới là lịch sử triển khai.

Có nút Ảnh CV để chọn một ảnh JPG/PNG, tối đa 5 MiB. Ảnh có xem trước và nút xóa trước khi gửi; gửi ảnh không kèm câu hỏi sẽ dùng lời nhắc nhận xét CV mặc định. API nhận Base64 inline cùng câu hỏi. Frontend không lưu ảnh trong localStorage/sessionStorage, nhưng vẫn giữ bản xem trước trong hội thoại cho tới khi rời trang hoặc đổi phiên. Có thông báo ảnh được chuyển tới Gemini và gợi ý che thông tin liên hệ.

Nút Gửi dùng biểu tượng và chữ cam, không có nền/viền. Vẫn giữ Enter để gửi, Shift+Enter xuống dòng, hủy yêu cầu và xử lý phản hồi muộn. Yêu cầu Gemini không có timeout do ứng dụng đặt và không đặt giới hạn độ dài đầu ra; giới hạn riêng của model và lỗi nhà cung cấp vẫn có thể xảy ra.

---
# Trợ lý nghề nghiệp AI — frontend MVP

## Mở trang và chọn phiên

- `/ai/career-search`: chọn ứng viên khi có phiên ứng viên; nếu chỉ có phiên nhà tuyển dụng thì chọn nhà tuyển dụng.
- `/ai/career-search?role=candidate` và `?role=employer`: chọn đúng vai trò được chỉ định, kể cả khi cả hai phiên tồn tại. Không tự chuyển sang phiên khác khi vai trò được chọn chưa đăng nhập.
- Liên kết ứng viên nằm trong Kho tiện ích ở desktop/mobile. Liên kết nhà tuyển dụng nằm trên navigation của EmployerHeader, cũng được dùng trong mobile menu.
- Trang cho biết vai trò đang dùng và có liên kết đổi vai trò. Người chưa đăng nhập được chuyển qua `/login` với `role` và `returnTo` đã giới hạn trong allowlist.

Slice FSD `src/pages/ai-career-search` gồm `api`, `model`, `ui` và `index.js`. Router dùng public API của slice. Không sửa backend hoặc chức năng nhắn tin.

## Request và refresh token

Đọc schema thực tế từ `BE/docs/gemini-career-search.md`, DTO Application và controller. Chỉ gọi `POST /api/ai/career-search` với JSON `{question}`. Câu hỏi tối đa 2000 UTF-16 code units, cùng cách đếm `string.length` của JavaScript/backend. Không gửi tài khoản, CV hay câu hỏi trước. Không lưu nội dung hỏi đáp vào storage/database.

Hai HTTP helper dùng thêm tùy chọn `apiRoot: true` để gọi endpoint chung `/api/ai/...`; mặc định các caller khác vẫn ở `/api/candidate/...` hoặc `/api/employer/...`. Trước generation, gọi GET `auth/me` bằng helper có sẵn để refresh token khi cần. POST generation dùng `retry: false` nên không tự phát lại. Nếu token hết hạn ngay giữa GET và POST, trang báo hết phiên; người dùng chủ động đăng nhập/tra cứu lại.

AbortController đi xuyên qua helper khi hủy/rời trang. Đổi vai trò hoặc account sẽ unmount form, hủy request và xóa kết quả trong bộ nhớ. Sự kiện logout/storage của vai trò đang dùng cũng hủy và xóa form. Runner có version guard để response cũ không ghi đè response mới dù fake/network adapter không thực hiện abort. Retry giữ nguyên snapshot của câu hỏi lỗi, không lấy nội dung textarea đã chỉnh sửa. Không đặt timeout frontend ngắn hơn timeout backend; loading kết thúc ngay khi response về, không cố chờ 45 giây.

## Response và hiển thị

Dùng các field `answer`, `sources[{id,title,url}]`, `citations[{startIndex,endIndex,text,sourceIds}]`, `searchQueries`, `searchSuggestionsHtml`, `groundingStatus`, `citationIndexUnit`, `isTruncated`.

- Status thực tế: `grounded`, `no_sources`, `not_grounded`. Không dùng nhãn “đã kiểm chứng”; có nguồn không đồng nghĩa mọi đoạn đúng.
- Answer dùng react-markdown + remark-gfm/remark-breaks, dùng lại stylesheet nội dung tuyển dụng. Không bật rehype-raw; `skipHtml` bỏ HTML model. Không tải image từ Markdown. Chỉ link http/https không chứa credentials; link mở tab mới với `noopener noreferrer`.
- Không chèn marker vào raw Markdown. Citations hiển thị riêng ở “Trích dẫn theo đoạn”. Chỉ nhận UTF-16, range hợp lệ không tách surrogate pair, `answer.slice(start,end) === text`, sourceIds tồn tại và URL an toàn. Citation chồng lấn vẫn được trình bày độc lập, không gộp hoặc sửa offsets. Quote/title được React escape. Link do model viết không trở thành citation metadata.
- `isTruncated` hiển thị cảnh báo ngắn. Query tìm kiếm chỉ hiển thị khi backend thực sự trả về.

## Google Search Suggestions

Đã đọc tài liệu:

- https://ai.google.dev/gemini-api/docs/google-search
- https://aistudio.google.com/docs/terms#grounding-with-google-search

Fragment `searchSuggestionsHtml` được giữ nguyên trong iframe `srcDoc` riêng, không render cùng Markdown. Wrapper thêm UTF-8, no-referrer, base target `_blank` và CSP. Sandbox chỉ cho popup/link mới (`allow-popups allow-popups-to-escape-sandbox`), không cho script, same-origin, form, top-navigation hay download. CSP chặn script/connect/frame, cho CSS và hình/font HTTPS cần cho widget. Popup được thoát sandbox để trang nguồn hoạt động bình thường; fragment trong iframe không có quyền truy cập DOM/session của ứng dụng.

Không dùng `dangerouslySetInnerHTML`. Iframe có title, width 100%, chiều cao 320 px (mobile 360 px), có cuộn và resize dọc; không đo chiều cao bằng cách cấp same-origin hoặc chạy script provider. Fragment không bị cắt, không sửa link/click tracking. Chỉ xuất hiện khi backend trả HTML, cùng kết quả của câu hỏi hiện tại.

`FE/index.html` hiện không đặt CSP. Nếu hosting bổ sung CSP, cần kiểm tra quyền hiển thị srcDoc/frame, CSS/font/image của Google mà không mở script/same-origin. Sandbox/CSP và nội dung giả lập đã được kiểm tra về cấu trúc, **chưa xác nhận hiển thị đầy đủ với widget Google thật**, chưa thể khẳng định đáp ứng mọi điều khoản hiển thị thực tế. Cần review widget thực và điều khoản hiện hành trước phát hành. Không gọi Gemini thật trong kiểm thử.

## Lỗi

Đã bỏ giới hạn 5 câu hỏi/phút của endpoint AI và thông báo tương ứng trên giao diện. Vẫn xử lý giới hạn tác vụ đồng thời (`ai_busy`) và quota Google (`ai_provider_quota`); thông báo `ai_rate_limited` được giữ để tương thích response từ các phiên bản backend cũ.

`ai_configuration` sử dụng metadata an toàn `failureStage`, `providerStatus`, `providerReason` để phân biệt key/model/giới hạn local và HTTP 400/401/403/404 từ Google. Chỉ hiển thị thông báo do FE định nghĩa, allowlist reason cố định; không dùng raw detail/message/providerReason tùy ý. Backend cũ thiếu metadata vẫn dùng thông báo chung.

`ai_provider_quota` đọc `quotaViolations[{kind,limit}]` nếu có để phân biệt hạn mức bằng 0, số lượt/ngày, số lượt hoặc token/phút, và Google Search. Không hiển thị chuỗi kind ngoài allowlist. Thiếu metadata vẫn dùng thông báo quota Google chung, không tự suy đoán dự án thiếu thanh toán hoặc quota bằng 0.

Chỉ dùng allowlist `ProblemDetails.code` để chọn thông báo tiếng Việt, không đưa raw detail/stack/config ra UI. Phân biệt `ai_invalid_question`, `ai_unauthenticated`, `ai_forbidden`, `ai_rate_limited`, `ai_busy`, `ai_provider_quota`, `ai_not_configured`, `ai_configuration`, `ai_timeout`, `ai_provider_error`, `ai_provider_response`, `ai_answer_too_long`, `ai_no_answer`, lỗi mạng. Retry-After dạng giây hoặc HTTP date được chuyển thành thời điểm có thể thử lại; khóa nút gửi/retry đến thời điểm đó. Hủy do người dùng hiển thị trạng thái hủy riêng, không biến thành timeout.

## Kiểm tra và tự thử

```powershell
node --test scripts/career-search.test.mjs
npm run check
```

Kiểm thử dùng HTTP giả lập, React SSR và happy-dom: schema, một generation POST, lỗi 401/429/503/504, không retry, abort/response muộn, retry snapshot, nguồn unsafe, HTML/script, emoji/citation chồng lấn, Markdown bảng/code, gợi ý chỉ điền ô, focus/label/giới hạn ký tự, form submit, HTTP helper thực với bearer fixture và endpoint chung. DOM viewport 390/1200 px kiểm tra media query và grid. Đây không thay cho visual QA của browser thật hoặc kiểm thử toàn bộ screen reader.

Không chỉnh key ở frontend/VITE. Để tự thử thật: chạy backend đã cấu hình User Secrets bằng Visual Studio; chạy FE `npm run dev`; đăng nhập; mở một trong các URL trên; điền một câu hỏi nghề nghiệp công khai và bấm Tra cứu. Đây sẽ gọi Google thật qua backend và có thể phát sinh phí. Đối chiếu nguồn/citation và thử link Search Suggestions ở desktop/mobile. Không cần dán key vào chat hay frontend.

## Lưu và mở lại hội thoại

Có thanh lịch sử gồm nút Cuộc trò chuyện mới và danh sách hội thoại. Không lưu tin nhắn/CV vào localStorage hoặc sessionStorage; tải lịch sử từ API theo token của phiên hiện tại. Mở lịch sử chỉ thực hiện GET, không gọi lại generation. Có thể tiếp tục gửi câu mới vào hội thoại đang mở bằng ConversationId. Lịch sử cũ không tự được gửi cho Gemini.

Khôi phục ảnh CV dùng authenticated fetch rồi tạo object URL trong bộ nhớ; URL được thu hồi khi đổi hội thoại, đổi phiên hoặc rời trang. Tải tin cũ theo beforeId, mỗi trang 100 tin; không cắt nội dung câu trả lời. Nếu file ảnh đã mất, hiển thị thông báo thay vì chặn toàn bộ cuộc trò chuyện.

Khi backend chưa chạy bản mới hoặc chưa áp dụng migration, giao diện sẽ báo không tải được lịch sử; cần khởi động lại API sau cập nhật. Tin nhắn từ trước khi có tính năng lưu chỉ tồn tại trong bộ nhớ trình duyệt nên không thể tự phục hồi sau khi tải lại trang.
Cập nhật bố cục: lịch sử là cột bên trái cho ứng viên và cột bên phải cho nhà tuyển dụng. Nút Cuộc trò chuyện mới ở đầu cột; danh sách đánh dấu hội thoại đang mở. Màn hình nhỏ có nút mở/thu gọn lịch sử. Chọn hội thoại hoặc tạo mới sẽ đóng panel để dành chỗ cho chat. Không thay đổi API hoặc dữ liệu.
