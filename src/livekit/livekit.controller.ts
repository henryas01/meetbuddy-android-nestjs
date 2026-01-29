import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LiveKitService } from './livekit.service';
import { CreateLiveKitTokenDto } from './dto/create-token.dto';

@ApiTags('LiveKit')
@Controller('livekit')
export class LiveKitController {
  constructor(private readonly livekit: LiveKitService) {}

  @Post('token')
  async getToken(@Body() dto: CreateLiveKitTokenDto) {
    return {
      token: await this.livekit.createToken(dto.userId, dto.room),
      url: process.env.LIVEKIT_URL,
    };
  }
}
