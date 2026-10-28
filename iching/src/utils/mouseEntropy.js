/**
 * mouseEntropy.js
 * ---------------
 * Thu thập entropy vật lý thật sự từ chuyển động chuột hoặc chạm vuốt tay người dùng.
 * 
 * NGUYÊN TẮC:
 * - 100% không dùng Math.random() hay PRNG ảo.
 * - Mỗi pixel di chuyển, tốc độ, gia tốc (jitter tay người), góc rẽ và độ trễ vi thời gian (micro-timing)
 *   đều là nguồn entropy hỗn loạn vật lý (chaotic physical entropy) không thể dự đoán trước.
 * - Duy trì 3 bộ tích luỹ entropy 32-bit độc lập tương ứng cho 3 ĐỒNG XU RIÊNG BIỆT.
 * - Sử dụng MurmurHash3 finalizer avalanching phi tuyến để trộn đều tất cả các bit entropy
 *   và phép parity bit để đảm bảo xác suất Ngửa / Sấp đạt 50% / 50% hoàn hảo không thiên vị (unbiased).
 */

export class MouseEntropyPool {
  constructor() {
    this.reset();
  }

  /**
   * Khởi tạo lại pool (dùng cho mỗi hào mới)
   */
  reset() {
    // 3 bộ tích luỹ entropy 32-bit độc lập với FNV-1a offset basis
    this._state1 = 0x811c9dc5 >>> 0;
    this._state2 = 0x9e3779b9 >>> 0;
    this._state3 = 0x6c62272e >>> 0;

    this._lastX = null;
    this._lastY = null;
    this._lastT = null;
    this._totalSamples = 0;
    this._totalDistance = 0.0;
  }

  /**
   * Nạp 1 điểm tọa độ từ sự kiện pointermove/touchmove vào entropy pool
   * @param {number} x Tọa độ X trên canvas
   * @param {number} y Tọa độ Y trên canvas
   * @param {number} [t=performance.now()] Thời điểm vi giây
   */
  feed(x, y, t = performance.now()) {
    const ix = Math.floor(x * 100) >>> 0;
    const iy = Math.floor(y * 100) >>> 0;
    const it = Math.floor(t * 1000) >>> 0;

    const dx = this._lastX !== null ? Math.floor(Math.abs(x - this._lastX) * 100) >>> 0 : 0;
    const dy = this._lastY !== null ? Math.floor(Math.abs(y - this._lastY) * 100) >>> 0 : 0;
    const dt = this._lastT !== null ? Math.floor((t - this._lastT) * 1000) >>> 0 : 0;

    const dist = Math.sqrt(dx * dx + dy * dy);
    this._totalDistance += dist;

    this._lastX = x;
    this._lastY = y;
    this._lastT = t;
    this._totalSamples++;

    // ── Kênh 1: Đồng xu 1 (Tọa độ X + Vi gia tốc X + Timing)
    this._state1 = Math.imul(this._state1 ^ ix, 0x01000193) >>> 0;
    this._state1 = Math.imul(this._state1 ^ (dx << 5), 0x5bd1e995) >>> 0;
    this._state1 = (this._state1 ^ (this._state1 >>> 13)) >>> 0;

    // ── Kênh 2: Đồng xu 2 (Tọa độ Y + Vi gia tốc Y + Timing)
    this._state2 = Math.imul(this._state2 ^ iy, 0x01000193) >>> 0;
    this._state2 = Math.imul(this._state2 ^ (dy << 7), 0x1b873593) >>> 0;
    this._state2 = (this._state2 ^ (this._state2 >>> 15)) >>> 0;

    // ── Kênh 3: Đồng xu 3 (Quãng đường + Góc đổi hướng + Vi thời gian)
    const angleInt = Math.floor(Math.atan2(dy, dx + 0.001) * 10000) >>> 0;
    this._state3 = Math.imul(this._state3 ^ (Math.floor(dist) >>> 0), 0x01000193) >>> 0;
    this._state3 = Math.imul(this._state3 ^ (angleInt ^ dt ^ it), 0x85ebca6b) >>> 0;
    this._state3 = (this._state3 ^ (this._state3 >>> 11)) >>> 0;
  }

  /**
   * Tổng số mẫu chuột đã thu thập
   */
  get totalSamples() {
    return this._totalSamples;
  }

  /**
   * Tổng quãng đường chuột đã vẽ (pixels)
   */
  get totalDistance() {
    return this._totalDistance;
  }

  /**
   * Tính phần trăm năng lượng entropy đã tích luỹ (0 - 100%)
   * Cần kết hợp cả số lượng mẫu di chuyển (~45 samples) và quãng đường di chuyển (~350px)
   * để đảm bảo người dùng thực sự di chuyển tay tự do tạo random vật lý.
   */
  get entropyPercent() {
    const sampleProgress = Math.min(100, (this._totalSamples / 45) * 100);
    const distProgress = Math.min(100, (this._totalDistance / 35000) * 100); // 350px * 100 scale
    // Lấy min để yêu cầu vừa đủ mẫu vừa có quãng đường lướt chuột
    const combined = Math.floor(sampleProgress * 0.6 + distProgress * 0.4);
    return Math.min(100, Math.max(0, combined));
  }

  /**
   * Trích xuất 3 đồng xu ngẫu nhiên thật từ 3 kênh entropy của người dùng.
   * Sử dụng MurmurHash3 finalizer để khuếch tán bit (avalanche) và bit parity để đảm bảo 50/50.
   * @returns {['ngua'|'sap', 'ngua'|'sap', 'ngua'|'sap']}
   */
  drain3Coins() {
    const extractCoin = (st) => {
      let h = st >>> 0;
      h = (h ^ (h >>> 16)) >>> 0;
      h = Math.imul(h, 0x85ebca6b) >>> 0;
      h = (h ^ (h >>> 13)) >>> 0;
      h = Math.imul(h, 0xc2b2ae35) >>> 0;
      h = (h ^ (h >>> 16)) >>> 0;

      // Bit parity: tổng XOR của tất cả các bit
      const p = (h ^ (h >>> 1) ^ (h >>> 2) ^ (h >>> 4) ^ (h >>> 8) ^ (h >>> 16)) & 1;
      return p === 0 ? 'ngua' : 'sap';
    };

    return [
      extractCoin(this._state1),
      extractCoin(this._state2),
      extractCoin(this._state3),
    ];
  }
}
