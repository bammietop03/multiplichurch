import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Example controller demonstrating various security features:
 * - Global rate limiting (inherited from app.module)
 * - Route-level rate limiting with custom limits
 * - Skipping rate limiting for specific endpoints
 * - CSRF protection (when enabled)
 */
@ApiTags('Security Examples')
@Controller('examples/security')
export class SecurityExamplesController {
  /**
   * This endpoint uses the global rate limit (100 req/min)
   */
  @Get('default-rate-limit')
  @ApiOperation({ summary: 'Endpoint with default rate limit' })
  @ApiResponse({
    status: 200,
    description: 'Uses global rate limiting (100 requests per 60 seconds)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getWithDefaultRateLimit() {
    return {
      message:
        'This endpoint uses global rate limiting (100 requests per 60 seconds)',
    };
  }

  /**
   * This endpoint has a custom stricter rate limit (10 req/min)
   * Useful for sensitive operations like password reset
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('strict-rate-limit')
  @ApiOperation({ summary: 'Endpoint with strict rate limit' })
  @ApiResponse({
    status: 200,
    description: 'Strict rate limiting (10 requests per 60 seconds)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  postWithStrictRateLimit() {
    return {
      message:
        'This endpoint has strict rate limiting (10 requests per 60 seconds)',
    };
  }

  /**
   * This endpoint has a more lenient rate limit (200 req/min)
   * Useful for high-traffic public endpoints
   */
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get('lenient-rate-limit')
  @ApiOperation({ summary: 'Endpoint with lenient rate limit' })
  @ApiResponse({
    status: 200,
    description: 'Lenient rate limiting (200 requests per 60 seconds)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getWithLenientRateLimit() {
    return {
      message:
        'This endpoint has lenient rate limiting (200 requests per 60 seconds)',
    };
  }

  /**
   * This endpoint skips rate limiting entirely
   * Use sparingly and only for health checks or similar
   */
  @SkipThrottle()
  @Get('no-rate-limit')
  @ApiOperation({ summary: 'Endpoint with no rate limit' })
  @ApiResponse({ status: 200, description: 'No rate limiting applied' })
  getWithoutRateLimit() {
    return {
      message: 'This endpoint has no rate limiting',
    };
  }

  /**
   * Protected endpoint with authentication and rate limiting
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Get('protected')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Protected endpoint with rate limit' })
  @ApiResponse({
    status: 200,
    description: 'Requires authentication and has custom rate limiting',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getProtectedWithRateLimit() {
    return {
      message:
        'This endpoint requires authentication and has custom rate limiting',
    };
  }

  /**
   * Example of per-user rate limiting
   * The ThrottlerGuard automatically uses user ID from JWT for authenticated requests
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('per-user-limit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint with per-user rate limit' })
  @ApiResponse({
    status: 200,
    description: 'Per-user rate limiting (20 requests per user per 60 seconds)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  postWithPerUserLimit() {
    return {
      message:
        'This endpoint has per-user rate limiting (20 requests per user per 60 seconds)',
    };
  }
}
