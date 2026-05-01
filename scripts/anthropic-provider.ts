/**
 * Anthropic LLM provider implementation.
 *
 * Shared by generate-prompt.ts and generate-story.ts so neither script
 * needs to import the other.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required at runtime
 */

import type { LLMProvider } from './types.js';

export class AnthropicProvider implements LLMProvider {
  readonly modelName: string;
  private client: import('@anthropic-ai/sdk').Anthropic;

  /**
   * @param modelName Anthropic model to use. Defaults to `claude-sonnet-4-5`.
   *   - generate-prompt.ts overrides this with `claude-haiku-4-5` (cheap, short JSON output).
   *   - generate-story.ts uses `claude-sonnet-4-5` (higher quality prose).
   */
  constructor(modelName = 'claude-sonnet-4-5') {
    this.modelName = modelName;
  }

  async generate(prompt: string): Promise<string> {
    // Lazy-load so the module can be imported without the SDK installed.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    if (!this.client) {
      // @ts-expect-error — client is assigned lazily
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    const message = await (this.client as import('@anthropic-ai/sdk').Anthropic).messages.create({
      model: this.modelName,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error(`Unexpected content block type: ${block.type}`);
    }
    return block.text.trim();
  }
}
