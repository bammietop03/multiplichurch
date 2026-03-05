import { Injectable, Logger } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';

export enum WebSocketEvent {
  // Notification events
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',
  UNREAD_COUNT = 'unread-count',

  // System events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',

  // User events
  USER_UPDATED = 'user:updated',
  USER_STATUS = 'user:status',

  // Organization events
  ORG_UPDATED = 'organization:updated',
  ORG_MEMBER_JOINED = 'organization:member-joined',
  ORG_MEMBER_LEFT = 'organization:member-left',

  // Payment events
  PAYMENT_SUCCESS = 'payment:success',
  PAYMENT_FAILED = 'payment:failed',

  // File events
  FILE_UPLOADED = 'file:uploaded',
  FILE_PROCESSING = 'file:processing',
  FILE_READY = 'file:ready',
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private readonly gateway: AppWebSocketGateway) {}

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, notification: any) {
    this.gateway.emitToUser(userId, WebSocketEvent.NOTIFICATION, notification);
    this.logger.debug(`Notification sent to user ${userId}`);
  }

  /**
   * Send unread count to a specific user
   */
  sendUnreadCount(userId: string, count: number) {
    this.gateway.emitToUser(userId, WebSocketEvent.UNREAD_COUNT, { count });
  }

  /**
   * Notify user about notification being read
   */
  notifyNotificationRead(userId: string, notificationId: string) {
    this.gateway.emitToUser(userId, WebSocketEvent.NOTIFICATION_READ, {
      notificationId,
    });
  }

  /**
   * Notify user about notification being deleted
   */
  notifyNotificationDeleted(userId: string, notificationId: string) {
    this.gateway.emitToUser(userId, WebSocketEvent.NOTIFICATION_DELETED, {
      notificationId,
    });
  }

  /**
   * Send system-wide alert
   */
  sendSystemAlert(
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info',
  ) {
    this.gateway.broadcast(WebSocketEvent.SYSTEM_ALERT, {
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`System alert broadcasted: ${message}`);
  }

  /**
   * Notify about system maintenance
   */
  notifyMaintenance(startTime: Date, endTime: Date, message?: string) {
    this.gateway.broadcast(WebSocketEvent.SYSTEM_MAINTENANCE, {
      startTime,
      endTime,
      message,
    });
  }

  /**
   * Notify user about profile update
   */
  notifyUserUpdated(userId: string, updates: any) {
    this.gateway.emitToUser(userId, WebSocketEvent.USER_UPDATED, updates);
  }

  /**
   * Notify organization members about organization update
   */
  notifyOrganizationUpdated(organizationId: string, updates: any) {
    this.gateway.emitToRoom(
      `org:${organizationId}`,
      WebSocketEvent.ORG_UPDATED,
      updates,
    );
  }

  /**
   * Notify organization members about new member
   */
  notifyMemberJoined(organizationId: string, member: any) {
    this.gateway.emitToRoom(
      `org:${organizationId}`,
      WebSocketEvent.ORG_MEMBER_JOINED,
      member,
    );
  }

  /**
   * Notify organization members about member leaving
   */
  notifyMemberLeft(organizationId: string, memberId: string) {
    this.gateway.emitToRoom(
      `org:${organizationId}`,
      WebSocketEvent.ORG_MEMBER_LEFT,
      { memberId },
    );
  }

  /**
   * Notify user about successful payment
   */
  notifyPaymentSuccess(userId: string, paymentDetails: any) {
    this.gateway.emitToUser(
      userId,
      WebSocketEvent.PAYMENT_SUCCESS,
      paymentDetails,
    );
  }

  /**
   * Notify user about failed payment
   */
  notifyPaymentFailed(userId: string, error: any) {
    this.gateway.emitToUser(userId, WebSocketEvent.PAYMENT_FAILED, error);
  }

  /**
   * Notify user about file upload status
   */
  notifyFileStatus(
    userId: string,
    fileId: string,
    status: 'uploaded' | 'processing' | 'ready',
    data?: any,
  ) {
    const eventMap = {
      uploaded: WebSocketEvent.FILE_UPLOADED,
      processing: WebSocketEvent.FILE_PROCESSING,
      ready: WebSocketEvent.FILE_READY,
    };

    this.gateway.emitToUser(userId, eventMap[status], {
      fileId,
      ...data,
    });
  }

  /**
   * Join organization room for real-time updates
   */
  joinOrganizationRoom(userId: string, organizationId: string) {
    this.gateway.joinRoom(userId, `org:${organizationId}`);
    this.logger.debug(
      `User ${userId} joined organization room ${organizationId}`,
    );
  }

  /**
   * Leave organization room
   */
  leaveOrganizationRoom(userId: string, organizationId: string) {
    this.gateway.leaveRoom(userId, `org:${organizationId}`);
    this.logger.debug(
      `User ${userId} left organization room ${organizationId}`,
    );
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.gateway.isUserConnected(userId);
  }

  /**
   * Get connected users count
   */
  getConnectionStats() {
    return {
      totalConnections: this.gateway.getTotalConnections(),
      uniqueUsers: this.gateway.getConnectedUserIds().length,
    };
  }

  /**
   * Send custom event to user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.gateway.emitToUser(userId, event, data);
  }

  /**
   * Send custom event to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: any) {
    this.gateway.emitToUsers(userIds, event, data);
  }

  /**
   * Broadcast custom event to all connected clients
   */
  broadcast(event: string, data: any) {
    this.gateway.broadcast(event, data);
  }
}
