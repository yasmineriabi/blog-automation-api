import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';

import { CreateUserDto } from '../dto/createUser.dto';
import { User } from '../models/user.schema';
import { UserSerializer } from '../serilizations/UserSerializer';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') public readonly userModel: Model<User>) {}

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
}
