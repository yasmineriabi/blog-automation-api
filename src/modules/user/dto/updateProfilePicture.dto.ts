import { IsString, IsNotEmpty, IsMongoId, IsUrl } from 'class-validator';

export class UpdateProfilePictureDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  profilePictureUrl: string;
} 