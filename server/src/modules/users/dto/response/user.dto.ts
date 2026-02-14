import { Exclude, Expose } from 'class-transformer';
import { UserGender, UserStatus } from '@/generated/prisma/client';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  fullName: string | null;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  bio: string | null;

  @Expose()
  gender: UserGender | null;

  @Expose()
  isVerifiedBadge: boolean;

  @Expose()
  status: UserStatus;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
