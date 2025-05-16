import type { Message } from "@/app/services/chat";
import TokenService, { ChatMessage } from "@/utils/TokenService";

/**
 * @deprecated Use TokenService directly instead. This file is maintained for backward compatibility.
 */

// Re-export the ChatMessage type from TokenService
export type { ChatMessage };

// Convert app Message format to ChatMessage format (delegated to TokenService)
export function convertToChatMessage(message: Message): ChatMessage {
  return TokenService.convertToChatMessage(message);
}

export async function countTokens(message: ChatMessage): Promise<number> {
  return TokenService.countTokens(message);
}

export async function trimMessagesToTokenLimit(
  messages: Message[],
  maxTokens: number = 4000,
  reservedTokensForResponse: number = 500,
): Promise<ChatMessage[]> {
  return TokenService.trimMessagesToTokenLimit(
    messages,
    maxTokens,
    reservedTokensForResponse,
  );
}
