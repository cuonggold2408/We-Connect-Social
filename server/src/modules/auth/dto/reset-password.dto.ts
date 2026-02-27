import { Match } from '@/shared/decorators/match.decorator';
import { REGEX_PASSWORD } from '@/shared/utils/regex';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token không được để trống' })
  @IsString()
  token: string;

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
  newPassword: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString()
  @Match('newPassword', {
    message: 'Xác nhận mật khẩu không khớp với mật khẩu',
  })
  confirmPassword: string;
}
