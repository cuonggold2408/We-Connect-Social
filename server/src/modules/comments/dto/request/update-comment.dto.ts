import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString()
  @MaxLength(2000, {
    message: 'Nội dung bình luận không được vượt quá 2000 ký tự',
  })
  content: string;
}
