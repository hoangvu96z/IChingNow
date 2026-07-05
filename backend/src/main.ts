import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`[NestJS Server] Backend running successfully at http://localhost:${port}`);
}
bootstrap();
