import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
export class PaystackProvider implements IPaymentProvider {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY is not configured');
    }
  }

  async initializePayment(dto: InitializePaymentDto): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: dto.email,
          amount: Math.round(dto.amount * 100), // Convert to kobo
          currency: dto.currency,
          callback_url: dto.callbackUrl,
          metadata: {
            ...dto.metadata,
            userId: dto.userId,
            organizationId: dto.organizationId,
            description: dto.description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status,
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        reference: '',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${dto.reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const data = response.data.data;

      return {
        success: response.data.status,
        status:
          data.status === 'success'
            ? PaymentStatus.SUCCESS
            : PaymentStatus.FAILED,
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency,
        reference: data.reference,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        metadata: data.metadata,
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'NGN',
        reference: dto.reference,
      };
    }
  }

  async refundPayment(dto: RefundPaymentDto): Promise<RefundResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/refund`,
        {
          transaction: dto.reference,
          amount: dto.amount ? Math.round(dto.amount * 100) : undefined,
          merchant_note: dto.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status,
        refundReference: response.data.data.transaction.reference,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<any> {
    const { event, data } = payload;

    switch (event) {
      case 'charge.success':
        return {
          event: 'payment.success',
          reference: data.reference,
          amount: data.amount / 100,
          currency: data.currency,
          paidAt: new Date(data.paid_at),
          metadata: data.metadata,
        };

      case 'charge.failed':
        return {
          event: 'payment.failed',
          reference: data.reference,
          metadata: data.metadata,
        };

      case 'refund.processed':
        return {
          event: 'refund.processed',
          reference: data.transaction_reference,
          refundReference: data.refund_reference,
          amount: data.amount / 100,
        };

      default:
        return { event, data };
    }
  }
}
