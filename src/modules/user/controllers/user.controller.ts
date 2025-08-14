import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';

import { CreateUserDto } from '../dto/createUser.dto';
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
}
