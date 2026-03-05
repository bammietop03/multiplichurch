import { PaymentProvider, PaymentStatus } from '@prisma/client';

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  secretKey: string;
  publicKey?: string;
  webhookSecret?: string;
  encryptionKey?: string;
}

export interface InitializePaymentDto {
  amount: number;
  currency: string;
  email: string;
  userId: string;
  organizationId?: string;
  description?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
  message?: string;
  data?: any;
}

export interface VerifyPaymentDto {
  reference: string;
  provider: PaymentProvider;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
  paidAt?: Date;
  metadata?: any;
}

export interface RefundPaymentDto {
  reference: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundReference?: string;
  message?: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
}

export abstract class IPaymentProvider {
  abstract initializePayment(
    dto: InitializePaymentDto,
  ): Promise<PaymentResponse>;

  abstract verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse>;

  abstract refundPayment(dto: RefundPaymentDto): Promise<RefundResponse>;

  abstract handleWebhook(payload: WebhookPayload): Promise<any>;
}
