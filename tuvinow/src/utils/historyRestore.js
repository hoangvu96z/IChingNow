export function getHistoryRestoreError(item) {
  if (item?._decryptionError) {
    return 'Không thể giải mã dữ liệu đã lưu; bản ghi cũ được giữ nguyên và không thể mở để ghi đè.';
  }
  if (!item?.data?.inputData) {
    return 'Lá số này thiếu dữ liệu đầu vào.';
  }
  return '';
}
