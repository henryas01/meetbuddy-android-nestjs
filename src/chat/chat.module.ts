import { Module } from '@nestjs/common';
import { MeetingGateway } from './chat.gateway';

@Module({
  providers: [MeetingGateway],
})
export class ChatModule {}
