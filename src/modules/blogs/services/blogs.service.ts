import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';

import { Topic, TopicDocument } from '../../topics/models/topic.schema';
import { Blog, BlogDocument } from '../models/blog.schema';
import { BlogSerializer } from '../serilizations/BlogSerializer';
import { DifyBlog } from '../types/blog.type';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) readonly blogModel: Model<BlogDocument>,
    @InjectModel(Topic.name) readonly topicModel: Model<TopicDocument>,
    private readonly logger = new Logger(BlogsService.name),
  ) {}

  async addBlog(): Promise<BlogSerializer> {
    try {
      const blogRes = await this.callDifyWorkflow();
      this.logger.log('Dify response:', blogRes);

      const blog = blogRes.text.content;
      this.logger.log('Blog type:', typeof blog);
      this.logger.log('Blog content:', blog);

      let jsonBlog;

      // Check if blog is already an object or a string
      if (typeof blog === 'object' && blog !== null) {
        // It's already an object - use directly
        jsonBlog = blog;
        this.logger.log('Using blog as object directly');
      } else if (typeof blog === 'string') {
        // It's a string - parse it
        try {
          jsonBlog = JSON.parse(blog);
        } catch (_error) {
          this.logger.error('JSON parse failed, trying to clean...');
          const cleanedBlog = blog.replace(/\\n/g, ' ').replace(/\n/g, ' ');
          jsonBlog = JSON.parse(cleanedBlog);
        }
      } else {
        throw new Error(`Unexpected blog type: ${typeof blog}`);
      }

      this.logger.log('Final jsonBlog:', jsonBlog);

      const createdBlog = await new this.blogModel({
        ...jsonBlog,
        created_by: '123',
      }).save();

      // Update the corresponding topic's is_assigned to true
      if (jsonBlog.topicid) {
        this.logger.log('Updating topic with ID:', jsonBlog.topicid);

        const updateResult = await this.topicModel.updateOne(
          { _id: jsonBlog.topicid },
          { is_assigned: true },
        );

        this.logger.log('Topic update result:', updateResult);
        this.logger.log('Topic updated successfully');
      } else {
        this.logger.log('No topicid found, skipping topic update');
      }

      return plainToInstance(BlogSerializer, createdBlog, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error in addBlog:', error);
      throw new Error(`Failed to add blog: ${error.message}`);
    }
  }

  async callDifyWorkflow(): Promise<DifyBlog> {
    const url = `${process.env.DIFY_API_URL}/v1/workflows/run`;
    const apiKey = process.env.DIFY_API_KEY_blog_generator;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      inputs: {},
      response_mode: 'blocking',
      user: 'abc-123',
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data.data.outputs.text;
    } catch (error) {
      throw new Error(`Dify workflow call failed: ${error.message}`);
    }
  }
}
