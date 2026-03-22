import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { QueryNotificationDto } from '@modules/notifications/dto/request/query-notification.dto';
import { MarkReadNotificationDto } from '@modules/notifications/dto/request/mark-read-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.getNotifications(
      userId,
      query.cursor,
      query.limit,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkReadNotificationDto,
  ) {
    return this.notificationsService.markAsRead(userId, dto.ids);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
