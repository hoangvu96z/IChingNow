import { Controller, Post, Body, Req, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DatabaseService } from '../database.service';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('interpret')
  async interpret(@Req() req: any, @Body() body: any) {
    const { question, primaryHex, changedHex, movingLines, mode } = body;

    if (!primaryHex) {
      throw new BadRequestException('Thông tin quẻ chủ không hợp lệ.');
    }

    const db = this.dbService.readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    const user = db.users[userIndex];

    if (user.tokens < 1) {
      throw new BadRequestException('Tài khoản của bạn đã hết Token. Vui lòng nạp thêm.');
    }

    // Deduct token
    user.tokens -= 1;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let aiInterpretation = '';

    const prompt = `Bạn là một Dịch học giả (Bậc thầy luận quẻ Kinh Dịch). Hãy luận giải quẻ dịch này một cách sâu sắc, chi tiết, hành văn uyên bác, trang nghiêm.
Câu hỏi sự việc cần xem: "${question || 'Hỏi việc tổng quát'}"
Phương pháp lập quẻ: ${mode === 'quick' ? 'Lục Hào Gieo Nhanh' : mode === 'manual-step' ? 'Lục Hào Gieo Từng Hào' : 'Mai Hoa Dịch Số'}
Quẻ Chủ: ${primaryHex.nameVi} (Quẻ số ${primaryHex.id})
${changedHex ? `Quẻ Biến: ${changedHex.nameVi} (Quẻ số ${changedHex.id})` : 'Quẻ này không có Hào Động, không có Quẻ Biến.'}
${movingLines && movingLines.length > 0 ? `Hào Động: Hào ${movingLines.join(', ')}` : ''}

Hãy cấu trúc bài luận giải chi tiết theo các phần sau:
1. Ý NGHĨA QUẢI TƯỢNG VÀ THỜI THẾ (Tổng quan quẻ Chủ, quẻ Biến nếu có, sự cát hung chung của quái tượng).
2. THẾ - ỨNG VÀ NGŨ HÀNH (Phân tích mối quan hệ giữa Thế và Ứng, sự tương sinh tương khắc ngũ hành của sự việc).
3. LUẬN CHI TIẾT SỰ VIỆC (Đánh giá trực tiếp vào câu hỏi sự việc cần xem. Sự việc sẽ diễn tiến tốt hay xấu, tiến độ nhanh hay chậm).
4. KHUYÊN GIẢI VÀ HÀNH ĐỘNG (Lời khuyên hành động thực tế dựa trên bài học của quẻ dịch).

Vui lòng trình bày bằng tiếng Việt, phân tách các đoạn rõ ràng bằng định dạng Markdown (dùng tiêu đề, danh sách dòng để dễ đọc). Tránh dùng các từ ngữ quá bình dân, hãy giữ phong thái dịch lý cao quý.`;

    if (geminiApiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data: any = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiInterpretation = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Gemini response format error or empty candidates.');
        }
      } catch (err) {
        console.error('Gemini API Error, falling back to mock response:', err);
        aiInterpretation = this.generateMockResponse(question, primaryHex, changedHex, movingLines);
      }
    } else {
      aiInterpretation = this.generateMockResponse(question, primaryHex, changedHex, movingLines);
    }

    const historyItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      question: question || 'Hỏi việc tổng quát',
      primaryHexName: primaryHex.nameVi,
      changedHexName: changedHex ? changedHex.nameVi : null,
      aiInterpretation,
    };

    user.history.push(historyItem);
    this.dbService.writeDB(db);

    return {
      tokens: user.tokens,
      interpretation: aiInterpretation,
    };
  }

  private generateMockResponse(question: string, primaryHex: any, changedHex: any, movingLines: any) {
    const hasMoving = movingLines && movingLines.length > 0;
    return `### 1. Ý NGHĨA QUẢI TƯỢNG VÀ THỜI THẾ
Quẻ Chủ bạn nhận được là **${primaryHex.nameVi}** (Quẻ số ${primaryHex.id}). Đây là tượng quẻ biểu thị thời thế ${primaryHex.id === 23 ? 'suy thoái, xói mòn và sụp đổ (Sơn Địa Bác)' : 'cần thận trọng, tìm sự thông suốt trong hành động'}. 
${changedHex ? `Sự việc bắt đầu bằng quẻ Chủ nhưng do hào động biến đổi dẫn đến quẻ Biến là **${changedHex.nameVi}** (Quẻ số ${changedHex.id}). Điều này báo hiệu sự việc sẽ có chuyển biến lớn từ trạng thái tĩnh sang động, mở ra một chương mới cho diễn tiến tiếp theo.` : 'Quẻ tĩnh không có hào động báo hiệu thời thế đang ở thế cân bằng tạm thời, sự việc chưa có nhiều đột phá hoặc thay đổi lớn.'}

### 2. PHÂN TÍCH THẾ - ỨNG VÀ NGŨ HÀNH
- **Thế vị (Bản thân người hỏi)** đại diện cho trạng thái hiện tại của bạn. Ngũ hành quái tượng cho thấy bạn đang đứng trước những áp lực nhất định, tâm lý có phần lo lắng hoặc nóng vội.
- **Ứng vị (Đối tượng/Sự việc cần xem)** tương tác trực tiếp với Thế. Mối quan hệ Thế - Ứng cho thấy sự tương khắc hoặc chưa hòa hợp hoàn toàn tại thời điểm này. Cần kiên nhẫn tích lũy thêm nội lực.
- **Hào động**: ${hasMoving ? `Sự biến động tại Hào ${movingLines.join(', ')} chỉ ra nút thắt chính nằm ở giai đoạn này. Các hành động đột ngột hoặc nóng nảy sẽ dễ dẫn tới kết quả ngoài ý muốn.` : 'Không có hào động, sự việc hiện tại chịu ảnh hưởng lớn bởi yếu tố môi trường vĩ mô và sự cân bằng nội tại.'}

### 3. LUẬN CHI TIẾT SỰ VIỆC: "${question || 'Xem việc tổng quát'}"
Đối chiếu quái tượng với sự việc cần xem:
- **Tiến độ**: Diễn tiến chậm, có nhiều lực cản vô hình. Sự việc không thể hoàn thành gấp rút mà cần đi từng bước nhỏ.
- **Khả năng thành bại**: Ở thời điểm ban đầu (quẻ Chủ) sẽ gặp khá nhiều trắc trở và cảm giác bế tắc. Tuy nhiên, nếu biết thủ thế, giữ mình và giữ tâm ý chính trực, thì tiến trình về sau ${changedHex ? 'sẽ chuyển hóa tích cực hơn nhờ quẻ Biến' : 'sẽ dần ổn định trở lại'}.

### 4. LỜI KHUYÊN DỊCH LÝ
- **Hành động**: Hãy "thủ tĩnh chế động" — dừng lại quan sát, tránh đưa ra các quyết định đầu tư mạo hiểm hoặc thay đổi công việc trong trạng thái cảm xúc nhất thời.
- **Tâm thái**: Kiên định giữ vững lập trường chính đạo, tránh xa các thị phi nhỏ nhặt. Thời cơ tốt đẹp sẽ tự khắc hé lộ khi thời điểm chín muồi.

*(Đây là bản luận giải Demo của NestJS. Để xem kết quả thực tế từ AI Gemini, vui lòng cấu hình GEMINI_API_KEY trong file .env của hệ thống).*`;
  }
}
