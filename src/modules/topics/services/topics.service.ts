import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { TopicSerializer } from '../serilizations/TopicSerializer';
import { Topic } from '../models/topic.schema';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class TopicsService {
  constructor(@InjectModel('Topic') public readonly topicModel: Model<Topic>) {}

  async addTopic(): Promise<TopicSerializer> {
    try {
      const response = await this.callDifyWorkflow();
      console.log('Dify response:', response); // <--- Add this line
      const topic = response.data.outputs.text;
      const jsonTopic = JSON.parse(topic);
      const createdTopic = await new this.topicModel({ ...jsonTopic, created_by: '123' }).save();
      return plainToInstance(TopicSerializer, createdTopic, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new Error(`Failed to add topic: ${error.message}`);
    }
    
  }

  async callDifyWorkflow() {
    const url = 'http://192.168.0.181/v1/workflows/run';
    const apiKey = process.env.DIFY_API_KEY_topic_generator;

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
      // Handle error as needed
      throw new Error(`Dify workflow call failed: ${error.message}`);
    }
  }

    async getFilteredTopicsByDomain(domain?: string): Promise<Topic[]> {
    const filter: any = {};
    if (domain) {
      filter.domain = { $regex: domain, $options: 'i' };
    }
    return this.topicModel.find(filter).exec();
  }

  async getUnassignedTopics(): Promise<Topic[]> {
    return this.topicModel.find({ is_assigned: false }).exec();
  }

  async getTopicById(id: string): Promise<Topic> {
    const topic = await this.topicModel.findById(id).exec();
    if (!topic) {
      throw new Error('Topic not found');
    }
    return topic;
  }
} 