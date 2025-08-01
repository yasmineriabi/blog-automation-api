import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsService } from './services/topics.service';
import { TopicsController } from './controllers/topics.controller';
import { MONGOOSE_MODELS } from '../../databases';

@Module({
  imports: [MongooseModule.forFeature(MONGOOSE_MODELS)],
  providers: [TopicsService],
  controllers: [TopicsController],
  exports: [TopicsService],
})
export class TopicsModule {} 