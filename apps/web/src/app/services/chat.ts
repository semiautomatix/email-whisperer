import localforage from "localforage";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// For the index, we don't need the full message history
export interface ChatMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview?: string;
}

const STORAGE_KEY = "emailWhisperer";

// Helper functions to get user-specific storage keys
const getChatIndexKey = (userId: string): string => {
  return `${STORAGE_KEY}_${userId}_index`;
};

const getChatKey = (userId: string, chatId: string): string => {
  return `${STORAGE_KEY}_${userId}_chat_${chatId}`;
};

// Initialize localforage
localforage.config({
  name: "Email Whisperer",
  storeName: "chat_histories",
  description: "Stores chat histories for Email Whisperer",
});

export const ChatService = {
  // Get all chat metadata for a specific user (without full message history)
  getAllChatHistories: async (userId: string): Promise<ChatHistory[]> => {
    if (!userId) {
      console.error("No userId provided to getAllChatHistories");
      return [];
    }

    try {
      // Get the metadata index
      const chatIndex =
        (await localforage.getItem<ChatMetadata[]>(getChatIndexKey(userId))) ||
        [];

      // Load all full chat histories
      const chatPromises = chatIndex.map((metadata) =>
        ChatService.getChatById(userId, metadata.id),
      );

      const chats = await Promise.all(chatPromises);
      // Filter out any undefined chats (in case loading failed for some)
      return chats.filter((chat): chat is ChatHistory => chat !== undefined);
    } catch (error) {
      console.error("Error fetching chat histories from localForage:", error);
      return [];
    }
  },

  // Get metadata only (for showing chat list without loading all messages)
  getChatMetadata: async (userId: string): Promise<ChatMetadata[]> => {
    if (!userId) {
      console.error("No userId provided to getChatMetadata");
      return [];
    }

    try {
      return (
        (await localforage.getItem<ChatMetadata[]>(getChatIndexKey(userId))) ||
        []
      );
    } catch (error) {
      console.error("Error fetching chat metadata from localForage:", error);
      return [];
    }
  },

  // Create new chat history for a specific user
  createChatHistory: async (userId: string): Promise<ChatHistory> => {
    if (!userId) {
      throw new Error("No userId provided to createChatHistory");
    }

    const chatId = `chat_${Date.now()}`;
    const newChat: ChatHistory = {
      id: chatId,
      title: `New Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      // Create chat metadata for the index
      const newChatMetadata: ChatMetadata = {
        id: chatId,
        title: newChat.title,
        createdAt: newChat.createdAt,
        updatedAt: newChat.updatedAt,
        messageCount: 0,
      };

      // Get existing metadata index
      const existingMetadata = await ChatService.getChatMetadata(userId);
      const updatedMetadata = [newChatMetadata, ...existingMetadata];

      // Save both the metadata index and the new chat
      await Promise.all([
        localforage.setItem(getChatIndexKey(userId), updatedMetadata),
        localforage.setItem(getChatKey(userId, chatId), newChat),
      ]);

      return newChat;
    } catch (error) {
      console.error("Error creating chat history in localForage:", error);
      throw error;
    }
  },

  // Get chat by ID for a specific user
  getChatById: async (
    userId: string,
    chatId: string,
  ): Promise<ChatHistory | undefined> => {
    if (!userId) {
      console.error("No userId provided to getChatById");
      return undefined;
    }

    try {
      return (
        (await localforage.getItem<ChatHistory>(getChatKey(userId, chatId))) ??
        undefined
      );
    } catch (error) {
      console.error(`Error fetching chat with ID ${chatId}:`, error);
      return undefined;
    }
  },

  // Add message to chat for a specific user
  addMessageToChat: async (
    userId: string,
    chatId: string,
    content: string,
    isUser: boolean,
  ): Promise<ChatHistory | undefined> => {
    if (!userId) {
      throw new Error("No userId provided to addMessageToChat");
    }

    try {
      // Get the existing chat
      const chat = await ChatService.getChatById(userId, chatId);

      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        content,
        isUser,
        timestamp: Date.now(),
      };

      // Update the chat with the new message
      const updatedChat: ChatHistory = {
        ...chat,
        messages: [...chat.messages, newMessage],
        updatedAt: Date.now(),
      };

      // Update the title based on first user message if it's still the default title
      if (
        isUser &&
        updatedChat.title?.startsWith("New Chat") &&
        updatedChat.messages.filter((m) => m.isUser).length === 1
      ) {
        updatedChat.title =
          content.slice(0, 30) + (content.length > 30 ? "..." : "");
      }

      // Get the metadata index to update
      // Update the metadata for this chat
      const metadataIndex = await ChatService.getChatMetadata(userId);
      const metadataItemIndex = metadataIndex.findIndex(
        (item) => item.id === chatId,
      );

      if (metadataItemIndex !== -1) {
        // Update the metadata for this chat
        const updatedMetadata = [...metadataIndex];
        const updatedMetadataItem: ChatMetadata = {
          id: chatId,
          title: updatedChat.title,
          createdAt: updatedChat.createdAt,
          updatedAt: updatedChat.updatedAt,
          messageCount: updatedChat.messages.length,
          lastMessagePreview:
            content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        };
        updatedMetadata[metadataItemIndex] = updatedMetadataItem;

        // Save both the updated chat and metadata index
        await Promise.all([
          localforage.setItem(getChatKey(userId, chatId), updatedChat),
          localforage.setItem(getChatIndexKey(userId), updatedMetadata),
        ]);
      } else {
        // Just save the chat if metadata is not found
        await localforage.setItem(getChatKey(userId, chatId), updatedChat);
      }

      return updatedChat;
    } catch (error) {
      console.error(`Error adding message to chat ${chatId}:`, error);
      throw error;
    }
  },

  // Delete chat history for a specific user
  deleteChatHistory: async (userId: string, chatId: string): Promise<void> => {
    if (!userId) {
      throw new Error("No userId provided to deleteChatHistory");
    }

    try {
      // Get the metadata index
      const metadataIndex = await ChatService.getChatMetadata(userId);
      const updatedMetadata = metadataIndex.filter(
        (item) => item.id !== chatId,
      );

      // Delete the chat and update the index
      await Promise.all([
        localforage.removeItem(getChatKey(userId, chatId)),
        localforage.setItem(getChatIndexKey(userId), updatedMetadata),
      ]);
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      throw error;
    }
  },

  deleteAllChatHistories: async (userId: string): Promise<void> => {
    if (!userId) {
      throw new Error("No userId provided to deleteAllChatHistories");
    }

    try {
      // Get all chat metadata to find all chat keys
      const metadataIndex = await ChatService.getChatMetadata(userId);

      // Create an array of promises to remove each chat
      const deletionPromises = metadataIndex.map((metadata) =>
        localforage.removeItem(getChatKey(userId, metadata.id)),
      );

      // Add a promise to clear the metadata index
      deletionPromises.push(localforage.removeItem(getChatIndexKey(userId)));

      // Execute all deletions in parallel
      await Promise.all(deletionPromises);
    } catch (error) {
      console.error(`Error deleting all chats:`, error);
      throw error;
    }
  },
};
