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

const STORAGE_KEY = "emailWhisperer_chatHistory";

// Initialize localforage
localforage.config({
  name: "Email Whisperer",
  storeName: "chat_histories",
  description: "Stores chat histories for Email Whisperer",
});

// LocalStorage fallback has been removed

export const ChatService = {
  // Get all chat histories
  getAllChatHistories: async (): Promise<ChatHistory[]> => {
    try {
      const data = await localforage.getItem<ChatHistory[]>(STORAGE_KEY);
      return data || [];
    } catch (error) {
      console.error("Error fetching chat histories from localForage:", error);
      return [];
    }
  },

  // Create new chat history
  createChatHistory: async (): Promise<ChatHistory> => {
    const newChat: ChatHistory = {
      id: `chat_${Date.now()}`,
      title: `New Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const existingChats = await ChatService.getAllChatHistories();
      const updatedChats = [newChat, ...existingChats];

      await localforage.setItem(STORAGE_KEY, updatedChats);
      return newChat;
    } catch (error) {
      console.error("Error creating chat history in localForage:", error);
      throw error;
    }
  },

  // Get chat by ID
  getChatById: async (chatId: string): Promise<ChatHistory | undefined> => {
    try {
      const chats = await ChatService.getAllChatHistories();
      return chats.find((chat) => chat.id === chatId);
    } catch (error) {
      console.error(`Error fetching chat with ID ${chatId}:`, error);
      return undefined;
    }
  },

  // Add message to chat
  addMessageToChat: async (
    chatId: string,
    content: string,
    isUser: boolean,
  ): Promise<ChatHistory | undefined> => {
    try {
      const chats = await ChatService.getAllChatHistories();
      const chatIndex = chats.findIndex((chat) => chat.id === chatId);

      if (chatIndex === -1) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        content,
        isUser,
        timestamp: Date.now(),
      };

      if (chats?.length && chats[chatIndex]) {
        const updatedChat = {
          ...chats[chatIndex],
          messages: [...chats[chatIndex].messages, newMessage],
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

        chats[chatIndex] = updatedChat;

        try {
          await localforage.setItem(STORAGE_KEY, chats);
        } catch (storageError) {
          console.error(`Error saving to localForage:`, storageError);
          throw storageError;
        }

        return updatedChat;
      }
    } catch (error) {
      console.error(`Error adding message to chat ${chatId}:`, error);
      throw error;
    }
  },

  // Delete chat history
  deleteChatHistory: async (chatId: string): Promise<void> => {
    try {
      const chats = await ChatService.getAllChatHistories();
      const filteredChats = chats.filter((chat) => chat.id !== chatId);

      try {
        await localforage.setItem(STORAGE_KEY, filteredChats);
      } catch (storageError) {
        console.error(`Error saving to localForage:`, storageError);
        throw storageError;
      }
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      throw error;
    }
  },

  deleteAllChatHistories: async (): Promise<void> => {
    try {
      await localforage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(`Error deleting all chats:`, error);
      throw error;
    }
  },
};
