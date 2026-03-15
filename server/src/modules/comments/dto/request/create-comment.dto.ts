import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString()
  @MaxLength(2000, {
    message: 'Nội dung bình luận không được vượt quá 2000 ký tự',
  })
  content: string;

  @IsOptional()
  @IsUUID('all', { message: 'Parent ID không hợp lệ' })
  parentId?: string;
}
