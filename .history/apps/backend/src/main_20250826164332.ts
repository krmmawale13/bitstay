import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // ---------------------------
  // Global Prefix
  // ---------------------------
  const globalPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // ---------------------------
  // CORS (allow FE requests)
  // ---------------------------
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ---------------------------
  // Global Validation
  // ---------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // strip unknown fields
      forbidNonWhitelisted: true,  // throw if extra fields
      transform: true,             // auto-transform payloads to DTOs
    }),
  );

  // ---------------------------
  // Server start
  // ---------------------------
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 BitStay backend is running at http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
