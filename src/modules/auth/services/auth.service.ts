import { Injectable, ConflictException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signup(email: string, password: string) {
    // Check if user already exists
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException('User already exists');
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    return this.userService.create(email, hashed);
  }
} 