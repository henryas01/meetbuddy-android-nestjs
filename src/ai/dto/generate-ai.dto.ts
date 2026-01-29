import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateAiDto {
  @ApiProperty({
    example: 'Summarize meeting hari ini',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
