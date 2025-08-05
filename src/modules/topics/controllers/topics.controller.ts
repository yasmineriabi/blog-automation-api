import {
  Controller,
  Post,
  Query,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { TopicSerializer } from '../serilizations/TopicSerializer';
import { TopicsService } from '../services/topics.service';

@Controller('topics')
export class TopicsController {
  private readonly logger = new Logger(TopicsController.name);

  constructor(private readonly topicsService: TopicsService) {}

  @Post('add-topic')
  async addTopic(): Promise<TopicSerializer[]> {
    try {
      return await this.topicsService.addTopics();
    } catch (error) {
      this.logger.error(`Failed to add topics: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to add topics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filter')
  async getTopicsByDomain(@Query('domain') domain?: string): Promise<string[]> {
    try {
      const topics = await this.topicsService.getFilteredTopicsByDomain(domain);
      return topics.map((t) => t.topic).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to get topics by domain: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get topics by domain',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unassigned')
  async getUnassignedTopics(): Promise<string | null> {
    try {
      const topics = await this.topicsService.getUnassignedTopics();
      return topics[0];
    } catch (error) {
      this.logger.error(`Failed to get unassigned topics: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get unassigned topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-id')
  async getTopicById(@Query('id') id: string): Promise<string> {
    if (!id) {
      throw new HttpException(
        'ID parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const topic = await this.topicsService.getTopicById(id);
      return topic.topic;
    } catch (error) {
      this.logger.error(`Failed to get topic by ID: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get topic by ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  async getAllTopics(): Promise<string[]> {
    try {
      return await this.topicsService.getAllTopicTitles();
    } catch (error) {
      this.logger.error(`Failed to get all topics: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get all topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
