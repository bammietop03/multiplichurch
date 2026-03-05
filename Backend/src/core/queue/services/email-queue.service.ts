import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  priority?: 'high' | 'normal' | 'low';
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue('email')
    private readonly emailQueue: Queue<EmailJob>,
  ) {}

  /**
   * Add email job to queue
   */
  async addEmailJob(data: EmailJob): Promise<Job<EmailJob>> {
    const priority = this.getPriorityValue(data.priority);

    return this.emailQueue.add(data, {
      priority,
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Add multiple email jobs
   */
  async addBulkEmailJobs(jobs: EmailJob[]): Promise<Job<EmailJob>[]> {
    return Promise.all(jobs.map((job) => this.addEmailJob(job)));
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const counts = await this.emailQueue.getJobCounts();
    const delayed = await this.emailQueue.getDelayedCount();

    return {
      ...counts,
      delayed,
    };
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    await this.emailQueue.clean(0);
  }

  /**
   * Get queue name
   */
  getQueueName(): string {
    return this.emailQueue.name;
  }

  /**
   * Convert priority string to numeric value
   */
  private getPriorityValue(priority?: string): number {
    const priorityMap = {
      high: 1,
      normal: 5,
      low: 10,
    };
    return priorityMap[priority as keyof typeof priorityMap] || 5;
  }
}
