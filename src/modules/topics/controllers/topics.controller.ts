import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { TopicsService } from '../services/topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post('add-topic')
  async addTopic() {
    try {
      return this.topicsService.addTopic();
    } catch (error) {
      throw new Error(`Failed to add topic: ${error.message}`);
    }
  }

  @Get('filter')
  async getTopicsByDomain(@Query('domain') domain?: string): Promise<string[]> {
    const topics = await this.topicsService.getFilteredTopicsByDomain(domain);
    return topics.map((t) => t.topic);
  }

  @Get('unassigned')
  async getUnassignedTopics(): Promise<string | null> {
    const topics = await this.topicsService.getUnassignedTopics();
    return topics.length > 0 ? (topics[0] as any)._id.toString() : null;
  }

  @Get('by-id')
  async getTopicById(@Query('id') id: string): Promise<string> {
    const topic = await this.topicsService.getTopicById(id);
    return topic.topic;
  }
} 