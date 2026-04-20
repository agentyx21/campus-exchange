import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254) // RFC 5321 practical max for email addresses
  email: string;

  @IsString()
  // bcrypt silently truncates at 72 bytes, so anything longer is wasted CPU
  // and a DoS vector (unbounded strings → unbounded bcrypt.compare time).
  @MaxLength(72)
  password: string;
}
