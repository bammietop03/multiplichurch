import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditMiddleware } from './audit.middleware';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [forwardRef(() => DatabaseModule)],
  providers: [AuditService, AuditMiddleware],
  exports: [AuditService, AuditMiddleware],
})
export class AuditModule {}
