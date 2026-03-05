import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentProvider } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards';
import {
  InitializePaymentDto,
  VerifyPaymentDto,
  RefundPaymentDto,
} from './dto';
import { WebhookSignatureUtil } from '../../common/utils/webhook-signature.util';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a payment' })
  @ApiBody({ type: InitializePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initializePayment(@Body() dto: InitializePaymentDto, @Req() req: any) {
    // Add user from JWT token
    dto.userId = req.user.id;
    return this.paymentsService.initializePayment(dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for current user' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(@Req() req: any) {
    return this.paymentsService.getPaymentHistory(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  // Webhook endpoints
  @Post('webhooks/paystack')
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'Paystack webhook signature',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or webhook secret not configured',
  })
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');

    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const payload = JSON.stringify(req.body);

    const isValid = WebhookSignatureUtil.verifyPaystackSignature(
      payload,
      signature,
      secret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return this.paymentsService.handleWebhook(
      PaymentProvider.PAYSTACK,
      signature,
      req.body,
    );
  }

  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or webhook secret not configured',
  })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const payload = JSON.stringify(req.body);

    const isValid = WebhookSignatureUtil.verifyStripeSignature(
      payload,
      signature,
      secret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return this.paymentsService.handleWebhook(
      PaymentProvider.STRIPE,
      signature,
      req.body,
    );
  }

  @Post('webhooks/flutterwave')
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  @ApiHeader({
    name: 'verif-hash',
    description: 'Flutterwave verification hash',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or webhook secret not configured',
  })
  async flutterwaveWebhook(
    @Headers('verif-hash') signature: string,
    @Req() req: Request,
  ) {
    const secret = this.configService.get<string>('FLUTTERWAVE_WEBHOOK_SECRET');

    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const isValid = WebhookSignatureUtil.verifyFlutterwaveSignature(
      signature,
      secret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return this.paymentsService.handleWebhook(
      PaymentProvider.FLUTTERWAVE,
      signature,
      req.body,
    );
  }
}
