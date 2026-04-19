import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum MessageTypeDto {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

export class SendMessageDto {
  @IsUUID('all', { message: 'tempId phải là UUID hợp lệ' })
  tempId: string;

  @IsUUID('all', { message: 'conversationId phải là UUID hợp lệ' })
  conversationId: string;

  @IsOptional()
  @IsEnum(MessageTypeDto, { message: 'type không hợp lệ' })
  type?: MessageTypeDto;

  @ValidateIf((o) => o.type === undefined || o.type === MessageTypeDto.TEXT)
  @IsString()
  @IsNotEmpty({ message: 'content không được rỗng với tin nhắn TEXT' })
  @MaxLength(4000, { message: 'content tối đa 4000 ký tự' })
  content?: string;

  @ValidateIf(
    (o) => o.type === MessageTypeDto.IMAGE || o.type === MessageTypeDto.FILE,
  )
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  fileSize?: number;

  @IsOptional()
  @IsUUID('all', { message: 'replyToId phải là UUID hợp lệ' })
  replyToId?: string;
}
