import { PostVisibility } from '@/generated/prisma/enums';
import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  IsUrl,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Nội dung không được vượt quá 5000 ký tự' })
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Tối đa 10 ảnh' })
  @IsUrl(
    { max_allowed_length: 500 },
    { each: true, message: 'URL ảnh không hợp lệ' },
  )
  imageUrls?: string[];

  @IsOptional()
  @IsEnum(PostVisibility, { message: 'Quyền riêng tư không hợp lệ' })
  visibility?: PostVisibility;
}
