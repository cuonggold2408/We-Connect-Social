import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class SuggestReplyDto {
  @IsUUID()
  conversationId!: string;

  @IsOptional()
  @IsUUID()
  callSessionId?: string;

  @IsString()
  @Length(2, 500)
  originalSentence!: string;

  @IsString()
  @Length(2, 10)
  remoteLang!: string;

  @IsString()
  @Length(2, 10)
  userLang!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  recentContext?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  userIntent?: string;
}
