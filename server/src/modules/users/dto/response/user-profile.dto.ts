import { Exclude, Expose } from 'class-transformer';
import { UserGender } from '@/generated/prisma/client';

export class UserProfileDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string | null;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  coverUrl: string | null;

  @Expose()
  bio: string | null;

  @Expose()
  gender: UserGender | null;

  @Expose()
  birthday: Date | null;

  @Expose()
  address: string | null;

  @Expose()
  isVerifiedBadge: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  friendCount: number;

  @Expose()
  mutualFriendCount: number;

  @Expose()
  relationshipStatus: string;

  @Exclude()
  password: string;

  @Exclude()
  email: string;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}
