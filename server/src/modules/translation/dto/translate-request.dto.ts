import { TranslatableEntity } from '@/generated/prisma/enums';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class TranslateRequestDto {
  @IsString()
  @Length(1, 2000)
  text!: string;

  @IsString()
  @Length(2, 10)
  targetLang!: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  sourceLang?: string;

  @IsOptional()
  @IsEnum(TranslatableEntity)
  entityType?: TranslatableEntity;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
