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

/**
 * Models that accept `output_config.effort` and the server-side refusal
 * `fallbacks` parameter. Older models (e.g. Haiku 4.5) reject them, so they
 * get a plain request.
 */
const MODERN_MODELS = new Set([
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
]);

export class AnthropicProvider implements LLMProvider {
  readonly modelName: string;
  private client: import('@anthropic-ai/sdk').Anthropic;

  /**
   * @param modelName Anthropic model to use. Defaults to `claude-opus-5-5`.
   *   - generate-prompt.ts overrides this with `claude-haiku-4-5` (cheap, short JSON output).
   *   - generate-story.ts uses `claude-opus-5-5` (higher quality prose).
   */
  constructor(modelName = 'claude-opus-5-5') {
    this.modelName = modelName;
  }

  async generate(prompt: string): Promise<string> {
    // Lazy-load so the module can be imported without the SDK installed.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    if (!this.client) {
      // @ts-expect-error — client is assigned lazily
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    const client = this.client as import('@anthropic-ai/sdk').Anthropic;

    // Newer models always think, and thinking counts toward max_tokens, so
    // leave plenty of headroom beyond the story itself.
    const params = {
      model: this.modelName,
      max_tokens: 16000,
      messages: [{ role: 'user' as const, content: prompt }],
    };
    const message = MODERN_MODELS.has(this.modelName)
      ? await client.beta.messages.create({
          ...params,
          output_config: { effort: 'medium' },
          // On a safety-classifier decline, the API reruns the request on a fallback model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })
      : await client.messages.create(params);

    if (message.stop_reason === 'refusal') {
      throw new Error(`Model ${message.model} declined the request (stop_reason: refusal)`);
    }
    if (message.stop_reason === 'max_tokens') {
      throw new Error(`Response hit max_tokens (${params.max_tokens}) before finishing`);
    }

    // Responses can begin with thinking blocks — find the text by type, not position.
    const text = message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('')
      .trim();
    if (!text) {
      throw new Error('Response contained no text content');
    }
    return text;
  }
}
