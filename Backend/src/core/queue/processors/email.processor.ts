import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '../../mail/mail.service';
import { EmailJob } from '../services/email-queue.service';

@Processor('email')
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process()
  async processEmail(job: Job<EmailJob>) {
    try {
      this.logger.debug(`Processing email job ${job.id} for ${job.data.to}`);

      await this.mailService.send({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      });

      this.logger.log(`Email sent successfully for job ${job.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email for job ${job.id}`, error);
      // Rethrow to trigger retry logic
      throw error;
    }
  }
}
