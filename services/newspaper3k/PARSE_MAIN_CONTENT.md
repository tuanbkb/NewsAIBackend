# Giải thích hàm parseArticleMainContent

Tài liệu này mô tả chi tiết cách hàm `parseArticleMainContent` trong `cleanDoc.js` trích xuất nội dung chính của bài báo.

## 1) Mục tiêu

Hàm được viết theo tinh thần của `Article.parse()` trong newspaper3k, nhưng tối giản cho một mục tiêu duy nhất:

- Lấy được text nội dung chính của bài viết.
- Trả thêm `articleHtml` của node chính để debug khi cần.

## 2) Đầu vào và đầu ra

### Đầu vào

- `html` (string): HTML toàn trang.
- `options.url` (string, optional): URL dùng cho JSDOM resolve URL tương đối. Mặc định: `https://example.com/`.

### Đầu ra

Object:

- `text`: nội dung chính sau khi lọc và ghép đoạn.
- `articleHtml`: HTML của node được chọn là vùng nội dung chính (có thể rỗng nếu đi vào fallback).

## 3) Pipeline tổng quát

Hàm chạy theo các bước:

1. Parse HTML bằng JSDOM.
2. Làm sạch DOM (`cleanDocument`).
3. Tính điểm và chọn node chính (`calculateBestNode`).
4. Hậu xử lý các đoạn văn (`postCleanupParagraphs`).
5. Nếu không chọn được node chính, dùng fallback (`fallbackParagraphExtraction`).

## 4) Cơ chế tính điểm node (chi tiết)

Đây là lõi của thuật toán. Mục tiêu là tìm node cha chứa cụm paragraph “giống bài báo” nhất.

### 4.1) Bước lọc candidate ban đầu

Thuật toán duyệt toàn bộ node `p`, `pre`, `td`.

Với mỗi node:

1. Lấy text đã chuẩn hóa (`nodeText`).
2. Tính số stopword tiếng Việt (`countStopwords`).
3. Tính mật độ link (`isHighLinkDensity`).

Node chỉ được giữ làm candidate nếu:

- `stopwordCount > 2`
- `isHighLinkDensity === false`

Ý tưởng: đoạn nội dung thật thường có nhiều từ chức năng tiếng Việt và không quá nhiều link điều hướng.

### 4.2) Tính điểm cơ sở cho mỗi candidate

Điểm cơ sở của candidate:

`baseScore = stopwordCount`

Sau đó cộng thêm `boostScore` (nếu có) để được `upScore`:

`upScore = floor(baseScore + boostScore)`

Trong code, `upScore` còn được chặn dưới bằng 0 để tránh âm.

### 4.3) Cơ chế boost

Mỗi candidate có thể được tăng điểm bằng `isBoostable(node)`.

`isBoostable` kiểm tra các sibling phía trước:

- Chỉ xét node `<p>`.
- Tối đa 3 bước lùi.
- Nếu gặp một paragraph có `stopwordCount > 5` thì xem là có ngữ cảnh bài viết liên tục, cho boost.

Giá trị boost giảm dần theo thứ tự xuất hiện:

`boostScore = (1 / startingBoost) * 50`

Với `startingBoost` tăng dần sau mỗi lần áp dụng, paragraph đầu cụm thường được ưu tiên mạnh hơn.

### 4.4) Phạt vùng cuối khi có quá nhiều candidate

Nếu số candidate lớn (`nodesNumber > 15`), thuật toán áp dụng phạt cho phần 25% node cuối danh sách:

`boostScore = -(booster^2)`

Mục tiêu: giảm khả năng dính các block cuối bài như “bài liên quan”, “đọc thêm”, “footer content”.

Có một chặn an toàn: nếu mức phạt quá lớn (`negScore > 40`) thì gán lại `boostScore = 5` để tránh triệt tiêu hoàn toàn tín hiệu.

### 4.5) Truyền điểm lên parent và grandparent

Điểm không gán trực tiếp cho paragraph, mà dồn lên cấu trúc bao ngoài:

- Parent nhận toàn bộ `upScore`.
- Grandparent nhận `upScore / 2`.

Đồng thời tăng bộ đếm `gravityNodes` để lưu số lượng candidate đóng góp vào node đó.

Ý nghĩa:

- Node bao quanh nhiều đoạn chất lượng sẽ tích lũy điểm cao.
- Grandparent vẫn nhận tín hiệu nhưng yếu hơn, giúp ổn định khi DOM lồng nhiều tầng.

### 4.6) Chọn top node cuối cùng

Sau khi duyệt xong tất cả candidate:

- Duyệt tập `parentNodes` đã từng nhận điểm.
- Chọn node có `gravityScore` lớn nhất làm `topNode`.

`topNode` này được xem là vùng chứa nội dung chính của bài.

## 5) Các hàm hỗ trợ việc chấm điểm

### 5.1) countStopwords

- Lowercase.
- Chuẩn hóa Unicode (`NFC`).
- Tách token bằng regex Unicode: `/[\\p{L}\\p{M}]+/gu`.
- Đếm token nằm trong `STOPWORDS_VI_SET`.

### 5.2) isHighLinkDensity

Tính:

- `wordsNumber`: tổng số từ trong node.
- `numLinkWords`: tổng số từ nằm trong các `<a>`.
- `numLinks`: số lượng thẻ `<a>`.

Score:

`linkDensityScore = (numLinkWords / wordsNumber) * numLinks`

Nếu `linkDensityScore >= 1.0` thì node bị coi là thiên về link và bị loại khỏi candidate.

## 6) Hậu xử lý sau khi chọn top node

`postCleanupParagraphs` thực hiện:

1. Lấy toàn bộ paragraph bên trong `topNode`.
2. Tính baseline từ chính `topNode` bằng `getSiblingsScore`.
3. Duyệt các sibling phía trước và lấy thêm paragraph đạt ngưỡng bằng `extractSiblingParagraphs`.
4. Gộp danh sách, xóa trùng, bỏ đoạn quá ngắn (`< 20` ký tự) bằng `normalizeParagraphs`.

## 7) Fallback

Nếu không tìm được `topNode`, hàm fallback sang selector:

- `article p, main p, p`

Sau đó vẫn chuẩn hóa, lọc trùng, ghép text tương tự luồng chính.

## 8) Vì sao phù hợp cho bài tiếng Việt

Phiên bản hiện tại dùng stopword tiếng Việt nên điều kiện `stopwordCount > 2` phản ánh đúng hơn ngôn ngữ bài báo Việt, giảm rủi ro bỏ sót đoạn chính do dùng stopword sai ngôn ngữ.

## 9) Giới hạn hiện tại

- Token tiếng Việt đang tách theo từ đơn, chưa xử lý phrase stopword nhiều từ một cách đầy đủ.
- Một số site có DOM quá đặc thù vẫn có thể cần rule clean riêng theo domain.
- Đây là re-implementation theo tinh thần newspaper3k, không phải bản sao 1:1 mọi chi tiết hành vi.

## 10) Cách dùng nhanh

```js
const { parseArticleMainContent } = require('./services/newspaper3k');

const result = parseArticleMainContent(html, { url: articleUrl });
console.log(result.text);
```

## 11) Tích hợp trong Playwright

Luồng hiện tại trong `services/playwright.js`:

1. Lấy `page.content()`.
2. Gọi `parseArticleMainContent(pageContent, { url: finalUrl })`.
3. Dùng `result.text` để tóm tắt.

Nhờ vậy pipeline đồng bộ với parser JS đã port từ newspaper3k.
