import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreateUserDto } from '../dto/createUser.dto';
import { UpdatePasswordDto } from '../dto/updatePassword.dto';
import { UpdateProfilePictureDto } from '../dto/updateProfilePicture.dto';
import { UpdateUsernameDto } from '../dto/updateUsername.dto';
import { UploadProfilePictureDto } from '../dto/uploadProfilePicture.dto';
import { UserSerializer } from '../serilizations/UserSerializer';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserSerializer> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findByEmail(@Query('email') email: string): Promise<UserSerializer> {
    return this.userService.findByEmail(email);
  }
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserSerializer> {
    return this.userService.findById(id);
  }

  @Put('update-username')
  async updateUsername(
    @Body() updateUsernameDto: UpdateUsernameDto,
  ): Promise<{ message: string }> {
    return this.userService.updateUsername(updateUsernameDto);
  }

  @Put('update-password')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    return this.userService.updatePassword(updatePasswordDto);
  }

  @Put('update-profile-picture')
  async updateProfilePicture(
    @Body() updateProfilePictureDto: UpdateProfilePictureDto,
  ): Promise<{ message: string }> {
    return this.userService.updateProfilePicture(updateProfilePictureDto);
  }

  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async uploadProfilePicture(
    @Body() uploadProfilePictureDto: UploadProfilePictureDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; avatarUrl: string }> {
    return this.userService.uploadProfilePicture(uploadProfilePictureDto, file);
  }
}
