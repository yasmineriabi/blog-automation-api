import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { BlogSerializer } from '../serilizations/BlogSerializer';
import { Blog } from '../models/blog.schema';
import { Topic } from '../../topics/models/topic.schema';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel('Blog') public readonly blogModel: Model<Blog>,
    @InjectModel('Topic') public readonly topicModel: Model<Topic>
  ) {}

  async addBlog(): Promise<BlogSerializer> {
    try {
      const response = await this.callDifyWorkflow();
      console.log('Dify response:', response);
      
      const blog = response.data.outputs.text;
      console.log('Blog type:', typeof blog);
      console.log('Blog content:', blog);

      let jsonBlog;
      
      // Check if blog is already an object or a string
      if (typeof blog === 'object' && blog !== null) {
        // It's already an object - use directly
        jsonBlog = blog;
        console.log('Using blog as object directly');
      } else if (typeof blog === 'string') {
        // It's a string - parse it
        try {
          jsonBlog = JSON.parse(blog);
        } catch (parseError) {
          console.log('JSON parse failed, trying to clean...');
          const cleanedBlog = blog.replace(/\\n/g, ' ').replace(/\n/g, ' ');
          jsonBlog = JSON.parse(cleanedBlog);
        }
      } else {
        throw new Error(`Unexpected blog type: ${typeof blog}`);
      }

      console.log('Final jsonBlog:', jsonBlog);

      const createdBlog = await new this.blogModel({ 
        ...jsonBlog, 
        created_by: '123' 
      }).save();

      // Update the corresponding topic's is_assigned to true
      if (jsonBlog.topicid) {
        console.log('Updating topic with ID:', jsonBlog.topicid);
        
        const updateResult = await this.topicModel.updateOne(
          { _id: jsonBlog.topicid },
          { is_assigned: true }
        );
        
        console.log('Topic update result:', updateResult);
        console.log('Topic updated successfully');
      } else {
        console.log('No topicid found, skipping topic update');
      }

      return plainToInstance(BlogSerializer, createdBlog, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error in addBlog:', error);
      throw new Error(`Failed to add blog: ${error.message}`);
    }
  }

  async callDifyWorkflow() {
    const url = 'http://192.168.0.181/v1/workflows/run';
    const apiKey = process.env.DIFY_API_KEY_blog_generator;

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      inputs: {},
      response_mode: 'blocking',
      user: 'abc-123',
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`Dify workflow call failed: ${error.message}`);
    }
  }
}