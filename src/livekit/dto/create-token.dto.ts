import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateLiveKitTokenDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'room-1' })
  @IsString()
  room: string;
}
