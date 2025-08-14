import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';

import { Topic, TopicDocument } from '../models/topic.schema';
import { TopicSerializer } from '../serilizations/TopicSerializer';
import { DifyTopic } from '../types/topic.type';

@Injectable()
export class TopicsService implements OnModuleDestroy {
  private useModel: any = null;
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel('Topic') public readonly topicModel: Model<TopicDocument>,
  ) {
    this.validateEnvironment();
  }

  onModuleDestroy(): void {
    // Clean up TensorFlow model on module destruction
    if (this.useModel) {
      this.useModel.dispose?.();
      this.useModel = null;
    }
  }

  private validateEnvironment() {
    if (!process.env.DIFY_API_KEY_topic_generator) {
      throw new Error(
        'DIFY_API_KEY_topic_generator environment variable is required',
      );
    }
  }

  private async getModel() {
    if (!this.useModel) {
      this.logger.log('🤖 Loading TensorFlow Universal Sentence Encoder...');
      this.useModel = await use.load();
      this.logger.log('✅ Model loaded successfully');
    }
    return this.useModel;
  }

  // Add this similarity function to your service class
  async isSimilar(
    text1: string,
    text2: string,
    threshold = 0.5,
  ): Promise<boolean> {
    const clean = (txt: any) => (typeof txt === 'string' ? txt.trim() : '');
    text1 = clean(text1);
    text2 = clean(text2);

    // Skip if either text is empty after cleaning
    if (!text1 || !text2) {
      this.logger.warn(
        `⚠️ One or both texts are empty. Skipping similarity check.`,
      );
      return false;
    }

    try {
      // Load the USE model (cached)
      const model = await this.getModel();

      // Use tf.tidy to automatically dispose of intermediate tensors
      // First, get the embeddings outside tf.tidy
      const embeddings = await model.embed([text1, text2]);

      // Then, compute similarity inside tf.tidy
      const cosineSim = tf.tidy(() => {
        const emb1 = embeddings.slice([0, 0], [1, -1]);
        const emb2 = embeddings.slice([1, 0], [1, -1]);

        const similarity = tf.losses
          .cosineDistance(emb1, emb2, 1)
          .dataSync()[0];
        return 1 - similarity;
      });

      this.logger.log(
        `🔍 Similarity between "${text1}" and "${text2}": ${cosineSim.toFixed(3)}`,
      );

      return cosineSim >= threshold;
    } catch (error) {
      this.logger.error(`Error computing similarity: ${error.message}`);
      return false;
    }
  }

  // Check if newTopic is similar to any existing topics
  async checkTopicSimilarity(
    newTopic: Topic,
    existingTopics: string[],
    threshold = 0.65,
  ): Promise<boolean> {
    const newText = newTopic?.topic;
    if (!newText || typeof newText !== 'string') {
      this.logger.warn('⚠️ Invalid new topic text. Skipping similarity check.');
      return false;
    }

    for (const existingText of existingTopics) {
      if (!existingText || typeof existingText !== 'string') {
        this.logger.warn(
          '⚠️ Invalid existing topic text. Skipping this comparison.',
        );
        continue;
      }

      const isSimilarTopic = await this.isSimilar(
        newText,
        existingText,
        threshold,
      );
      if (isSimilarTopic) {
        this.logger.log(
          `🚫 Similar topic found! Skipping: "${newText}" (similar to existing: "${existingText}")`,
        );
        return true;
      }
    }

    return false;
  }

  // Main method to add topics
  async addTopics(): Promise<TopicSerializer[]> {
    try {
      const TARGET_COUNT = 10;
      const MAX_FETCH_ATTEMPTS = 5;
      let totalAdded = 0;
      let fetchAttempts = 0;
      const savedTopics: Topic[] = [];
      let skippedCount = 0;

      while (totalAdded < TARGET_COUNT && fetchAttempts < MAX_FETCH_ATTEMPTS) {
        fetchAttempts++;
        const difytopics = await this.callDifyWorkflow();
        this.logger.log(`Dify response received (attempt ${fetchAttempts})`);

        if (!Array.isArray(difytopics)) {
          throw new Error(
            'Expected array of topics from Dify, but received different format',
          );
        }

        this.logger.log(
          `🚀 Processing ${difytopics.length} topics from Dify...`,
        );

        // Pre-load the model for performance
        await this.getModel();

        for (const [index, topic] of difytopics.entries()) {
          if (totalAdded >= TARGET_COUNT) break;

          // Validate topic text presence
          if (!topic?.topic || typeof topic.topic !== 'string') {
            this.logger.warn(
              `⚠️ Skipping invalid topic at index ${index + 1}: Missing or invalid "topic" field.`,
            );
            skippedCount++;
            continue;
          }

          const topicWithDefaults = {
            ...topic,
            created_by: '123', // Replace with actual user ID
            is_assigned: false,
            isApproved: false,
          };

          // Fetch existing topics by domain directly from database (no HTTP call)
          const existingTopicsData = await this.getFilteredTopicsByDomain(
            topic.domain,
          );
          const existingTopics = existingTopicsData.map((t) => t.topic);

          this.logger.log(
            `🌐 Found ${existingTopics.length} existing topics in domain "${topic.domain}"`,
          );

          // Check for similarity with existing topics
          if (existingTopics.length > 0) {
            this.logger.log(
              `🔍 Checking similarity for topic ${index + 1}: "${topic.topic}"`,
            );
            const isSimilar = await this.checkTopicSimilarity(
              topicWithDefaults,
              existingTopics,
            );

            if (isSimilar) {
              skippedCount++;
              this.logger.log(
                `⏭️  Skipped topic ${index + 1}/${difytopics.length} due to similarity`,
              );
              continue; // Skip this topic
            }
          }

          // If no similar topics found, proceed with insertion
          try {
            const saved = await this.topicModel.create(topicWithDefaults);
            this.logger.log(
              `✅ Inserted topic ${index + 1}/${difytopics.length}: ${saved.topic}`,
            );
            savedTopics.push(saved);
            totalAdded++;
          } catch (insertErr) {
            this.logger.error(
              `❌ Failed to insert topic ${index + 1}: ${insertErr.message}`,
            );
          }
        }
      }

      if (totalAdded < TARGET_COUNT) {
        this.logger.warn(
          `⚠️ Only ${totalAdded} unique topics were added after ${fetchAttempts} fetch attempts.`,
        );
      }

      this.logger.log(
        `🎯 Results: ${savedTopics.length} inserted, ${skippedCount} skipped due to similarity or invalid data, ${totalAdded - savedTopics.length} failed to insert`,
      );

      return savedTopics.map((topic) =>
        plainToInstance(TopicSerializer, topic, {
          excludeExtraneousValues: true,
        }),
      );
    } catch (error) {
      this.logger.error('❌ Error in addTopics:', error);
      throw new HttpException(
        `Failed to add topics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async callDifyWorkflow(): Promise<DifyTopic[]> {
    const url = `${process.env.DIFY_API_URL}/workflows/run`;
    const apiKey = process.env.DIFY_API_KEY_topic_generator;

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
      const difytopicsString: string = response.data.data.outputs.text;

      return JSON.parse(difytopicsString) as DifyTopic[];
    } catch (error) {
      this.logger.error(`Dify workflow call failed: ${error.message}`);
      throw new HttpException(
        `Dify workflow call failed: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getFilteredTopicsByDomain(domain?: string): Promise<TopicSerializer[]> {
    try {
      const filteredTopics = await this.topicModel.find({ domain }).lean();
      return plainToInstance(TopicSerializer, filteredTopics, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch topics by domain: ${error.message}`);
      throw new HttpException(
        'Failed to fetch topics by domain',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUnassignedTopics(): Promise<string[]> {
    try {
      const topics = await this.topicModel
        .find({ is_assigned: false }, { topic: 0, _id: 1 })
        .lean();

      return topics.map((topic) => topic._id.toString());
    } catch (error) {
      this.logger.error(`Failed to fetch unassigned topics: ${error.message}`);
      throw new HttpException(
        'Failed to fetch unassigned topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTopicById(id: string): Promise<TopicSerializer> {
    try {
      const topic = await this.topicModel.findById(id).lean();
      if (!topic) {
        throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
      }
      return plainToInstance(TopicSerializer, topic, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error('Failed to fetch topic:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch topic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllTopicTitles(): Promise<string[]> {
    try {
      const topics = await this.topicModel
        .find({}, { topic: 1, _id: 0 })
        .lean();

      return topics.map((topic) => topic.topic).filter(Boolean);
    } catch (error) {
      this.logger.error('Failed to fetch topics:', error.message);
      throw new HttpException(
        'Failed to fetch topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
