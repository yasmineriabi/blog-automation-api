import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MONGOOSE_MODELS } from '../../databases';

import { TopicsController } from './controllers/topics.controller';
import { TopicsService } from './services/topics.service';

@Module({
  imports: [MongooseModule.forFeature(MONGOOSE_MODELS)],
  providers: [TopicsService],
  controllers: [TopicsController],
  exports: [TopicsService, TopicsModule],
})
export class TopicsModule {}
