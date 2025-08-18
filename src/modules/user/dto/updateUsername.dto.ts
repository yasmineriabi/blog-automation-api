import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class UpdateUsernameDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsString()
  username: string;
} 