import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/createUser.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }
} 