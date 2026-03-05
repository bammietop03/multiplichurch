import { Module, Global, forwardRef } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [forwardRef(() => AuditModule)],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
