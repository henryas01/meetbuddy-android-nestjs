import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MeetingModule } from './meeting/meeting.module';
import { ChatModule } from './chat/chat.module';
import { LiveKitModule } from './livekit/livekit.module';
import { MailModule } from './mail/mail.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST as string,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER as string,
      password: process.env.DB_PASS as string,
      database: process.env.DB_NAME as string,
      // entities: [User],
      autoLoadEntities: true,
      synchronize: true, // ⚠️ only in development
    }),
    AuthModule,
    MeetingModule,
    ChatModule,
    LiveKitModule,
    MailModule,
    AiModule,
  ],
})
export class AppModule {}
