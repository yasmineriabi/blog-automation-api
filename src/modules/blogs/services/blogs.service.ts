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
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    @InjectModel(Blog.name) readonly blogModel: Model<BlogDocument>,
    @InjectModel(Topic.name) readonly topicModel: Model<TopicDocument>,
  ) {}

  async addBlog(): Promise<BlogSerializer> {
    try {
      console.warn('immmmm hereeeeeee');

      const blogRes = await this.callDifyWorkflow();
      this.logger.log('Dify blogRes: content', blogRes.content);

      const blog = blogRes.content;
      this.logger.log('Blog type:', typeof blog);
      this.logger.log('Blog content:', blog);

      const createdBlog = await new this.blogModel({
        ...blogRes,
        created_by: '123',
      }).save();

      // Update the corresponding topic's is_assigned to true
      if (blogRes.topicid) {
        this.logger.log('Updating topic with ID:', blogRes.topicid);

        const updateResult = await this.topicModel.updateOne(
          { _id: blogRes.topicid },
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
    const url = `${process.env.DIFY_API_URL}/workflows/run`;
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
      this.logger.log('Dify response:', response.data);
      return response.data.data.outputs.text;
    } catch (error) {
      throw new Error(`Dify workflow call failed: ${error.message}`);
    }
  }
}
