import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendshipsRepository } from '@modules/friendships/friendships.repository';
import { FeedCacheService } from '@/shared/cache/feed-cache.service';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import {
  FriendshipStatus,
  NotificationType,
  UserStatus,
} from '@/generated/prisma/client';
import {
  NOTIFICATION_EVENTS,
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';
import { PrismaService } from '@shared/prisma/prisma.service';
import { SuggestionCacheService } from '@modules/friendships/cache/suggestion-cache.service';

export enum RelationshipStatus {
  NONE = 'NONE',
  PENDING_OUTGOING = 'PENDING_OUTGOING',
  PENDING_INCOMING = 'PENDING_INCOMING',
  FRIENDS = 'FRIENDS',
  SELF = 'SELF',
}

export interface RelationshipStatusResult {
  status: RelationshipStatus;
  friendshipId?: string;
}

@Injectable()
export class FriendshipsService {
  private readonly logger = new Logger(FriendshipsService.name);
  private readonly SUGGESTIONS_LIMIT = 20;

  constructor(
    private friendshipsRepository: FriendshipsRepository,
    private feedCacheService: FeedCacheService,
    private suggestionCacheService: SuggestionCacheService,
    private notificationsGateway: NotificationsGateway,
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  private async validateCanSendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'Không thể gửi lời mời kết bạn cho chính mình',
      );
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, status: true },
    });

    if (!receiver || receiver.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
  }

  private async invalidateSuggestionsForPair(
    userA: string,
    userB: string,
  ): Promise<void> {
    await Promise.all([
      this.suggestionCacheService.invalidate(userA),
      this.suggestionCacheService.invalidate(userB),
    ]);
  }

  async sendRequest(senderId: string, receiverId: string) {
    await this.validateCanSendRequest(senderId, receiverId);

    const existing = await this.friendshipsRepository.findBetweenUsers(
      senderId,
      receiverId,
    );

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Hai bạn đã là bạn bè');
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === senderId) {
          throw new ConflictException('Bạn đã gửi lời mời kết bạn rồi');
        }
        this.logger.log(
          `Cross-request detected: ${senderId} → ${receiverId}, auto-accepting`,
        );
        return this.acceptRequest(senderId, receiverId);
      }

      await this.friendshipsRepository.delete(existing.id);
    }

    let friendship;
    try {
      friendship = await this.friendshipsRepository.create(
        senderId,
        receiverId,
      );
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('pair_key')) {
        this.logger.warn(
          `Concurrent cross-request (P2002): ${senderId} ↔ ${receiverId}, fallback to accept`,
        );
        return this.acceptRequest(senderId, receiverId);
      }
      throw error;
    }

    this.logger.log(`Friend request sent: ${senderId} → ${receiverId}`);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.FRIEND_REQUESTED, {
      actorId: senderId,
      recipientId: receiverId,
      type: NotificationType.FRIEND_REQUEST,
      entityType: NotificationEntityType.FRIEND,
      entityId: friendship.id,
      metadata: {
        senderUsername: friendship.sender.username,
        senderFullname: friendship.sender.fullname,
        senderAvatarUrl: friendship.sender.avatarUrl,
      },
    } as NotificationPayload);

    this.emitFriendshipUpdate(receiverId, 'REQUEST_RECEIVED', {
      friendshipId: friendship.id,
      sender: friendship.sender,
    });

    await this.invalidateSuggestionsForPair(senderId, receiverId);

    return {
      id: friendship.id,
      status: friendship.status,
      sender: friendship.sender,
      receiver: friendship.receiver,
      createdAt: friendship.createdAt,
    };
  }

  async acceptRequest(currentUserId: string, senderId: string) {
    const friendship = await this.friendshipsRepository.findBetweenUsers(
      senderId,
      currentUserId,
    );

    if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
      throw new NotFoundException('Lời mời kết bạn không tồn tại');
    }

    if (friendship.receiverId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền chấp nhận lời mời này');
    }

    const result = await this.friendshipsRepository.transitionStatus(
      friendship.id,
      FriendshipStatus.PENDING,
      FriendshipStatus.ACCEPTED,
      { acceptedAt: new Date() },
    );

    if (result.count === 0) {
      throw new ConflictException('Lời mời đã được xử lý');
    }

    this.logger.log(`Friend request accepted: ${senderId} ↔ ${currentUserId}`);

    await this.feedCacheService.invalidateFriends(
      friendship.senderId,
      friendship.receiverId,
    );

    await this.invalidateSuggestionsForPair(
      friendship.senderId,
      friendship.receiverId,
    );

    this.eventEmitter.emit(NOTIFICATION_EVENTS.FRIEND_ACCEPTED, {
      actorId: currentUserId,
      recipientId: friendship.senderId,
      type: NotificationType.FRIEND_ACCEPTED,
      entityType: NotificationEntityType.FRIEND,
      entityId: friendship.id,
      metadata: {
        accepterUsername: friendship.receiver.username,
        accepterFullname: friendship.receiver.fullname,
        accepterAvatarUrl: friendship.receiver.avatarUrl,
      },
    } as NotificationPayload);

    this.emitFriendshipUpdate(friendship.senderId, 'REQUEST_ACCEPTED', {
      friendshipId: friendship.id,
      friend: friendship.receiver,
    });

    this.emitFriendshipUpdate(currentUserId, 'REQUEST_ACCEPTED', {
      friendshipId: friendship.id,
      friend: friendship.sender,
    });

    return { success: true };
  }

  async rejectRequest(currentUserId: string, senderId: string) {
    const friendship = await this.friendshipsRepository.findBetweenUsers(
      senderId,
      currentUserId,
    );

    if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
      throw new NotFoundException('Lời mời kết bạn không tồn tại');
    }

    if (friendship.receiverId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền từ chối lời mời này');
    }

    const result = await this.friendshipsRepository.deleteIfStatus(
      friendship.id,
      FriendshipStatus.PENDING,
    );

    if (result.count === 0) {
      throw new ConflictException('Lời mời đã được xử lý');
    }

    this.logger.log(`Friend request rejected: ${senderId} → ${currentUserId}`);

    this.emitFriendshipUpdate(currentUserId, 'REQUEST_REJECTED', {
      friendshipId: friendship.id,
      userId: senderId,
    });

    await this.invalidateSuggestionsForPair(currentUserId, senderId);

    return { success: true };
  }

  async cancelRequest(currentUserId: string, receiverId: string) {
    const friendship = await this.friendshipsRepository.findBetweenUsers(
      currentUserId,
      receiverId,
    );

    if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
      throw new NotFoundException('Lời mời kết bạn không tồn tại');
    }

    if (friendship.senderId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền hủy lời mời này');
    }

    const result = await this.friendshipsRepository.deleteIfStatus(
      friendship.id,
      FriendshipStatus.PENDING,
    );

    if (result.count === 0) {
      throw new ConflictException('Lời mời đã được xử lý');
    }

    this.emitFriendshipUpdate(receiverId, 'REQUEST_CANCELLED', {
      friendshipId: friendship.id,
      userId: currentUserId,
    });

    await this.invalidateSuggestionsForPair(currentUserId, receiverId);

    return { success: true };
  }

  async unfriend(currentUserId: string, friendId: string) {
    const friendship = await this.friendshipsRepository.findBetweenUsers(
      currentUserId,
      friendId,
    );

    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new NotFoundException('Các bạn chưa là bạn bè');
    }

    const result = await this.friendshipsRepository.deleteIfStatus(
      friendship.id,
      FriendshipStatus.ACCEPTED,
    );

    if (result.count === 0) {
      throw new ConflictException('Trạng thái đã thay đổi');
    }

    this.logger.log(`Unfriended: ${currentUserId} ↔ ${friendId}`);

    await this.feedCacheService.invalidateFriends(currentUserId, friendId);

    await this.invalidateSuggestionsForPair(currentUserId, friendId);

    this.emitFriendshipUpdate(friendId, 'UNFRIENDED', {
      friendshipId: friendship.id,
      userId: currentUserId,
    });

    this.emitFriendshipUpdate(currentUserId, 'UNFRIENDED', {
      friendshipId: friendship.id,
      userId: friendId,
    });

    return { success: true };
  }

  async getReceivedRequests(userId: string, cursor?: string, limit = 20) {
    const requests = await this.friendshipsRepository.findReceivedRequests(
      userId,
      cursor,
      limit,
    );

    const hasMore = requests.length > limit;
    const sliced = hasMore ? requests.slice(0, limit) : requests;

    return {
      data: sliced.map((r) => ({
        id: r.id,
        sender: r.sender,
        createdAt: r.createdAt,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getSentRequests(userId: string, cursor?: string, limit = 20) {
    const requests = await this.friendshipsRepository.findSentRequests(
      userId,
      cursor,
      limit,
    );

    const hasMore = requests.length > limit;
    const sliced = hasMore ? requests.slice(0, limit) : requests;

    return {
      data: sliced.map((r) => ({
        id: r.id,
        receiver: r.receiver,
        createdAt: r.createdAt,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getFriends(userId: string, cursor?: string, limit = 20) {
    const friendships = await this.friendshipsRepository.findFriends(
      userId,
      cursor,
      limit,
    );

    const hasMore = friendships.length > limit;
    const sliced = hasMore ? friendships.slice(0, limit) : friendships;

    return {
      data: sliced.map((f) => ({
        id: f.id,
        friend: f.senderId === userId ? f.receiver : f.sender,
        since: f.acceptedAt ?? f.createdAt,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getRelationshipStatus(
    currentUserId: string,
    targetUserId: string,
  ): Promise<RelationshipStatusResult> {
    if (currentUserId === targetUserId) {
      return { status: RelationshipStatus.SELF };
    }

    const friendship = await this.friendshipsRepository.findBetweenUsers(
      currentUserId,
      targetUserId,
    );

    if (
      !friendship ||
      friendship.status === FriendshipStatus.REJECTED ||
      friendship.status === FriendshipStatus.UNFRIEND
    ) {
      return { status: RelationshipStatus.NONE };
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return {
        status: RelationshipStatus.FRIENDS,
        friendshipId: friendship.id,
      };
    }

    if (friendship.senderId === currentUserId) {
      return {
        status: RelationshipStatus.PENDING_OUTGOING,
        friendshipId: friendship.id,
      };
    }

    return {
      status: RelationshipStatus.PENDING_INCOMING,
      friendshipId: friendship.id,
    };
  }

  async getFriendCount(userId: string) {
    return this.friendshipsRepository.countFriends(userId);
  }

  async getPendingReceivedCount(userId: string) {
    return this.friendshipsRepository.countPendingReceived(userId);
  }

  private emitFriendshipUpdate(
    userId: string,
    action: string,
    payload: Record<string, any>,
  ) {
    this.notificationsGateway.sendFriendshipUpdate(userId, {
      action,
      ...payload,
    });
  }

  async getSuggestions(userId: string, limit = this.SUGGESTIONS_LIMIT) {
    const cached = await this.suggestionCacheService.getSuggestions(userId);
    if (cached) {
      this.logger.debug(`Suggestions cache HIT for ${userId}`);
      return { data: cached };
    }

    this.logger.debug(`Suggestions cache MISS for ${userId}, computing...`);

    const dismissedIds =
      await this.suggestionCacheService.getDismissedIds(userId);
    const dismissedSet = new Set(dismissedIds);

    const fetchLimit = limit + dismissedIds.length;
    let suggestions = await this.friendshipsRepository.findFoFSuggestions(
      userId,
      fetchLimit,
    );

    suggestions = suggestions.filter((s) => !dismissedSet.has(s.id));

    if (suggestions.length < limit) {
      const existingIds = new Set([
        ...suggestions.map((s) => s.id),
        ...dismissedIds,
      ]);

      const needed = limit - suggestions.length + dismissedIds.length;
      const randomUsers =
        await this.friendshipsRepository.findRandomActiveUsers(userId, needed);

      const filteredRandom = randomUsers.filter((u) => !existingIds.has(u.id));
      suggestions = [...suggestions, ...filteredRandom];
    }

    const result = suggestions.slice(0, limit);

    await this.suggestionCacheService.setSuggestions(userId, result);

    return { data: result };
  }

  async dismissSuggestion(userId: string, targetUserId: string) {
    await this.suggestionCacheService.addDismissed(userId, targetUserId);
    await this.suggestionCacheService.removeSuggestionFromCache(
      userId,
      targetUserId,
    );

    return { success: true };
  }
}
