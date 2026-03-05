import * as crypto from 'crypto';

export class WebhookSignatureUtil {
  /**
   * Verify Paystack webhook signature
   */
  static verifyPaystackSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Verify Stripe webhook signature
   */
  static verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string,
    tolerance = 300,
  ): boolean {
    try {
      const stripe = require('stripe');
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return !!event;
    } catch (err) {
      return false;
    }
  }

  /**
   * Verify Flutterwave webhook signature
   */
  static verifyFlutterwaveSignature(
    signature: string,
    secret: string,
  ): boolean {
    return signature === secret;
  }

  /**
   * Generic HMAC verification
   */
  static verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): boolean {
    const hash = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
