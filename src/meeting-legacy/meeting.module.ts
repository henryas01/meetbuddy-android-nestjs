import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { MeetingService } from './meeting.service';
import { MediasoupModule } from '../mediasoup/mediasoup.module';

@Module({
  imports: [MediasoupModule],
  providers: [MeetingGateway, MeetingService],
})
export class MeetingModule {}
