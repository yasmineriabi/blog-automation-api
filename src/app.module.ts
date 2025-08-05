import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './modules/auth/auth.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { TopicsModule } from './modules/topics/topics.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/blog-automation',
    ),
    AuthModule,
    TopicsModule,
    BlogsModule,
  ],
})
export class AppModule {}
