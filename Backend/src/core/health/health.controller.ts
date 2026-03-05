import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

interface HealthDetailResponse extends HealthResponse {
  database?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2026-01-03T10:00:00Z',
        uptime: 3600,
        environment: 'production',
        version: '1.0.0',
      },
    },
  })
  async healthCheck(): Promise<HealthResponse> {
    return this.healthService.getBasicHealth();
  }

  @Get('db')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({
    status: 200,
    description: 'Database is connected',
    schema: {
      example: {
        status: 'healthy',
        database: {
          status: 'connected',
          responseTime: 12,
        },
      },
    },
  })
  async databaseHealth(): Promise<HealthDetailResponse> {
    return this.healthService.getDatabaseHealth();
  }

  @Get('redis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({
    status: 200,
    description: 'Redis is connected',
    schema: {
      example: {
        status: 'healthy',
        redis: {
          status: 'connected',
          responseTime: 5,
        },
      },
    },
  })
  async redisHealth(): Promise<HealthDetailResponse> {
    return this.healthService.getRedisHealth();
  }

  @Get('detailed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detailed health check with all services' })
  @ApiResponse({
    status: 200,
    description: 'All services status',
  })
  async detailedHealth(): Promise<HealthDetailResponse> {
    return this.healthService.getDetailedHealth();
  }
}
