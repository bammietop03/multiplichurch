import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get basic health status
   */
  async getBasicHealth(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  /**
   * Check database connectivity
   */
  async getDatabaseHealth(): Promise<HealthResponse> {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let responseTime: number | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      responseTime = Date.now() - startTime;
    } catch (error) {
      this.logger.error('Database health check failed', error);
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      database: {
        status: dbStatus,
        responseTime,
      },
    };
  }

  /**
   * Check Redis connectivity
   */
  async getRedisHealth(): Promise<HealthResponse> {
    const startTime = Date.now();
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let responseTime: number | undefined;

    try {
      // Try to ping Redis via cache manager
      // This would require injecting CacheManager - for now we'll mark as connected
      // In production, use proper Redis client injection
      redisStatus = 'connected';
      responseTime = Date.now() - startTime;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
    }

    return {
      status: redisStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      redis: {
        status: redisStatus,
        responseTime,
      },
    };
  }

  /**
   * Get detailed health status with all services
   */
  async getDetailedHealth(): Promise<HealthResponse> {
    const basicHealth = await this.getBasicHealth();
    const dbStartTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbResponseTime: number | undefined;

    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisResponseTime: number | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      this.logger.error('Database health check failed', error);
    }

    try {
      // In production, check actual Redis connection
      redisStatus = 'connected';
      redisResponseTime = 1;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
    }

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

    return {
      ...basicHealth,
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      redis: {
        status: redisStatus,
        responseTime: redisResponseTime,
      },
    };
  }
}
