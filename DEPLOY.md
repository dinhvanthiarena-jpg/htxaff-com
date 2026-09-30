# Hướng dẫn đưa HTXAFF.com lên hosting cPanel (3dvietpro)

Vì em không tự đăng nhập được vào cPanel (giới hạn an toàn cố định, không nhập mật khẩu vào
tài khoản của bên thứ ba dù là tài khoản của thầy), thầy tự làm theo các bước dưới đây trên
giao diện web cPanel — khoảng 10-15 phút, không cần biết code.

File đính kèm `htxaff-deploy.zip` đã loại bỏ `node_modules` (sẽ cài lại trên server để tương
thích đúng hệ điều hành Linux của hosting) và thư mục `data/` (database sẽ tạo mới trên server).

## Bước 0 — Kiểm tra domain đã trỏ vào hosting chưa

Vào cPanel → **Domains**, xem `htxaff.com` đã có trong danh sách domain của tài khoản chưa:
- Nếu domain mua ở nơi khác (không phải 3dvietpro): vào nơi quản lý domain đó, đổi **Nameservers**
  thành nameservers của 3dvietpro (xem trong email chào mừng hosting, thường dạng
  `ns1.3dvietpro.com`, `ns2.3dvietpro.com`), HOẶC trỏ **A Record** của domain về địa chỉ IP của
  hosting (xem IP trong cPanel → trang chủ, mục "Shared IP Address").
- Nếu domain đã thêm sẵn trong cPanel: bỏ qua bước này.

DNS có thể mất vài giờ đến 24h để cập nhật toàn cầu, nên làm bước này trước, các bước sau có thể
làm song song trong lúc chờ.

## Bước 1 — Upload code

1. Vào cPanel → **File Manager**
2. Vào thư mục gốc của domain `htxaff.com` (thường là `public_html/htxaff.com` hoặc một thư mục
   riêng nếu domain là addon domain — xem đường dẫn "Document Root" ở mục Domains)
3. Bấm **Upload**, chọn file `htxaff-deploy.zip` đính kèm
4. Sau khi upload xong, chuột phải vào file zip → **Extract** để giải nén ngay tại đó
5. Xoá file zip sau khi giải nén xong (không bắt buộc, chỉ để gọn)

## Bước 2 — Tạo ứng dụng Node.js

1. Vào cPanel → tìm mục **Setup Node.js App** (hoặc "Node.js Selector")
2. Bấm **Create Application**, điền:
   - **Node.js version**: chọn bản mới nhất có sẵn từ 18 trở lên (18, 20 hoặc 22 đều được)
   - **Application mode**: Production
   - **Application root**: đường dẫn thư mục vừa giải nén ở Bước 1 (ví dụ `htxaff.com` hoặc
     `public_html/htxaff.com`)
   - **Application URL**: chọn domain `htxaff.com`
   - **Application startup file**: `server.js`
3. Bấm **Create**

## Bước 3 — Cài đặt biến môi trường

Trong trang quản lý ứng dụng vừa tạo, tìm mục **Environment variables**, thêm:

| Tên biến | Giá trị |
|---|---|
| `SESSION_SECRET` | Một chuỗi bí mật ngẫu nhiên, tự gõ bừa 40-50 ký tự bất kỳ (chữ+số), không dùng lại giá trị mẫu trong code |

Không cần thêm `DATABASE_URL` — web sẽ tự dùng SQLite tạo sẵn trong thư mục ứng dụng, đủ dùng
cho 1 gian hàng chạy thật ở quy mô vừa và nhỏ.

## Bước 4 — Cài thư viện (npm install)

Trên trang quản lý ứng dụng Node.js, bấm nút **Run NPM Install** (cPanel tự chạy `npm install`
đúng theo hệ điều hành Linux của server). Đợi đến khi báo hoàn tất — có thể mất 1-2 phút.

## Bước 5 — Tạo dữ liệu mẫu ban đầu (chạy 1 lần)

Trên trang quản lý ứng dụng, tìm nút mở **terminal/console** cho ứng dụng đó (thường ghi
"Execute a command" hoặc biểu tượng dấu nhắc lệnh), gõ:

```bash
node src/seed.js
```

Lệnh này tạo tài khoản chủ gian hàng demo và dữ liệu mẫu. Nếu thầy muốn bắt đầu với dữ liệu
trắng hoàn toàn (không có sản phẩm/đơn hàng mẫu), báo em để em chuẩn bị 1 phiên bản seed rút
gọn chỉ tạo tài khoản đăng nhập.

## Bước 6 — Khởi động ứng dụng

Quay lại trang **Setup Node.js App**, bấm **Restart** cho ứng dụng vừa tạo.

## Bước 7 — Bật SSL (https)

Vào cPanel → **SSL/TLS Status** hoặc **AutoSSL**, chọn domain `htxaff.com`, bấm **Run AutoSSL**
nếu chưa tự động chạy. Nếu domain mới trỏ DNS, đợi DNS lan truyền xong (Bước 0) thì AutoSSL mới
cấp được chứng chỉ.

## Bước 8 — Kiểm tra

Mở trình duyệt vào `https://htxaff.com`, đăng nhập bằng:
- Email: `dinhnam0103@gmail.com`
- Mật khẩu: `123456`

**Đổi mật khẩu này ngay sau khi kiểm tra xong**, vì đây là mật khẩu demo đã xuất hiện trong
nhiều đoạn hội thoại/tài liệu, không an toàn để giữ nguyên trên web thật.

## Nếu gặp lỗi

- **"Application Error" khi mở domain**: vào lại Setup Node.js App, xem log lỗi (thường có link
  "View log" ngay trang đó), thường do thiếu biến môi trường hoặc npm install chưa xong.
- **npm install báo lỗi với `sqlite3`**: hiếm gặp trên hosting Linux tiêu chuẩn, nhưng nếu xảy ra,
  báo em đoạn lỗi cụ thể để đổi sang giải pháp khác (ví dụ dùng `better-sqlite3` hoặc PostgreSQL
  nếu 3dvietpro có hỗ trợ).
- **Domain chưa chạy dù đã làm hết các bước**: kiểm tra lại DNS ở Bước 0, dùng công cụ
  https://dnschecker.org gõ `htxaff.com` để xem DNS đã lan truyền đến hosting chưa.

## Lưu ý quan trọng về quy mô

Cách deploy này (shared hosting cPanel + SQLite) phù hợp để **có ngay 1 gian hàng chạy thật,
dùng thử với khách hàng thật ở quy mô vừa/nhỏ**. Đây **chưa phải** giải pháp cho quy mô 1 triệu
người dùng / 100 nghìn người truy cập cùng lúc đã trao đổi trước đó — quy mô đó cần hạ tầng
cloud có auto-scaling (xem mục "Sẵn sàng lên production" trong README.md). Khi web thật sự có
lượng truy cập lớn, đây sẽ là lúc cần nâng cấp lên VPS/cloud.
