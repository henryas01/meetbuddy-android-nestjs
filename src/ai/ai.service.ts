import { Injectable } from '@nestjs/common';
import { OllamaClient } from './ollama.client';

@Injectable()
export class AiService {
  constructor(private readonly ollama: OllamaClient) {}

  async generate(prompt: string) {
    const result = await this.ollama.generate(prompt);

    return {
      output: result.response,
    };
  }
}
