import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models/user.schema';
import { CreateUserDto } from '../dto/createUser.dto';
import { plainToInstance } from 'class-transformer';
import { UserSerializer } from '../serilizations/UserSerializer';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') public readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserSerializer | null> {
    const user = await this.userModel.findOne({ email }).lean();
    return plainToInstance(UserSerializer, user, {
      excludeExtraneousValues: true,
    });
  }
  async findById(id: string): Promise<UserSerializer | null> {
    const user = await this.userModel.findById(id).lean();
    return plainToInstance(UserSerializer, user, {
      excludeExtraneousValues: true,
    });
  }
} 