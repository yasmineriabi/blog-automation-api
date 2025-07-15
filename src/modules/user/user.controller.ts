import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() body: { username: string; email: string; password: string }) {
    return this.userService.create(body.username, body.email, body.password);
  }

  @Get()
  async findByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }
} 