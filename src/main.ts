import mongoose from 'mongoose';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

mongoose.set('debug', true);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Wait for the Mongoose connection to be ready
  const connection = app.get<Connection>(getConnectionToken());
  connection.once('open', () => {
    console.log('✅ Connected to MongoDB!');
  });
  connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  await app.listen(3000);
}
bootstrap();