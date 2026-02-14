import { REGEX_PASSWORD } from '@/shared/utils/regex';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username không được để trống' })
  @IsString()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  @MaxLength(20, { message: 'Username không được vượt quá 20 ký tự' })
  username: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  @MaxLength(100, { message: 'Password không được vượt quá 100 ký tự' })
  @Matches(REGEX_PASSWORD.HAS_UPPER, {
    message: 'Password phải chứa ít nhất một chữ in hoa',
  })
  @Matches(REGEX_PASSWORD.HAS_NUMBER, {
    message: 'Password phải chứa ít nhất một số',
  })
  @Matches(REGEX_PASSWORD.HAS_SPECIAL, {
    message: 'Password phải chứa ký tự đặc biệt',
  })
  password: string;
}
