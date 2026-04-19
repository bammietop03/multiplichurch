import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const configSchema = z.object({
  // Application
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  apiVersion: z.string().default('v1'),
  frontendUrl: z.string().url().default('http://localhost:5173'),

  // Database
  databaseUrl: z.string().url(),

  // JWT
  jwtAccessSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtAccessExpiration: z.string().default('15m'),
  jwtRefreshExpiration: z.string().default('7d'),

  // Redis
  redisHost: z.string().default('localhost'),
  redisPort: z.coerce.number().default(6379),
  redisPassword: z.string().optional(),
  cacheTtl: z.coerce.number().default(900),

  // CORS
  corsOrigin: z.string().default('http://localhost:5173'),

  // Rate Limiting
  rateLimitTtl: z.coerce.number().default(60),
  rateLimitMax: z.coerce.number().default(100),

  // File Storage
  storageType: z.enum(['local', 'r2']).default('local'),
  storageLocalPath: z.string().default('./uploads'),

  // Cloudflare R2
  r2AccountId: z.string().optional(),
  r2AccessKeyId: z.string().optional(),
  r2SecretAccessKey: z.string().optional(),
  r2BucketName: z.string().optional(),
  r2PublicUrl: z.string().optional(),

  // Email (Resend)
  resendApiKey: z.string().optional(),
  resendFromEmail: z.string().email().optional().or(z.literal('')),

  // Paystack
  paystackSecretKey: z.string().optional(),
  paystackPublicKey: z.string().optional(),
  paystackWebhookSecret: z.string().optional(),

  // Stripe
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),

  // Flutterwave
  flutterwaveSecretKey: z.string().optional(),
  flutterwavePublicKey: z.string().optional(),
  flutterwaveEncryptionKey: z.string().optional(),
  flutterwaveWebhookSecret: z.string().optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export default registerAs('app', (): AppConfig => {
  const config = {
    // Application
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiVersion: process.env.API_VERSION,

    // Database
    databaseUrl: process.env.DATABASE_URL,

    // JWT
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION,
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,

    // Redis
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    redisPassword: process.env.REDIS_PASSWORD,
    cacheTtl: process.env.CACHE_TTL,

    // CORS
    corsOrigin: process.env.CORS_ORIGIN,

    // Rate Limiting
    rateLimitTtl: process.env.RATE_LIMIT_TTL,
    rateLimitMax: process.env.RATE_LIMIT_MAX,

    // File Storage
    storageType: process.env.STORAGE_TYPE,
    storageLocalPath: process.env.STORAGE_LOCAL_PATH,

    // Cloudflare R2
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2PublicUrl: process.env.R2_PUBLIC_URL,

    // Email (Resend)
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
  };

  const result = configSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
});
