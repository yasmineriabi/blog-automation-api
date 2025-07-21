import mongoose from 'mongoose';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

mongoose.set('debug', true);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.use(
    express.json({
      limit: '5mb',
      verify: (req, res, buf) => {
        req['rawBody'] = buf;
      },
    }),
  );
  // Wait for the Mongoose connection to be ready
  const connection = app.get<Connection>(getConnectionToken());
  connection.once('open', () => {
    console.log('✅ Connected to MongoDB!');
  });
  connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  await app.listen(3000); // Already set to port 3000
}
bootstrap();