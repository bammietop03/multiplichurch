import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import {
  IPaymentProvider,
  InitializePaymentDto,
  PaymentResponse,
  VerifyPaymentDto,
  VerifyPaymentResponse,
  RefundPaymentDto,
  RefundResponse,
  WebhookPayload,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.isConfigured = true;
    } else {
      console.warn(
        'STRIPE_SECRET_KEY is not configured. Stripe provider disabled.',
      );
    }
  }

  private getUnavailableResponse(operationName: string): any {
    return {
      success: false,
      message: `Stripe is not configured. ${operationName} is unavailable.`,
    };
  }

  async initializePayment(dto: InitializePaymentDto): Promise<PaymentResponse> {
    if (!this.isConfigured || !this.stripe) {
      return this.getUnavailableResponse('Payment initialization');
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: dto.currency.toLowerCase(),
              product_data: {
                name: dto.description || 'Payment',
              },
              unit_amount: Math.round(dto.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: dto.callbackUrl || `${dto.callbackUrl}?success=true`,
        cancel_url: dto.callbackUrl || `${dto.callbackUrl}?cancelled=true`,
        customer_email: dto.email,
        metadata: {
          ...dto.metadata,
          userId: dto.userId,
          organizationId: dto.organizationId || '',
          description: dto.description || '',
        },
      });

      return {
        success: true,
        reference: session.id,
        authorizationUrl: session.url || undefined,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        reference: '',
        message: error.message,
      };
    }
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    if (!this.isConfigured || !this.stripe) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'USD',
        reference: dto.reference,
        metadata: 'Stripe is not configured',
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(
        dto.reference,
      );

      return {
        success: session.payment_status === 'paid',
        status:
          session.payment_status === 'paid'
            ? PaymentStatus.SUCCESS
            : PaymentStatus.FAILED,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        currency: (session.currency || 'usd').toUpperCase(),
        reference: session.id,
        paidAt: session.payment_status === 'paid' ? new Date() : undefined,
        metadata: session.metadata,
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'USD',
        reference: dto.reference,
      };
    }
  }

  async refundPayment(dto: RefundPaymentDto): Promise<RefundResponse> {
    if (!this.isConfigured || !this.stripe) {
      return this.getUnavailableResponse('Refund processing');
    }

    try {
      // First, get the payment intent from the session
      const session = await this.stripe.checkout.sessions.retrieve(
        dto.reference,
      );

      if (!session.payment_intent) {
        return {
          success: false,
          message: 'Payment intent not found',
        };
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        amount: dto.amount ? Math.round(dto.amount * 100) : undefined,
        reason: dto.reason as any,
      });

      return {
        success: refund.status === 'succeeded',
        refundReference: refund.id,
        message: `Refund ${refund.status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<any> {
    if (!this.isConfigured || !this.stripe) {
      return { success: false, message: 'Stripe is not configured' };
    }

    const { event, data } = payload;

    switch (event) {
      case 'checkout.session.completed':
        return {
          event: 'payment.success',
          reference: data.object.id,
          amount: data.object.amount_total / 100,
          currency: data.object.currency.toUpperCase(),
          paidAt: new Date(),
          metadata: data.object.metadata,
        };

      case 'payment_intent.payment_failed':
        return {
          event: 'payment.failed',
          reference: data.object.id,
          metadata: data.object.metadata,
        };

      case 'charge.refunded':
        return {
          event: 'refund.processed',
          reference: data.object.payment_intent,
          refundReference: data.object.id,
          amount: data.object.amount_refunded / 100,
        };

      default:
        return { event, data };
    }
  }
}
