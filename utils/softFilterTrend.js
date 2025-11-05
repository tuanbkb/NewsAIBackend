module.exports = (trends) =>
  trends.filter(
    (item) =>
      !item.query.includes(
        'đấu với',
        'tử vi',
        'xem bói',
        'xổ số',
        'thể thao',
        'thời tiết',
        'thời sự',
        'tình yêu',
        'tâm linh',
        'tâm lý',
        'tâm trạng',
        'giải trí',
        'bóng đá',
        'kết quả xổ số',
        'lịch thi đấu',
        'lịch phát sóng',
        'dự báo thời tiết',
        'kết quả thi',
        'xem ngày tốt xấu',
      ),
  );
