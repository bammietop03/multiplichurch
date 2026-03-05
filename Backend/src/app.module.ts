import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { CacheModule } from './core/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './core/mail/mail.module';
import { WebSocketModule } from './core/websocket/websocket.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditModule } from './core/audit/audit.module';
import { HealthModule } from './core/health/health.module';
import { QueueModule } from './core/queue/queue.module';
import { StorageModule } from './core/storage/storage.module';
import { FilesModule } from './modules/files/files.module';
import { RolesModule } from './modules/roles/roles.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import appConfig from './config/app.config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    // Global rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000, // Convert to ms
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    DatabaseModule,
    CacheModule,
    MailModule,
    WebSocketModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    PaymentsModule,
    AuditModule,
    HealthModule,
    QueueModule,
    StorageModule,
    FilesModule,
    RolesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply response interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Apply exception filters globally
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
