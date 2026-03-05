import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { PaystackProvider } from './providers/paystack.provider';
import { StripeProvider } from './providers/stripe.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import {
  IPaymentProvider,
  InitializePaymentDto as IInitializePaymentDto,
  VerifyPaymentDto as IVerifyPaymentDto,
  RefundPaymentDto as IRefundPaymentDto,
} from './interfaces/payment-provider.interface';
import {
  InitializePaymentDto,
  VerifyPaymentDto,
  RefundPaymentDto,
} from './dto';

@Injectable()
export class PaymentsService {
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private paystackProvider: PaystackProvider,
    private stripeProvider: StripeProvider,
    private flutterwaveProvider: FlutterwaveProvider,
  ) {
    this.providers.set(PaymentProvider.PAYSTACK, this.paystackProvider);
    this.providers.set(PaymentProvider.STRIPE, this.stripeProvider);
    this.providers.set(PaymentProvider.FLUTTERWAVE, this.flutterwaveProvider);
  }

  private getProvider(provider: PaymentProvider): IPaymentProvider {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new BadRequestException(
        `Payment provider ${provider} not supported`,
      );
    }
    return providerInstance;
  }

  async initializePayment(dto: InitializePaymentDto) {
    const provider = this.getProvider(dto.provider);

    // Initialize payment with provider
    const response = await provider.initializePayment({
      amount: dto.amount,
      currency: dto.currency,
      email: dto.email,
      userId: dto.userId,
      organizationId: dto.organizationId,
      description: dto.description,
      metadata: dto.metadata,
      callbackUrl: dto.callbackUrl,
    });

    if (!response.success) {
      throw new BadRequestException(
        response.message || 'Failed to initialize payment',
      );
    }

    // Create payment record in database
    const payment = await this.prisma.payment.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        provider: dto.provider,
        providerRef: response.reference,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.PENDING,
        description: dto.description,
        metadata: dto.metadata as any,
      },
    });

    return {
      payment,
      authorizationUrl: response.authorizationUrl,
      accessCode: response.accessCode,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const provider = this.getProvider(dto.provider);

    // Verify with provider
    const response = await provider.verifyPayment({
      reference: dto.reference,
      provider: dto.provider,
    });

    // Update payment in database
    const payment = await this.prisma.payment.update({
      where: {
        providerRef: dto.reference,
      },
      data: {
        status: response.status,
        paidAt: response.paidAt,
        metadata: response.metadata as any,
      },
    });

    return {
      payment,
      verified: response.success,
    };
  }

  async refundPayment(dto: RefundPaymentDto) {
    // Get payment from database
    const payment = await this.prisma.payment.findUnique({
      where: {
        providerRef: dto.reference,
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    const provider = this.getProvider(payment.provider);

    // Process refund with provider
    const response = await provider.refundPayment({
      reference: dto.reference,
      amount: dto.amount,
      reason: dto.reason,
    });

    if (!response.success) {
      throw new BadRequestException(
        response.message || 'Failed to process refund',
      );
    }

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return {
      payment: updatedPayment,
      refund: response,
    };
  }

  async handleWebhook(
    provider: PaymentProvider,
    signature: string,
    payload: any,
  ) {
    const providerInstance = this.getProvider(provider);

    // Process webhook
    const result = await providerInstance.handleWebhook(payload);

    // Handle payment success
    if (result.event === 'payment.success') {
      await this.prisma.payment.update({
        where: {
          providerRef: result.reference,
        },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: result.paidAt,
          metadata: result.metadata as any,
        },
      });
    }

    // Handle payment failure
    if (result.event === 'payment.failed') {
      await this.prisma.payment.update({
        where: {
          providerRef: result.reference,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    }

    // Handle refund
    if (result.event === 'refund.processed') {
      await this.prisma.payment.update({
        where: {
          providerRef: result.reference,
        },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
        },
      });
    }

    return result;
  }

  async getPaymentHistory(userId: string, organizationId?: string) {
    return this.prisma.payment.findMany({
      where: {
        userId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPaymentById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }
}
