import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReactionType } from '@/generated/prisma/client';

export class CreateReactionDto {
  @IsNotEmpty({ message: 'Vui lòng chọn loại reaction' })
  @IsEnum(ReactionType, { message: 'Loại reaction không hợp lệ' })
  type: ReactionType;
}
