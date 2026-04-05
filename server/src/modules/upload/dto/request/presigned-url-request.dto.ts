import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsString, IsInt, Min, Max, Matches } from 'class-validator';

class FileMetadataDto {
  @IsString()
  @Matches(/^image\/(jpeg|png|gif|webp)$/, {
    message: 'Chỉ hỗ trợ định dạng JPEG, PNG, GIF, WebP',
  })
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024, { message: 'Dung lượng tối đa 10MB mỗi ảnh' })
  fileSize: number;
}

export class PresignedUrlRequestDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 file' })
  @ArrayMaxSize(10, { message: 'Tối đa 10 file' })
  @ValidateNested({ each: true })
  @Type(() => FileMetadataDto)
  files: FileMetadataDto[];

  @IsOptional()
  @IsIn(['posts', 'avatar', 'cover'], {
    message: 'purpose phải là posts, avatar hoặc cover',
  })
  purpose?: 'posts' | 'avatar' | 'cover';
}
