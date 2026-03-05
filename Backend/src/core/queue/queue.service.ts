import { Injectable } from '@nestjs/common';
import { EmailQueueService } from './services/email-queue.service';

/**
 * Central queue service for managing all queue operations
 */
@Injectable()
export class QueueService {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  /**
   * Get email queue service
   */
  getEmailQueue() {
    return this.emailQueueService;
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    return {
      email: await this.emailQueueService.getQueueStats(),
    };
  }
}
