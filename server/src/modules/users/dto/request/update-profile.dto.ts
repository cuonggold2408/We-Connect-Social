import { UserGender } from '@/generated/prisma/client';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'Họ tên không được vượt quá 40 ký tự' })
  fullname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Tiểu sử không được vượt quá 150 ký tự' })
  bio?: string;

  @IsOptional()
  @IsEnum(UserGender, { message: 'Giới tính không hợp lệ' })
  gender?: UserGender;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  birthday?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự' })
  address?: string;
}
