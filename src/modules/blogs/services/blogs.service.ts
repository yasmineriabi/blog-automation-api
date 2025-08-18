import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';

import { Topic, TopicDocument } from '../../topics/models/topic.schema';
import { Blog, BlogDocument } from '../models/blog.schema';
import { BlogSerializer } from '../serilizations/BlogSerializer';
import { DifyBlog, DifyBlogResponse } from '../types/blog.type';

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    @InjectModel(Blog.name) readonly blogModel: Model<BlogDocument>,
    @InjectModel(Topic.name) readonly topicModel: Model<TopicDocument>,
  ) {}

  async addBlog(): Promise<BlogSerializer[] | { message: string }> {
    try {
      console.warn('immmmm hereeeeeee');

      const blogRes = await this.callDifyWorkflow();
      this.logger.log('Dify blogRes received');

      // Check if it's a message response (no topics available)
      if ('message' in blogRes) {
        return blogRes;
      }

      // Parse the JSON string to get the array of blogs
      const blogsArray: DifyBlog[] = JSON.parse(blogRes.data.outputs.text);

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

  async getPendingBlogs(): Promise<BlogSerializer[]> {
    const blogs = await this.blogModel.find({ status: 'pending' });
    return blogs.map((blog) =>
      plainToInstance(BlogSerializer, blog, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async approveBlog(
    blogId: string,
    username: string,
  ): Promise<{ message: string }> {
    try {
      const blog = await this.blogModel.findById(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }

      if (blog.status !== 'pending') {
        throw new Error('Blog is not in pending status');
      }

      await this.blogModel.findByIdAndUpdate(blogId, {
        status: 'approved',
        approvedby: username,
      });
      return { message: 'Blog approved successfully' };
    } catch (error) {
      throw new Error(`Failed to approve blog: ${error.message}`);
    }
  }

  async rejectBlog(blogId: string): Promise<{ message: string }> {
    try {
      const blog = await this.blogModel.findById(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }
      await this.blogModel.findByIdAndDelete(blogId);
      return { message: 'Blog rejected successfully' };
    } catch (error) {
      throw new Error(`Failed to reject blog: ${error.message}`);
    }
  }

  async getBlogById(blogId: string): Promise<BlogSerializer> {
    try {
      const blog = await this.blogModel.findById(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }
      return plainToInstance(BlogSerializer, blog, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new Error(`Failed to get blog: ${error.message}`);
    }
  }

  async getApprovedBlogsWithDomains(): Promise<any[]> {
    try {
      this.logger.log('Starting getApprovedBlogsWithDomains...');

      // First, let's check what blogs exist
      const allBlogs = await this.blogModel.find({});
      this.logger.log(`Total blogs in database: ${allBlogs.length}`);

      const approvedBlogs = await this.blogModel.find({ status: 'approved' });
      this.logger.log(`Blogs with status 'approved': ${approvedBlogs.length}`);

      if (approvedBlogs.length > 0) {
        this.logger.log(
          'Sample approved blog:',
          JSON.stringify(approvedBlogs[0], null, 2),
        );
      }

      const blogsWithDomains = await this.blogModel.aggregate([
        {
          $match: { status: 'approved' },
        },
        {
          $addFields: {
            topicidObjectId: { $toObjectId: '$topicid' },
          },
        },
        {
          $lookup: {
            from: 'topics', // MongoDB collection name for topics
            localField: 'topicidObjectId',
            foreignField: '_id',
            as: 'topic',
          },
        },
        {
          $unwind: '$topic',
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            status: 1,
            topicid: 1,
            created_by: 1,
            viewcount: 1,
            createdat: 1,
            approvedby: 1,
            domain: '$topic.domain',
            topic: '$topic.topic',
          },
        },
      ]);

      // Debug each stage of the aggregation
      this.logger.log('=== AGGREGATION DEBUG ===');

      // Stage 1: Match approved blogs
      const stage1 = await this.blogModel.aggregate([
        { $match: { status: 'approved' } },
      ]);
      this.logger.log(`Stage 1 (Match): ${stage1.length} blogs found`);
      if (stage1.length > 0) {
        this.logger.log('Stage 1 sample:', JSON.stringify(stage1[0], null, 2));
      }

      // Stage 2: Add ObjectId field
      const stage2 = await this.blogModel.aggregate([
        { $match: { status: 'approved' } },
        { $addFields: { topicidObjectId: { $toObjectId: '$topicid' } } },
      ]);
      this.logger.log(`Stage 2 (Add ObjectId): ${stage2.length} blogs found`);
      if (stage2.length > 0) {
        this.logger.log('Stage 2 sample:', JSON.stringify(stage2[0], null, 2));
      }

      // Stage 3: Lookup topics
      const stage3 = await this.blogModel.aggregate([
        { $match: { status: 'approved' } },
        { $addFields: { topicidObjectId: { $toObjectId: '$topicid' } } },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicidObjectId',
            foreignField: '_id',
            as: 'topic',
          },
        },
      ]);
      this.logger.log(`Stage 3 (Lookup): ${stage3.length} blogs found`);
      if (stage3.length > 0) {
        this.logger.log('Stage 3 sample:', JSON.stringify(stage3[0], null, 2));
      }

      // Check if topics collection exists and has data
      const topicsCount = await this.topicModel.countDocuments();
      this.logger.log(`Total topics in database: ${topicsCount}`);

      if (topicsCount > 0) {
        const sampleTopic = await this.topicModel.findOne();
        this.logger.log('Sample topic:', JSON.stringify(sampleTopic, null, 2));
      }

      this.logger.log('=== END DEBUG ===');

      this.logger.log(`Aggregation result count: ${blogsWithDomains.length}`);
      if (blogsWithDomains.length > 0) {
        this.logger.log(
          'Sample result:',
          JSON.stringify(blogsWithDomains[0], null, 2),
        );
      }

      return blogsWithDomains;
    } catch (error) {
      this.logger.error('Error in getApprovedBlogsWithDomains:', error);
      throw new Error(
        `Failed to get approved blogs with domains: ${error.message}`,
      );
    }
  }

  async callDifyWorkflow(): Promise<DifyBlogResponse | { message: string }> {
    const url = `${process.env.DIFY_API_URL}/workflows/run`;
    const apiKey = process.env.DIFY_API_KEY_blog_generator;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Fetch up to 2 unassigned topics from the database
    const unassignedTopics = await this.topicModel
      .find({ is_assigned: false }, { _id: 1, topic: 1 })
      .limit(2)
      .lean();

    // Check if there are any unassigned topics
    if (unassignedTopics.length === 0) {
      return { message: 'No unassigned topics available for blog generation' };
    }

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
