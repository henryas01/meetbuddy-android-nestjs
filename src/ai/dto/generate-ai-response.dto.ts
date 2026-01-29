import { ApiProperty } from '@nestjs/swagger';

export class GenerateAiResponseDto {
  @ApiProperty({
    example: 'Meeting membahas roadmap Q1 dan deadline tim.',
  })
  output: string;
}
