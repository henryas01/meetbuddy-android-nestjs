import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';

// 👉 Swagger imports
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { WsAdapter } from '@nestjs/platform-ws';
import * as fs from 'fs';
import * as path from 'path';
// import { MediasoupService } from './mediasoup/mediasoup.service';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../192.168.1.183+1-key.pem')), // Adjust path as necessary
    cert: fs.readFileSync(path.join(__dirname, '../192.168.1.183+1.pem')), // Adjust path as necessary
  };

  // console.log('ddd', path.join(__dirname, '../192.168.1.183+1-key.pem'));

  const app = await NestFactory.create(AppModule, {
    // httpsOptions,
  });
  // const app = await NestFactory.create(AppModule);

  // Mediasoup
  app.useWebSocketAdapter(new WsAdapter(app));

  // const mediasoup = app.get(MediasoupService);
  // await mediasoup.init();

  // Enable CORS
  app.enableCors({
    origin: '*', // TODO : 🔒 Change in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global serialization
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // wagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MeetBuddy Rest API')
    .setDescription('API documentation from MeetBuddy')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'MeetBuddy API Docs',
  });

  // Start server
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  Logger.log(`🚀 Server running at http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(
    `📚 Swagger docs at http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap();
