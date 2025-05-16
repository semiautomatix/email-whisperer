import { useState, useEffect } from "react";
import { ChatHistory, ChatService } from "@/app/services/chat";

export const useChats = () => {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<ChatHistory | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all chat histories once when component mounts
  useEffect(() => {
    const loadChats = async () => {
      setIsLoading(true);
      try {
        const histories = await ChatService.getAllChatHistories();
        setChatHistories(histories);

        // If there's at least one chat, set the newest as active
        if (histories.length > 0 && !activeChatId) {
          const selectedChat = histories[0];
          if (selectedChat) {
            setActiveChat(selectedChat);
            setActiveChatId(selectedChat.id);
          }
        }
      } catch (error) {
        console.error("Error loading chat histories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
    // This effect should only run once on mount
  }, [activeChatId]);

  // Separate effect to handle activeChatId changes
  useEffect(() => {
    // Only fetch the specific chat when activeChatId changes and is not null
    const updateActiveChat = async () => {
      if (!activeChatId) return;

      try {
        const selectedChat = await ChatService.getChatById(activeChatId);
        setActiveChat(selectedChat || null);
      } catch (error) {
        console.error(`Error selecting chat ${activeChatId}:`, error);
      }
    };

    updateActiveChat();
  }, [activeChatId]); // activeChatId is needed here

  // Create new chat
  const createNewChat = async () => {
    try {
      const newChat = await ChatService.createChatHistory();
      setChatHistories([newChat, ...chatHistories]);
      setActiveChat(newChat);
      setActiveChatId(newChat.id);
      return newChat;
    } catch (error) {
      console.error("Error creating new chat:", error);
      throw error;
    }
  };

  // Select a chat by ID
  const selectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    try {
      const selectedChat = await ChatService.getChatById(chatId);
      setActiveChat(selectedChat || null);
    } catch (error) {
      console.error(`Error selecting chat ${chatId}:`, error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    try {
      await ChatService.deleteChatHistory(chatId);
      const updatedHistories = chatHistories.filter(
        (chat) => chat.id !== chatId,
      );
      setChatHistories(updatedHistories);

      // If the active chat was deleted, set a new active chat
      if (activeChatId === chatId) {
        if (updatedHistories.length > 0) {
          const newActiveChat = updatedHistories[0];
          if (newActiveChat) {
            setActiveChat(newActiveChat);
            setActiveChatId(newActiveChat.id);
          }
        } else {
          setActiveChat(null);
          setActiveChatId(null);
        }
      }
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      throw error;
    }
  };

  const deleteAllChats = async () => {
    try {
      await ChatService.deleteAllChatHistories();
      setChatHistories([]);
      setActiveChat(null);
      setActiveChatId(null);
    } catch (error) {
      console.error(`Error deleting all chats:`, error);
      throw error;
    }
  };

  // Update chats after changes
  const refreshChats = async () => {
    try {
      const histories = await ChatService.getAllChatHistories();
      setChatHistories(histories);

      if (activeChatId) {
        const updatedChat = await ChatService.getChatById(activeChatId);
        setActiveChat(updatedChat || null);
      }
    } catch (error) {
      console.error("Error refreshing chats:", error);
    }
  };

  return {
    chatHistories,
    activeChat,
    activeChatId,
    isLoading,
    createNewChat,
    selectChat,
    deleteChat,
    deleteAllChats,
    refreshChats,
  };
};

export default useChats;
