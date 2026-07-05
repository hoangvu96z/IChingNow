import { Controller, Post, Body, Req, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DatabaseService } from '../database.service';

@Controller('payment')
@UseGuards(AuthGuard)
export class PaymentController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('mock')
  mockPayment(@Req() req: any, @Body() body: any) {
    const { tokensToBuy } = body;

    if (!tokensToBuy || typeof tokensToBuy !== 'number' || tokensToBuy <= 0) {
      throw new BadRequestException('Số lượng Token không hợp lệ.');
    }

    const db = this.dbService.readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    db.users[userIndex].tokens += tokensToBuy;
    this.dbService.writeDB(db);

    return {
      message: `Đã nạp thành công +${tokensToBuy} Tokens!`,
      tokens: db.users[userIndex].tokens,
    };
  }
}
