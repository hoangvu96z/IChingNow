import test from 'node:test';
import assert from 'node:assert/strict';
import { MouseEntropyPool } from '../src/utils/mouseEntropy.js';
import { coinsToLine } from '../src/logic/castLines.js';

test('MouseEntropyPool: khởi tạo và tính toán entropy cơ bản', () => {
  const pool = new MouseEntropyPool();
  assert.equal(pool.totalSamples, 0);
  assert.equal(pool.totalDistance, 0);
  assert.equal(pool.entropyPercent, 0);

  // Nạp 1 điểm
  pool.feed(100, 100, 1000);
  assert.equal(pool.totalSamples, 1);
  assert.equal(pool.totalDistance, 0);

  // Nạp thêm điểm di chuyển
  pool.feed(150, 150, 1016);
  assert.equal(pool.totalSamples, 2);
  assert.ok(pool.totalDistance > 0);

  // Reset
  pool.reset();
  assert.equal(pool.totalSamples, 0);
  assert.equal(pool.totalDistance, 0);
  assert.equal(pool.entropyPercent, 0);
});

test('MouseEntropyPool: entropyPercent đạt 100% khi di chuyển đủ mẫu và quãng đường', () => {
  const pool = new MouseEntropyPool();
  let x = 50;
  let y = 50;
  let t = 1000;

  for (let i = 0; i < 60; i++) {
    x += 8;
    y += (i % 2 === 0 ? 6 : -6);
    t += 16.6;
    pool.feed(x, y, t);
  }

  assert.equal(pool.entropyPercent, 100);
});

test('MouseEntropyPool: drain3Coins trả về 3 đồng xu hợp lệ và tương thích coinsToLine', () => {
  const pool = new MouseEntropyPool();
  for (let i = 0; i < 50; i++) {
    pool.feed(50 + i * 4, 80 + Math.sin(i) * 30, 1000 + i * 16.5);
  }

  const coins = pool.drain3Coins();
  assert.equal(coins.length, 3);
  for (const c of coins) {
    assert.ok(c === 'ngua' || c === 'sap', `Đồng xu phải là ngua hoặc sap, nhận được: ${c}`);
  }

  const line = coinsToLine(coins);
  assert.ok([6, 7, 8, 9].includes(line.total), `Tổng điểm phải thuộc 6, 7, 8, 9, nhận: ${line.total}`);
  assert.ok(['yin', 'yang'].includes(line.yinYang));
  assert.ok(['lao-am', 'thieu-duong', 'thieu-am', 'lao-duong'].includes(line.type));
});

test('MouseEntropyPool: kiểm nghiệm thống kê phân phối ngẫu nhiên thật từ 2,000 quỹ đạo chuột', () => {
  const lineCounts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  const coinCounts = { ngua: 0, sap: 0 };
  const N = 2000;

  // Giả lập 2,000 quỹ đạo chuột thực tế của người dùng
  for (let sim = 0; sim < N; sim++) {
    const pool = new MouseEntropyPool();
    let x = 120 + (sim % 50);
    let y = 80 + ((sim * 7) % 40);
    let vx = (sim % 9) - 4;
    let vy = ((sim * 3) % 9) - 4;
    let t = 1000.0 + sim * 100;

    for (let step = 0; step < 50; step++) {
      vx += Math.sin(step * 0.7 + sim) * 1.5;
      vy += Math.cos(step * 0.5 + sim) * 1.5;
      x = Math.max(10, Math.min(330, x + vx));
      y = Math.max(10, Math.min(170, y + vy));
      t += 16.66 + Math.sin(step) * 4;
      pool.feed(x, y, t);
    }

    const coins = pool.drain3Coins();
    for (const c of coins) {
      coinCounts[c]++;
    }

    const score = coins.reduce((sum, c) => sum + (c === 'ngua' ? 3 : 2), 0);
    lineCounts[score]++;
  }

  // 1. Cả 4 loại hào đều phải xuất hiện với tần suất đáng kể
  assert.ok(lineCounts[6] > 100, `Hào 6 (Lão Âm) phải xuất hiện đủ (nhận: ${lineCounts[6]})`);
  assert.ok(lineCounts[7] > 500, `Hào 7 (Thiếu Dương) phải xuất hiện đủ (nhận: ${lineCounts[7]})`);
  assert.ok(lineCounts[8] > 500, `Hào 8 (Thiếu Âm) phải xuất hiện đủ (nhận: ${lineCounts[8]})`);
  assert.ok(lineCounts[9] > 100, `Hào 9 (Lão Dương) phải xuất hiện đủ (nhận: ${lineCounts[9]})`);

  // 2. Tỉ lệ mặt Ngửa / Sấp phải cân bằng (trong khoảng 45% - 55%)
  const totalCoins = N * 3;
  const nguaRatio = coinCounts.ngua / totalCoins;
  const sapRatio = coinCounts.sap / totalCoins;

  assert.ok(
    nguaRatio >= 0.44 && nguaRatio <= 0.56,
    `Tỉ lệ Ngửa (${(nguaRatio * 100).toFixed(2)}%) phải nằm trong khoảng cân bằng 44% - 56%`
  );
  assert.ok(
    sapRatio >= 0.44 && sapRatio <= 0.56,
    `Tỉ lệ Sấp (${(sapRatio * 100).toFixed(2)}%) phải nằm trong khoảng cân bằng 44% - 56%`
  );
});

test('MouseEntropyPool: gieo liên tiếp 6 hào độc lập không bị trùng lặp kết quả', () => {
  const pool = new MouseEntropyPool();
  const hexagramLines = [];

  for (let lineIdx = 0; lineIdx < 6; lineIdx++) {
    pool.reset();

    // Mỗi hào là một chuyển động riêng biệt của tay
    for (let step = 0; step < 48; step++) {
      const x = 50 + step * 5 + Math.sin(lineIdx * 10 + step) * 20;
      const y = 80 + Math.cos(lineIdx * 5 + step) * 25;
      const t = 1000 + lineIdx * 5000 + step * 16.7;
      pool.feed(x, y, t);
    }

    const coins = pool.drain3Coins();
    hexagramLines.push(coinsToLine(coins));
  }

  assert.equal(hexagramLines.length, 6);
  // Không thể cả 6 hào đều có cùng coins trừ phi xác suất siêu nhỏ 1/(2^18)
  const allSame = hexagramLines.every(
    l => JSON.stringify(l.coins) === JSON.stringify(hexagramLines[0].coins)
  );
  assert.equal(allSame, false, '6 hào phải có biến thiên ngẫu nhiên');
});

