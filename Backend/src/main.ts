import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    throw new Error('App configuration is not loaded');
  }

  // Security: Helmet - secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    // origin: appConfig.corsOrigin?.split(',').map((o) => o.trim()) || '*',
    origin: ['http://localhost:5173', 'https://multiplichurch.netlify.app', 'https://multiplichurch-three.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-church-id',
      'x-correlation-id',
    ],
  });

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Prevent implicit type conversion
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
    }),
  );

  // API prefix with versioning
  app.setGlobalPrefix(`api/${appConfig.apiVersion}`);

  // Setup Swagger/OpenAPI documentation
  setupSwagger(app);

  await app.listen(appConfig.port);
  console.log(
    `🚀 Application running on: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}`,
  );
  console.log(
    `📚 API Documentation: http://localhost:${appConfig.port}/api/docs`,
  );
  console.log(
    `🔒 Security features enabled: Helmet, Rate Limiting, Validation, Audit Logging`,
  );
}
bootstrap();
