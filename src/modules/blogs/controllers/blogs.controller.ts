import { Controller, Post, UseGuards, Get, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/modules/auth/guards/role.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

import { BlogSerializer } from '../serilizations/BlogSerializer';
import { BlogsService } from '../services/blogs.service';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post('add-blog')
  async addBlog(): Promise<BlogSerializer[]> {
    try {
      return this.blogsService.addBlog();
    } catch (error) {
      throw new Error(`Failed to add blog: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role('admin')
  @Get('admin/pending-blogs')
  async getPendingBlogs(): Promise<BlogSerializer[]> {
    try {
      return this.blogsService.getPendingBlogs();
    } catch (error) {
      throw new Error(`Failed to get pending blogs: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role('admin')
  @Post('admin/pending-blogs/approve')
  async approveBlog(
    @Body() body: { blogId: string },
  ): Promise<{ message: string }> {
    try {
      return this.blogsService.approveBlog(body.blogId);
    } catch (error) {
      throw new Error(`Failed to approve blog: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role('admin')
  @Post('admin/pending-blogs/reject')
  async rejectBlog(
    @Body() body: { blogId: string },
  ): Promise<{ message: string }> {
    try {
      return this.blogsService.rejectBlog(body.blogId);
    } catch (error) {
      throw new Error(`Failed to reject blog: ${error.message}`);
    }
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogSerializer> {
    try {
      return this.blogsService.getBlogById(id);
    } catch (error) {
      throw new Error(`Failed to get blog: ${error.message}`);
    }
  }

  @Get('approved/with-domains')
  async getApprovedBlogsWithDomains(): Promise<any[]> {
    try {
      return this.blogsService.getApprovedBlogsWithDomains();
    } catch (error) {
      throw new Error(
        `Failed to get approved blogs with domains: ${error.message}`,
      );
    }
  }
}
