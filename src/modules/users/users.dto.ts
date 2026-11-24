import { ArrayUnique, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname!: string;
}

export class UpdateInterestsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  categorySlugs!: string[];
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
