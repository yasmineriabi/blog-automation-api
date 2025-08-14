import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import * as express from 'express';
import mongoose from 'mongoose';
import { Connection } from 'mongoose';

import { AppModule } from './app.module';

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
    Logger.log('✅ Connected to MongoDB!');
  });
  connection.on('error', (err) => {
    Logger.error('❌ MongoDB connection error:', err);
  });

  await app.listen(3000); // Already set to port 3000
}
void bootstrap().then(() =>
  console.info(`API is running on port ${process.env.PORT || 3000}`),
);
