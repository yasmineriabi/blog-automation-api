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

  async addBlog(): Promise<BlogSerializer[]> {
    try {
      console.warn('immmmm hereeeeeee');

      const blogRes = await this.callDifyWorkflow();
      this.logger.log('Dify blogRes received');

      // Parse the JSON string to get the array of blogs
      const blogsArray = JSON.parse(blogRes.data.outputs.text);

      if (!Array.isArray(blogsArray)) {
        throw new Error(
          'Expected array of blogs from Dify, but received different format',
        );
      }

      this.logger.log(`Processing ${blogsArray.length} blogs from Dify...`);

      const savedBlogs: Blog[] = [];

      for (const blogData of blogsArray) {
        // Create and save each blog
        const createdBlog = await new this.blogModel({
          ...blogData,
          created_by: '123', // Replace with actual user ID
        }).save();

        // Update the corresponding topic's is_assigned to true
        if (blogData.topicid) {
          this.logger.log('Updating topic with ID:', blogData.topicid);

          const updateResult = await this.topicModel.updateOne(
            { _id: blogData.topicid },
            { is_assigned: true },
          );

          this.logger.log('Topic update result:', updateResult);
        }

        savedBlogs.push(createdBlog);
      }

      // Return all saved blogs
      return savedBlogs.map((blog) =>
        plainToInstance(BlogSerializer, blog, {
          excludeExtraneousValues: true,
        }),
      );
    } catch (error) {
      console.error('Error in addBlog:', error);
      throw new Error(`Failed to add blogs: ${error.message}`);
    }
  }

  async callDifyWorkflow(): Promise<any> {
    const url = `${process.env.DIFY_API_URL}/workflows/run`;
    const apiKey = process.env.DIFY_API_KEY_blog_generator;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Fetch up to 10 unassigned topics from the database
    const unassignedTopics = await this.topicModel
      .find({ is_assigned: false }, { _id: 1, topic: 1 })
      .limit(10)
      .lean();
    const topicInputs = unassignedTopics.map((t) => ({
      topicid: t._id.toString(),
      topic: t.topic,
    }));

    const data = {
      inputs: {
        topics: JSON.stringify(topicInputs),
      },
      response_mode: 'blocking',
      user: 'abc-123',
    };

    try {
      const response = await axios.post(url, data, { headers });
      this.logger.log('Dify response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Dify workflow call failed: ${error.message}`);
    }
  }
}
