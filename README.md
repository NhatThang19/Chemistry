# Bảng Tuần Hoàn Hóa Học Tương Tác

Đây là một dự án web front-end xây dựng một bảng tuần hoàn hóa học hiện đại, tương tác và giàu tính năng. Người dùng có thể khám phá các nguyên tố, xem thông tin chi tiết, tương tác với mô hình 3D, và sử dụng các tính năng AI để học tập.

![Giao diện ứng dụng](![alt text](image.png)) <!-- Thay thế bằng ảnh chụp màn hình thực tế của bạn -->

## ✨ Tính năng nổi bật

- **Bảng tuần hoàn tương tác:** Giao diện bảng tuần hoàn đầy đủ 118 nguyên tố, được mã hóa màu sắc theo từng loại.
- **Thông tin chi tiết:** Nhấp vào một nguyên tố để mở thanh bên (sidebar) hiển thị thông tin chi tiết như:
    - Tên, ký hiệu, số hiệu nguyên tử
    - Khối lượng nguyên tử, cấu hình electron
    - Độ âm điện, bán kính nguyên tử, và nhiều hơn nữa.
- **Mô hình nguyên tử 3D:** Trực quan hóa cấu trúc của nguyên tử trong không gian 3 chiều với `<model-viewer>`.
- **Hỏi đáp với AI (Gemini):** Trò chuyện với trợ lý AI để hỏi bất cứ điều gì về nguyên tố đang được chọn. AI được cung cấp bởi Google Gemini.
- **Quiz trắc nghiệm:** Tự động tạo câu hỏi trắc nghiệm ngẫu nhiên về nguyên tố để kiểm tra kiến thức.
- **Thiết kế Responsive:** Giao diện được tối ưu hóa cho cả máy tính để bàn và thiết bị di động.
- **Hiệu ứng Glassmorphism:** Giao diện sử dụng hiệu ứng nền mờ trong suốt hiện đại và đẹp mắt.
- **Hướng dẫn sử dụng:** Popup hướng dẫn giúp người dùng mới dễ dàng làm quen với các tính năng.

## 🚀 Công nghệ sử dụng

- **HTML5 & CSS3:** Cấu trúc và giao diện web.
- **JavaScript (ES6+):** Logic và tương tác phía client.
- **[Alpine.js](https://alpinejs.dev/):** Framework JavaScript nhỏ gọn để quản lý trạng thái và giao diện người dùng một cách linh hoạt.
- **[Bootstrap 5](https://getbootstrap.com/):** Framework CSS cho layout, components (Offcanvas, Modal), và responsive design.
- **[Google Gemini API](https://ai.google.dev/):** Cung cấp sức mạnh cho tính năng Hỏi Đáp AI và tạo câu hỏi Quiz.
- **[Model-viewer](https://modelviewer.dev/):** Component web để hiển thị mô hình 3D.
- **[Marked.js](https://marked.js.org/):** Phân tích và hiển thị nội dung Markdown từ AI.
- **[DOMPurify](https://github.com/cure53/DOMPurify):** Bảo mật, chống lại các cuộc tấn công XSS khi hiển thị nội dung HTML từ API.
- **[KaTeX](https://katex.org/):** Thư viện render công thức toán học và hóa học tốc độ cao.

## 🛠️ Cài đặt và Chạy dự án

Để chạy dự án này trên máy cục bộ của bạn, hãy làm theo các bước sau:

1.  **Clone repository:**
    ```bash
    git clone https://github.com/NhatThang19/Chemistry.git
    ```

2.  **Điều hướng đến thư mục dự án:**
    ```bash
    cd Chemistry
    ```

3.  **Mở file `index.html`:**
    - Cách đơn giản nhất là mở file `index.html` trực tiếp bằng trình duyệt của bạn.
    - Hoặc sử dụng một server cục bộ. Nếu bạn có Visual Studio Code, bạn có thể cài đặt extension **Live Server** và nhấp vào "Go Live" ở thanh trạng thái.

4.  **Cấu hình API Key:**
    - Mở file `js/app.js`.
    - Tìm đến hàm `callGeminiAPI`.
    - Thay thế chuỗi `AIzaSy...` bằng API Key của Google Gemini của riêng bạn:
      ```javascript
      const apiKey = "YOUR_GEMINI_API_KEY"; // Thay thế bằng API Key của bạn
      ```

## 📖 Cách sử dụng

1.  Nhấp vào một ô nguyên tố trên bảng tuần hoàn.
2.  Một thanh thông tin sẽ xuất hiện ở bên phải.
3.  Sử dụng các tab để chuyển đổi giữa các chế độ xem:
    - **Thông tin:** Xem dữ liệu cơ bản của nguyên tố.
    - **Mô hình 3D:** Tương tác với mô hình nguyên tử 3D.
    - **Hỏi Đáp AI:** Đặt câu hỏi về nguyên tố cho trợ lý ảo.
    - **Làm Quiz:** Trả lời câu hỏi trắc nghiệm.
4.  Nhấp vào nút `?` ở góc dưới bên phải để xem lại hướng dẫn.

## ✍️ Tác giả

- **Tên:** Thorfinn19
- **GitHub:** [NhatThang19](https://github.com/NhatThang19)

---
Cảm ơn bạn đã ghé thăm dự án! (～￣▽￣)～
