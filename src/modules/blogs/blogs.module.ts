import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGOOSE_MODELS } from 'src/databases';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

import { TopicsService } from '../topics/services/topics.service';
import { TopicsModule } from '../topics/topics.module';

import { BlogsController } from './controllers/blogs.controller';
import { BlogsService } from './services/blogs.service';

@Module({
  imports: [MongooseModule.forFeature(MONGOOSE_MODELS), TopicsModule],
  providers: [BlogsService, TopicsService, RolesGuard],
  controllers: [BlogsController],
  exports: [BlogsService, BlogsModule],
})
export class BlogsModule {}
