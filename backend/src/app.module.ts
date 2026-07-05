import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from './database.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { PaymentController } from './payment/payment.controller';
import { AiController } from './ai/ai.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'ichingnow_secret_key_12345',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    PaymentController,
    AiController,
  ],
  providers: [AppService, DatabaseService],
})
export class AppModule {}
