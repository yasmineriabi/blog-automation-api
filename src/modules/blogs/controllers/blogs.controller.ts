import { Controller, Post, Query, Get } from '@nestjs/common';
import { BlogsService } from '../services/blogs.service';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post('add-blog')
  async addBlog() {
    try {
      return this.blogsService.addBlog();
    } catch (error) {
      throw new Error(`Failed to add blog: ${error.message}`);
    }
  }

  
} 