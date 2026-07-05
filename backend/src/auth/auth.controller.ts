import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    const { username, password } = body;

    if (!username || !password) {
      throw new BadRequestException('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    }

    const db = this.dbService.readDB();
    const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (existingUser) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại.');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = {
        id: Date.now().toString(),
        username,
        passwordHash,
        tokens: 3,
        history: [],
      };

      db.users.push(newUser);
      this.dbService.writeDB(db);

      const token = await this.jwtService.signAsync({ id: newUser.id, username: newUser.username });

      return {
        token,
        user: {
          username: newUser.username,
          tokens: newUser.tokens,
        },
      };
    } catch (err) {
      throw new InternalServerErrorException('Lỗi đăng ký tài khoản.');
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    const { username, password } = body;

    if (!username || !password) {
      throw new BadRequestException('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    }

    const db = this.dbService.readDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      throw new BadRequestException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    try {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }

      const token = await this.jwtService.signAsync({ id: user.id, username: user.username });

      return {
        token,
        user: {
          username: user.username,
          tokens: user.tokens,
        },
      };
    } catch (err) {
      throw new InternalServerErrorException('Lỗi đăng nhập hệ thống.');
    }
  }
}
