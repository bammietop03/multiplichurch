<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Enterprise-ready NestJS backend boilerplate with authentication, authorization, multi-tenancy, security hardening, and payment integration.

## 🚀 Features

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Email verification and password reset
- Role-based access control (RBAC)
- Permission-based authorization
- Multi-tenancy support (Organizations)
- API key authentication

### 🔒 Security Features

- **Helmet** - Secure HTTP headers (CSP, XSS protection, etc.)
- **Rate Limiting** - Global and route-level throttling with @nestjs/throttler
- **CSRF Protection** - Double Submit Cookie pattern
- **Input Validation** - Global validation pipe with whitelist
- **Environment Validation** - Joi schema validation on startup
- **Webhook Signature Verification** - For secure webhook endpoints

### � Standard API Response Format

- **Unified Response Structure** - All endpoints return consistent format
- **Automatic Response Wrapping** - Interceptor handles formatting
- **Standardized Error Handling** - Consistent error responses across all endpoints
- **Rich Metadata** - Timestamp, path, and method included in all responses
- See [STANDARD_RESPONSE_FORMAT.md](./STANDARD_RESPONSE_FORMAT.md) for details

### �💳 Payment Integration

- **Multi-Provider Support**: Paystack, Stripe, Flutterwave
- **Payment Abstraction Layer** - Easy to add new providers
- **Secure Webhooks** - Signature verification for all providers
- **Subscription Management** - Recurring billing support
- **Payment History** - Track all transactions
- **Refund Support** - Initiate refunds through API

### Other Features

- Email notifications with templates (Handlebars)
- File upload support (local/Cloudflare R2)
- Audit logging
- Database migrations (Prisma)
- Docker support

## 📚 Documentation

- [Quick Start Guide](./QUICK_START_AUTH.md)
- [Authorization Guide](./AUTHORIZATION_GUIDE.md)
- [Flexible Authorization](./FLEXIBLE_AUTHORIZATION.md)
- [Security & Payments Guide](./SECURITY_PAYMENTS_GUIDE.md) ⭐ NEW
- [Payment API Reference](./PAYMENT_API_REFERENCE.md) ⭐ NEW
- [R2 Storage Setup Guide](./R2_STORAGE_SETUP.md) ⭐ NEW

## Project setup

```bash
# Install dependencies
$ npm install

# Setup environment variables
$ cp .env.example .env
# Edit .env and fill in your configuration

# Start database with Docker
$ npm run docker:up

# Run database migrations
$ npm run prisma:migrate

# (Optional) Seed database with sample data
$ npm run prisma:seed

# Generate Prisma client
$ npm run prisma:generate
```

## Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# JWT Secrets (use strong random strings in production)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Payment Providers (optional - configure as needed)
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_WEBHOOK_SECRET=xxx

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx

# Email (Resend)
RESEND_API_KEY=re_...
MAIL_FROM=noreply@yourapp.com

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
