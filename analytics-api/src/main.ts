import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config({ path: '../.env' });

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  });

  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
bootstrap();
