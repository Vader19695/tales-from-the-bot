/**
 * Shared types used across generation scripts.
 */

export interface LLMProvider {
  /** Human-readable model name recorded in story frontmatter. */
  readonly modelName: string;

  /**
   * Send a prompt and return the generated text.
   * Implementations should throw on failure.
   */
  generate(prompt: string): Promise<string>;
}
