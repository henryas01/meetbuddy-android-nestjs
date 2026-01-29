import { Injectable } from '@nestjs/common';
import { env } from 'process';

@Injectable()
export class OllamaClient {
  private readonly baseUrl = env.AI_URL;

  async generate(prompt: string) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi4-mini',
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to connect to Ollama');
    }

    return res.json();
  }
}
