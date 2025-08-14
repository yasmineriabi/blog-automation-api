import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { CreateUserDto } from '../../user/dto/createUser.dto';
import { User, UserDocument } from '../../user/models/user.schema';
import { UserService } from '../../user/services/user.service';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userDoc: Model<UserDocument>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async register(user: Readonly<CreateUserDto>): Promise<{ message: string }> {
    try {
      const { username, email, password } = user;
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser)
        throw new HttpException(
          'An account with that email already exists!',
          HttpStatus.CONFLICT,
        );
      const hashedPassword = await this.hashPassword(password);
      const newUser = await this.userDoc.create({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      // Create fanom rewards record for the new user

      return { message: 'User created successfully' };
    } catch (e) {
      throw new Error(e.message as string);
    }
  }

  async login(loginUser: LoginDto): Promise<{ token: string }> {
    try {
      const user = await this.validateUser(loginUser.email, loginUser.password);

      const token = await this.jwtService.signAsync(
        { user: user._id },
        { secret: process.env.JWT_SECRET, expiresIn: '4d' },
      );
      return {
        token,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message as string, HttpStatus.BAD_REQUEST);
    }
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userDoc.findOne({ email });
    const doesUserExist = !!user;

    if (!doesUserExist) {
      throw new HttpException(
        'Email or Password is invalid!',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const doesPasswordMatch = await this.doesPasswordMatch(
        password,
        user.password,
      );

      if (!doesPasswordMatch) {
        throw new HttpException(
          'Email or Password is invalid!',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (e) {
      console.error(e);
      throw new HttpException(e.message as string, HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
