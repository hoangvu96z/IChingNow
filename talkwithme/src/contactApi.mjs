// Keep in sync with MAX_IMAGE_B64_LENGTH and MAX_TOTAL_IMAGE_B64_LENGTH in
// vInfiSSO/src/contact/contact.controller.ts.
export const MAX_CONTACT_IMAGE_B64_LENGTH = 2 * 1024 * 1024;
export const MAX_TOTAL_CONTACT_IMAGE_B64_LENGTH = 4 * 1024 * 1024;
export const MAX_CONTACT_IMAGES = 3;

export function validateContactImages(images) {
  if (images == null) return;
  if (!Array.isArray(images)) throw new Error('images must be an array');
  if (images.length > MAX_CONTACT_IMAGES) {
    throw new Error(`Tối đa ${MAX_CONTACT_IMAGES} ảnh đính kèm mỗi tin nhắn`);
  }

  let totalEncodedLength = 0;
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (
      !image ||
      typeof image.data !== 'string' ||
      image.data.length > MAX_CONTACT_IMAGE_B64_LENGTH
    ) {
      throw new Error(`Ảnh ${index + 1} quá lớn (tối đa ~1.5MB)`);
    }
    totalEncodedLength += image.data.length;
  }

  if (totalEncodedLength > MAX_TOTAL_CONTACT_IMAGE_B64_LENGTH) {
    throw new Error('Tổng dung lượng ảnh vượt quá giới hạn cho một tin nhắn');
  }
}

export async function sendContactMessage({
  ssoBase,
  fetchImpl = globalThis.fetch,
  sessionId,
  guestToken,
  name,
  email,
  title,
  message,
  images,
  clientMeta,
}) {
  validateContactImages(images);
  const hasImageArray = Array.isArray(images) && images.length > 0;
  const response = await fetchImpl(`${ssoBase}/contact/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(guestToken ? { 'X-Guest-Token': guestToken } : {}),
    },
    body: JSON.stringify({
      sessionId,
      name,
      email,
      title,
      message,
      images: hasImageArray
        ? images.map((image) => ({
            data: image.data,
            mime: image.mime,
            name: image.name,
            size: image.compressedSize,
            width: image.width,
            height: image.height,
          }))
        : undefined,
      imageData: hasImageArray ? undefined : images?.[0]?.data,
      imageMime: hasImageArray ? undefined : images?.[0]?.mime,
      clientMeta,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `Lỗi ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function loadContactSessionMessages({
  ssoBase,
  fetchImpl = globalThis.fetch,
  sessionId,
  guestToken,
}) {
  if (!guestToken) {
    throw new Error('Phiên cũ không có mã truy cập lịch sử. Hãy tạo phiên mới để xem tin nhắn tiếp theo.');
  }

  const response = await fetchImpl(`${ssoBase}/contact/session/${sessionId}`, {
    headers: { 'X-Guest-Token': guestToken },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const error = new Error('Mã truy cập phiên đã hết hạn hoặc không hợp lệ.');
      error.status = response.status;
      throw error;
    }
    throw new Error(`Không tải được lịch sử tin nhắn (lỗi ${response.status}).`);
  }

  const data = await response.json();
  return data.messages || [];
}
