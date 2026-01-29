import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateAiDto } from './dto/generate-ai.dto';
import { GenerateAiResponseDto } from './dto/generate-ai-response.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate text using Phi-4-mini (Ollama)',
    description: 'Endpoint sederhana untuk generate output dari LLM',
  })
  @ApiBody({ type: GenerateAiDto })
  @ApiResponse({
    status: 200,
    description: 'LLM response',
    type: GenerateAiResponseDto,
  })
  async generate(@Body() body: GenerateAiDto): Promise<GenerateAiResponseDto> {
    return this.aiService.generate(body.prompt);
  }
}
