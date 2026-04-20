import { IsString, IsOptional, MaxLength, IsNotEmpty, Validate } from 'class-validator';
import { IsSafeUrlConstraint } from '../../common/safe-url.validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Validate(IsSafeUrlConstraint)
  profileImage?: string;
}
