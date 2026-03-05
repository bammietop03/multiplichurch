import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { CreateNotificationDto, NotificationQueryDto } from './dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private webSocketService: WebSocketService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
    });

    // Send real-time notification via WebSocket
    this.webSocketService.sendNotification(
      createNotificationDto.userId,
      notification,
    );

    // Send updated unread count
    const unreadCount = await this.getUnreadCount(createNotificationDto.userId);
    this.webSocketService.sendUnreadCount(
      createNotificationDto.userId,
      unreadCount.count,
    );

    return notification;
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const { isRead, type, limit, offset } = query;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        limit,
        offset,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update
    this.webSocketService.notifyNotificationRead(userId, id);
    const unreadCount = await this.getUnreadCount(userId);
    this.webSocketService.sendUnreadCount(userId, unreadCount.count);

    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update
    const unreadCount = await this.getUnreadCount(userId);
    this.webSocketService.sendUnreadCount(userId, unreadCount.count);

    return { success: true };
  }

  async delete(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    await this.prisma.notification.delete({
      where: { id },
    });

    // Send real-time update
    this.webSocketService.notifyNotificationDeleted(userId, id);
    const unreadCount = await this.getUnreadCount(userId);
    this.webSocketService.sendUnreadCount(userId, unreadCount.count);

    return { success: true };
  }

  async deleteAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });

    // Send real-time update
    this.webSocketService.sendUnreadCount(userId, 0);

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  // Helper method to create system notifications
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any,
    link?: string,
  ) {
    return this.create({
      userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      data,
      link,
    });
  }
}
