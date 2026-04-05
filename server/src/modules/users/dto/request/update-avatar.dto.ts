import { IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @IsUrl({}, { message: 'URL ảnh không hợp lệ' })
  imageUrl: string;
}
