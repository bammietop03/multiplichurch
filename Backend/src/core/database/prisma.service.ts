import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AuditMiddleware } from '../audit/audit.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;
  private extendedClient: any;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => AuditMiddleware))
    private auditMiddleware: AuditMiddleware,
  ) {
    const databaseUrl = configService.get<string>('app.databaseUrl');
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    this.pool = pool;

    // Apply Prisma 7 query extensions for audit logging
    this.extendedClient = this.auditMiddleware.initializeExtension(this);
  }

  /**
   * Get the extended Prisma client with audit logging
   */
  getExtendedClient() {
    return this.extendedClient;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
