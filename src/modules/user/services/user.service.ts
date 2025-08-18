import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';

import { CreateUserDto } from '../dto/createUser.dto';
import { UpdatePasswordDto } from '../dto/updatePassword.dto';
import { UpdateProfilePictureDto } from '../dto/updateProfilePicture.dto';
import { UpdateUsernameDto } from '../dto/updateUsername.dto';
import { UploadProfilePictureDto } from '../dto/uploadProfilePicture.dto';
import { User } from '../models/user.schema';
import { UserSerializer } from '../serilizations/UserSerializer';

import { FileUploadService } from './file-upload.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') public readonly userModel: Model<User>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserSerializer> {
    try {
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
      const createdUser = new this.userModel(createUserDto);
      await createdUser.save();
      return plainToInstance(UserSerializer, createdUser, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to create user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByEmail(email: string): Promise<UserSerializer> {
    try {
      const user = await this.userModel.findOne({ email }).lean();
      return plainToInstance(UserSerializer, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to find user by email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findById(id: string): Promise<UserSerializer> {
    try {
      const user = await this.userModel.findById(id).lean();
      return plainToInstance(UserSerializer, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to find user by id: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUsername(
    updateUsernameDto: UpdateUsernameDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userModel.findById(updateUsernameDto.userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check if username is already taken by another user
      const existingUser = await this.userModel.findOne({
        username: updateUsernameDto.username,
        _id: { $ne: updateUsernameDto.userId },
      });

      if (existingUser) {
        throw new HttpException(
          'Username already taken',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userModel.findByIdAndUpdate(updateUsernameDto.userId, {
        username: updateUsernameDto.username,
      });

      return { message: 'Username updated successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to update username: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userModel.findById(updatePasswordDto.userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Verify the old password
      const isOldPasswordValid = await bcrypt.compare(
        updatePasswordDto.oldPassword,
        user.password,
      );

      if (!isOldPasswordValid) {
        throw new HttpException(
          'Old password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(
        updatePasswordDto.newPassword,
        10,
      );

      await this.userModel.findByIdAndUpdate(updatePasswordDto.userId, {
        password: hashedPassword,
      });

      return { message: 'Password updated successfully' };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update password: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProfilePicture(
    updateProfilePictureDto: UpdateProfilePictureDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userModel.findById(
        updateProfilePictureDto.userId,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.userModel.findByIdAndUpdate(updateProfilePictureDto.userId, {
        avatar: updateProfilePictureDto.profilePictureUrl,
      });

      return { message: 'Profile picture updated successfully' };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update profile picture: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadProfilePicture(
    uploadProfilePictureDto: UploadProfilePictureDto,
    file: Express.Multer.File,
  ): Promise<{ message: string; avatarUrl: string }> {
    try {
      const user = await this.userModel.findById(
        uploadProfilePictureDto.userId,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Delete old profile picture if it exists
      if (user.avatar && user.avatar !== '') {
        await this.fileUploadService.deleteProfilePicture(user.avatar);
      }

      // Upload new file
      const avatarUrl = await this.fileUploadService.uploadProfilePicture(file);

      // Update user's avatar
      await this.userModel.findByIdAndUpdate(uploadProfilePictureDto.userId, {
        avatar: avatarUrl,
      });

      return {
        message: 'Profile picture uploaded successfully',
        avatarUrl: avatarUrl,
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to upload profile picture: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
