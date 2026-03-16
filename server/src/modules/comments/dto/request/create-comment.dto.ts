import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @Transform(({ value }: { value: string }) => value?.trim() || '')
  @IsString()
  @IsOptional()
  @MaxLength(2000, {
    message: 'Nội dung bình luận không được vượt quá 2000 ký tự',
  })
  content?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Parent ID không hợp lệ' })
  parentId?: string;

  @IsOptional()
  @IsUrl({ max_allowed_length: 500 }, { message: 'URL ảnh không hợp lệ' })
  imageUrl?: string;
}
