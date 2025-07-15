import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(username: string, email: string, password: string) {
    // Check if user already exists by email or username
    const existingByEmail = await this.userService.findByEmail(email);
    const existingByUsername = await this.userService.userModel.findOne({ username }).exec();
    if (existingByEmail || existingByUsername) {
      throw new ConflictException('User with this email or username already exists');
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    return this.userService.create(username, email, hashed);
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);
    return {
      message: 'You are logged in',
      access_token: token,
    };
  }
} 