import { UserStatus } from '@/generated/prisma/enums';

export class LoginResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    status: UserStatus;
    emailVerifiedAt: Date;
  };
}
