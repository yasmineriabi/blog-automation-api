import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UploadProfilePictureDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
} 