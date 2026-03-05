import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Boilerplate API')
    .setDescription(
      'Comprehensive NestJS Backend with Auth, Payments, Files & Monitoring',
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .addSecurityRequirements('bearer')
    .addTag('Authentication', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Organizations', 'Organization management endpoints')
    .addTag('Payments', 'Payment processing endpoints')
    .addTag('Files', 'File upload and download endpoints')
    .addTag('Health', 'Service health check endpoints')
    .addTag('Audit', 'Audit logging endpoints')
    .addTag('Notifications', 'User notification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      // operationsSorter: 'method',
    },
  });
}

export const API_VERSION_1 = 'v1';
