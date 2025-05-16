import { Tiktoken } from "@dqbd/tiktoken";
import type { Message } from "@/app/services/chat";

// API-compatible message format for token counting
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Singleton service for token-related operations
 * Provides optimized access to tokenizer with lazy loading and caching
 */
class TokenService {
  private static instance: TokenService;
  private tokenizer: Tiktoken | null = null;
  private tokenizerPromise: Promise<Tiktoken> | null = null;
  private cache: Map<string, number> = new Map();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the TokenService instance
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Get or initialize the tokenizer
   */
  public async getTokenizer(): Promise<Tiktoken> {
    if (this.tokenizer) return this.tokenizer;

    // If we're already loading the tokenizer, return the existing promise
    if (this.tokenizerPromise) return this.tokenizerPromise;

    // Create a new promise to load the tokenizer
    this.tokenizerPromise = (async () => {
      const { encoding_for_model } = await import("@dqbd/tiktoken");
      this.tokenizer = encoding_for_model("gpt-4"); // rough estimate, the model is irrelevant
      return this.tokenizer;
    })();

    return this.tokenizerPromise;
  }

  /**
   * Count tokens in a message with caching
   */
  public async countTokens(message: ChatMessage): Promise<number> {
    // Generate a cache key based on message content and role
    const cacheKey = `${message.role}:${message.content}`;

    // Check if we have a cached result
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const enc = await this.getTokenizer();
    // Count tokens in content plus overhead for message metadata
    const tokenCount = enc.encode(message.content).length + 4; // 4 tokens for role and message formatting

    // Cache the result
    this.cache.set(cacheKey, tokenCount);

    return tokenCount;
  }

  /**
   * Convert app Message format to ChatMessage format
   */
  public convertToChatMessage(message: Message): ChatMessage {
    return {
      role: message.isUser ? "user" : "assistant",
      content: message.content,
    };
  }

  /**
   * Trim messages to fit within a token limit
   */
  public async trimMessagesToTokenLimit(
    messages: Message[],
    maxTokens: number = 4000,
    reservedTokensForResponse: number = 500,
  ): Promise<ChatMessage[]> {
    const allowedTokens = maxTokens - reservedTokensForResponse;
    const reversedMessages = [...messages].reverse();
    const result: ChatMessage[] = [];
    let tokenCount = 0;

    for (const message of reversedMessages) {
      const chatMessage = this.convertToChatMessage(message);
      const messageTokens = await this.countTokens(chatMessage);
      if (tokenCount + messageTokens > allowedTokens) break;

      result.unshift(chatMessage); // Add to front to maintain original order
      tokenCount += messageTokens;
    }

    return result;
  }

  /**
   * Clear the token cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export the singleton instance
export default TokenService.getInstance();
