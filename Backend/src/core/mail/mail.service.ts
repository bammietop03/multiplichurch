import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  VERIFICATION_EMAIL,
  PASSWORD_RESET_EMAIL,
  PASSWORD_CHANGED_EMAIL,
  WELCOME_EMAIL,
} from './templates';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.resendApiKey');
    this.fromEmail =
      this.configService.get<string>('app.resendFromEmail') ||
      'noreply@example.com';

    if (!apiKey) {
      console.warn(
        '⚠️ Resend API key not configured. Email sending will fail.',
      );
    }

    this.resend = new Resend(apiKey);
  }

  private replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  async send(options: { to: string; subject: string; html: string }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendEmailVerification(email: string, name: string, code: string) {
    const html = this.replaceVariables(VERIFICATION_EMAIL, { name, code });

    await this.send({
      to: email,
      subject: 'Verify your email address',
      html,
    });
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const url = `${this.configService.get('app.frontendUrl')}/auth/reset-password?token=${token}`;

    const html = this.replaceVariables(PASSWORD_RESET_EMAIL, { name, url });

    await this.send({
      to: email,
      subject: 'Reset your password',
      html,
    });
  }

  async sendPasswordResetConfirmation(email: string, name: string) {
    const html = this.replaceVariables(PASSWORD_CHANGED_EMAIL, { name });

    await this.send({
      to: email,
      subject: 'Password changed successfully',
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    const html = this.replaceVariables(WELCOME_EMAIL, { name });

    await this.send({
      to: email,
      subject: 'Welcome to our platform!',
      html,
    });
  }
}
