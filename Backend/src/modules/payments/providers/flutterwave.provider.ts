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
export class FlutterwaveProvider implements IPaymentProvider {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
    if (!this.secretKey) {
      console.warn('FLUTTERWAVE_SECRET_KEY is not configured');
    }
  }

  async initializePayment(dto: InitializePaymentDto): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `FLW-${Date.now()}`,
          amount: dto.amount,
          currency: dto.currency,
          redirect_url: dto.callbackUrl,
          customer: {
            email: dto.email,
          },
          customizations: {
            title: dto.description || 'Payment',
            description: dto.description || 'Payment description',
          },
          meta: {
            ...dto.metadata,
            userId: dto.userId,
            organizationId: dto.organizationId,
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
        success: response.data.status === 'success',
        reference: response.data.data.tx_ref,
        authorizationUrl: response.data.data.link,
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
        `${this.baseUrl}/transactions/${dto.reference}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const data = response.data.data;

      return {
        success: response.data.status === 'success',
        status:
          data.status === 'successful'
            ? PaymentStatus.SUCCESS
            : PaymentStatus.FAILED,
        amount: data.amount,
        currency: data.currency,
        reference: data.tx_ref,
        paidAt: data.created_at ? new Date(data.created_at) : undefined,
        metadata: data.meta,
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
        `${this.baseUrl}/transactions/${dto.reference}/refund`,
        {
          amount: dto.amount,
          comments: dto.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status === 'success',
        refundReference: response.data.data.id,
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
      case 'charge.completed':
        return {
          event: 'payment.success',
          reference: data.tx_ref,
          amount: data.amount,
          currency: data.currency,
          paidAt: new Date(data.created_at),
          metadata: data.meta,
        };

      case 'charge.failed':
        return {
          event: 'payment.failed',
          reference: data.tx_ref,
          metadata: data.meta,
        };

      case 'refund.completed':
        return {
          event: 'refund.processed',
          reference: data.tx_ref,
          refundReference: data.id,
          amount: data.amount,
        };

      default:
        return { event, data };
    }
  }
}
