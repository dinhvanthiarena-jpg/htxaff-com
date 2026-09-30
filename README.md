# HTXAFF.com — Kênh Bán Hàng (Node.js)

Web quản trị gian hàng dành cho nhà bán sỉ, viết lại theo đúng cấu trúc menu, trạng thái
đơn hàng và các trường dữ liệu thật của "Kênh bán hàng" trên banhang.thitruongsi.com (người
dùng tự đăng nhập vào tài khoản của họ để đối chiếu trực tiếp qua 2 lượt kiểm tra, sau đó
phân tích lại toàn bộ menu/form/tính năng), kết hợp phong cách thiết kế quan sát được (màu
thương hiệu cam `#F58220`, layout kiểu Ant Design, font hệ thống). Đây là bản viết lại hoàn
toàn mới bằng Node.js dưới thương hiệu **HTXAFF.com** — không sao chép mã nguồn/asset của
nền tảng gốc, chỉ tái hiện lại chức năng và giao diện.

## Tính năng

- **Đăng nhập / Đăng ký gian hàng** — session-based, mật khẩu mã hoá bcrypt
- **Trang chủ (Dashboard)** — danh sách việc cần làm, widget hạng gian hàng (lượt xem/sản phẩm/feed theo thanh tiến trình), doanh thu 30 ngày, biểu đồ 7 ngày, top sản phẩm, đơn hàng gần đây
- **Đơn hàng & Hỏi mua** — đúng luồng trạng thái thật: Chờ xác nhận → Chờ thanh toán → Chờ lấy hàng → Đang giao → Đã giao (+ Đã hủy / Trả hàng-Hoàn tiền), timeline lịch sử, **giao hàng loạt**, lọc theo loại đơn/sắp xếp
- **Yêu cầu báo giá (RFQ)** — xem yêu cầu mua hàng từ khách, gửi báo giá kèm hạn mức lượt báo giá/tháng, **mua thêm lượt báo giá**, xem lại báo giá đã gửi, cài đặt nhận thông báo
- **Feed** — đăng bài kèm ảnh/video/đính kèm sản phẩm
- **Tin nhắn** — chat trực tiếp với khách hàng theo từng cuộc hội thoại
- **Sản phẩm** — CRUD đầy đủ: gợi ý tên/mô tả (heuristic, gắn nhãn "AI" như bản gốc), thông số kỹ thuật, video, bảng quy đổi size, **bảng giá sỉ theo số lượng**, **biến thể** (màu/size), khối lượng & kích thước đóng gói, **tồn kho theo từng chi nhánh**, xuất/nhập dữ liệu CSV
- **Tài chính** — ví tiền: tiền chờ đối soát / tiền có thể rút / lệnh rút, lịch sử giao dịch
- **Tuyển NPP, Đại lý, CTV** — đăng tin kiểu rao vặt (nhu cầu, khu vực, ngày hết hạn, danh mục, SĐT liên hệ, hành động CTA), theo dõi kiểm duyệt
- **Thống kê** — số liệu traffic (lượt hiển thị, lượt xem, tin nhắn, xem SĐT, RFQ) + doanh thu, tỉ lệ hoàn thành, top sản phẩm, **biểu đồ đường có tooltip** khi hover
- **Khách hàng** — danh sách + trang thêm khách hàng đầy đủ (họ tên, email, SĐT, địa chỉ, ghi chú, tags)
- **Giảm giá** — phương thức (tự động/mã), nguồn đơn áp dụng, loại giảm (%/tiền), yêu cầu tối thiểu (không/giá trị/số lượng), giới hạn lượt dùng
- **Kênh marketing / Dropshipping** — trang giới thiệu tính năng nâng cao (khoá sau gói VIP, giống bản gốc)
- **Đánh giá** — xem & trả lời đánh giá khách hàng
- **Cài đặt** — Cài đặt chung (chế độ tạm nghỉ, ẩn giá, thương lượng giá, chính sách bán hàng, COD, trả lời tự động, hồ sơ công ty, xoá tài khoản), Gian hàng (ảnh bìa/logo, **địa chỉ Tỉnh/Quận/Phường**, phạm vi kinh doanh, thông báo, bài viết giới thiệu), **Trang trí gian hàng** (màu chủ đạo, banner slide), Chi nhánh/Điểm lấy hàng, Vận chuyển (đúng danh sách đối tác thật), Tài khoản ngân hàng, Tích hợp đối tác (Haravan/TikTok Shop/Sapo/Woocommerce), **Thành viên gian hàng** (thêm nhân viên, phân quyền theo vai trò), Bảo mật
- **Quản lý tài khoản & phân quyền** — chủ gian hàng đăng nhập có toàn quyền; nhân viên đăng nhập bằng tài khoản riêng, chỉ thấy menu và truy cập được đúng những module được cấp quyền (chặn thật ở tầng route, không chỉ ẩn giao diện). 4 vai trò dựng sẵn: Quản lý, Nhân viên bán hàng, Nhân viên kho, Kế toán — hoặc tuỳ chỉnh quyền theo từng module
- **Thông báo** — chuông thông báo, đánh dấu đã đọc

## Công nghệ

- Node.js + Express (server-side rendering với EJS)
- **Sequelize ORM + SQLite** cục bộ (file `data/app.db`) — sẵn sàng đổi sang **PostgreSQL** thật
  chỉ bằng cách set biến môi trường `DATABASE_URL`, không cần sửa code (xem mục "Sẵn sàng lên
  production" bên dưới)
- Session lưu trong database (bảng `Sessions`, qua `connect-session-sequelize`) — sống sót qua
  restart và dùng chung được giữa nhiều tiến trình server, thay vì lưu RAM như bản cũ
- express-session cho đăng nhập, bcryptjs mã hoá mật khẩu, multer upload ảnh/video
- CSS thuần theo design token (không phụ thuộc framework ngoài)

## Cài đặt & chạy thử

```bash
npm install
npm run seed    # tạo dữ liệu mẫu (bắt buộc chạy lần đầu, hoặc khi muốn reset dữ liệu)
npm run dev     # chạy với nodemon, hoặc: npm start
```

Truy cập http://localhost:3000

**Tài khoản demo** (dữ liệu mẫu tự tạo trong `data/app.db`, không liên quan tài khoản thật).
Mật khẩu **không cố định trong code** — `npm run seed` tự sinh 1 mật khẩu ngẫu nhiên dùng chung
cho cả 3 tài khoản và in ra màn hình sau khi chạy xong (lưu lại ngay). Muốn tự đặt mật khẩu cố
định, set biến môi trường `SEED_PASSWORD` trước khi chạy seed.

| Vai trò | Email | Quyền truy cập |
|---|---|---|
| Chủ gian hàng | `dinhnam0103@gmail.com` | Toàn quyền |
| Nhân viên bán hàng | `sales@htxaff.demo` | Đơn hàng, Sản phẩm, Khách hàng, Feed/Tin nhắn, Giảm giá, Đánh giá, RFQ |
| Kế toán | `ketoan@htxaff.demo` | Tài chính, Thống kê |

Chủ gian hàng vào **Cài đặt → Thành viên gian hàng** để thêm/sửa/khoá nhân viên và tuỳ chỉnh quyền theo từng module.

## Cấu trúc thư mục

```
seller-center-clone/
  server.js                  # entry point — kết nối DB xong mới listen
  src/
    app.js                   # cấu hình Express, session store, mount toàn bộ router
    models/index.js          # Sequelize models (SQLite cục bộ / PostgreSQL qua DATABASE_URL)
    seed.js                  # dữ liệu mẫu cho tất cả module
    middleware/auth.js        # bảo vệ route cần đăng nhập + kiểm tra phân quyền
    routes/                  # auth, dashboard, products, orders, inventory, promotions,
                              # reviews, reports, settings, notifications, rfqs, finance,
                              # messengers, feed, customers, recruitment, campaigns, dropship
    views/                   # EJS templates (layout, sidebar, header, từng module)
  public/
    css/style.css             # design tokens (màu cam #F58220, radius, spacing...)
    js/app.js                 # tương tác phía client (thêm mốc giá/thông số, toggle biến thể...)
    uploads/                  # ảnh/video sản phẩm, logo tải lên
  data/app.db                 # database SQLite cục bộ (tạo tự động, KHÔNG dùng khi deploy thật)
```

## Sẵn sàng lên production (đã chuẩn bị sẵn, không cần viết lại code)

Bản này đã dùng **Sequelize ORM** thay vì đọc/ghi file JSON trực tiếp, nên việc chuyển sang hạ
tầng thật khi lên production chỉ là **đổi cấu hình**, không phải viết lại logic:

1. **Database**: set biến môi trường `DATABASE_URL=postgres://user:pass@host:5432/dbname` trỏ
   tới PostgreSQL thật (managed database của AWS RDS, Google Cloud SQL, hoặc cloud Việt Nam) —
   `src/models/index.js` tự động dùng Postgres thay vì file SQLite cục bộ, không cần sửa route
   nào khác. Chạy `npm run seed` một lần để khởi tạo dữ liệu mẫu trên DB thật (hoặc bỏ qua nếu
   đã có dữ liệu thật).
2. **Session**: hiện lưu trong cùng database (đủ dùng cho 1 server). Khi chạy **nhiều server
   cùng lúc sau load balancer**, đổi sang Redis: cài `connect-redis` + `redis`, thay
   `SequelizeStore` trong `src/app.js` bằng `RedisStore`, trỏ tới Redis quản lý (AWS
   ElastiCache, Upstash...). Đây là điểm bắt buộc phải đổi trước khi scale nhiều instance.
3. **Ảnh/video upload**: hiện lưu ổ đĩa cục bộ (`public/uploads`) — cần đổi sang object storage
   (S3-compatible) khi chạy nhiều server, vì mỗi server không dùng chung ổ đĩa.
4. **Biến môi trường cần đặt khi deploy thật**: `DATABASE_URL`, `SESSION_SECRET` (chuỗi bí mật
   ngẫu nhiên, đừng dùng giá trị mặc định trong code), `PORT`.

## Những điểm còn giới hạn (không thể/không nên làm 1-1 tuyệt đối)

Sau 2 vòng đối chiếu trực tiếp với tài khoản thật, phần lớn khoảng cách chức năng đã được
lấp đầy (AI gợi ý tên/mô tả, địa chỉ Tỉnh/Quận/Phường, xuất/nhập Excel/CSV, giao hàng loạt,
mua thêm lượt báo giá, biểu đồ line chart, trang trí gian hàng...). Còn lại một số điểm có
giới hạn thực tế, không phải do bỏ sót:

- **Thanh toán/rút tiền ngân hàng thật** — mãi mãi là dữ liệu mô phỏng vì không được phép
  và cũng không thể tự kết nối cổng thanh toán thật để chuyển tiền thật. Cần tích hợp cổng
  thanh toán thật (Napas, VNPay...) với tài khoản doanh nghiệp của chủ gian hàng.
- **RFQ/Feed/Tin nhắn 2 chiều với nhiều người mua thật** — cần có thêm app phía người mua
  (marketplace công khai), là một sản phẩm hoàn toàn khác ngoài phạm vi "kênh bán hàng".
- **Phường/Xã trong địa chỉ** — chỉ dừng ở Tỉnh/Thành (dropdown, đúng 63 tỉnh/thành như
  bản gốc) + Quận/Huyện, Phường/Xã dạng nhập tay, vì dữ liệu phường/xã đầy đủ (~10.000+ đơn
  vị) quá lớn và dễ sai sót nếu không lấy từ nguồn chính thức.
- **Gợi ý tên/mô tả "bằng AI"** — dùng luật ghép câu đơn giản (heuristic) để mô phỏng đúng
  trải nghiệm UI, không gọi mô hình AI thật.
- **App riêng cho khách hàng (marketplace mua hàng) và app quản trị hệ thống (admin tổng)**
  — theo yêu cầu của người dùng, để dành làm sau khi được yêu cầu riêng, không thuộc phạm vi
  "kênh bán hàng" (seller center) hiện tại.

## Tuỳ biến tiếp theo

- Đổi database sang MongoDB/PostgreSQL: chỉ cần viết lại `src/db.js` và các lệnh gọi
  `db.get(...).find/push/write()` bằng model tương ứng, các route giữ nguyên logic.
- Nếu cần bám sát hơn nữa các phần đã liệt kê ở mục "đơn giản hoá" phía trên, cứ yêu cầu —
  đều có thể làm thêm.
