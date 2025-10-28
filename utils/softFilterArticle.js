const JUNK_KEYWORDS = [
  'Quảng cáo',
  'Quảng cáo liên quan',
  'Đọc thêm',
  'Đọc tiếp',
  'Đọc nhiều',
  'Bài viết có thể bạn quan tâm',
  'Bạn có thể quan tâm',
  'Tin liên quan',
  'Bài liên quan',
  'Tin nổi bật',
  'Xem thêm',
  'Xem thêm tại',
  'Xem thêm bài viết',
  'Xem tiếp',
  'Nguồn:',
  'Nguồn tin:',
  'Ảnh:',
  'Ảnh minh họa',
  'Theo dõi',
  'Đăng ký',
  'Đăng ký kênh',
  'Nhận thông báo',
  'Bình luận',
  'Chia sẻ',
  'Like',
  'Gửi phản hồi',
  'Báo lỗi',
  'Video liên quan',
  'Video đang xem',
  'Xem video',
  'Hot',
  'Khuyến mãi',
  'Ưu đãi',
  'Liên hệ',
  'Bản quyền',
  'Thông tin doanh nghiệp',
  'AI đề xuất',
];

const removeJunkLines = (text) =>
  text
    .split('\n')
    .filter((line) => !JUNK_KEYWORDS.some((k) => line.includes(k)))
    .join('\n');

const removeMarkdownMedia = (markdown) =>
  markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // xóa ảnh
    .replace(/\[.*?\]\(.*?\)/g, '') // xóa link
    .replace(/\([^)]+?\.(jpg|png|gif|jpeg)\)/gi, '')
    .trim();

const filterByTextDensity = (textBlocks) =>
  textBlocks.filter((block) => {
    // eslint-disable-next-line prefer-destructuring
    const length = block.length;
    const wordCount = block.split(/\s+/).length;
    const linkCount = (block.match(/https?:\/\//g) || []).length;

    const density = wordCount / (block.length + 1);
    return length > 80 && density > 0.15 && linkCount < 2;
  });

module.exports = (articleText) => {
  let cleanedText = removeJunkLines(articleText);
  cleanedText = removeMarkdownMedia(cleanedText);
  cleanedText = filterByTextDensity(cleanedText.split('\n')).join('\n');
  return cleanedText.slice(0, 5000);
};
