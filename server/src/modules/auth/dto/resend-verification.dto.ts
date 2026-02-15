import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
