import { Controller, Post } from '@nestjs/common';

import { BlogSerializer } from '../serilizations/BlogSerializer';
import { BlogsService } from '../services/blogs.service';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post('add-blog')
  async addBlog(): Promise<BlogSerializer> {
    try {
      return this.blogsService.addBlog();
    } catch (error) {
      throw new Error(`Failed to add blog: ${error.message}`);
    }
  }
}
