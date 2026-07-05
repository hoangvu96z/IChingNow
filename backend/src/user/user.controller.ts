import { Controller, Get, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DatabaseService } from '../database.service';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    const db = this.dbService.readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản.');
    }

    return {
      username: user.username,
      tokens: user.tokens,
    };
  }
}
