import { useState, useEffect } from "react";
import { ChatHistory, ChatService } from "@/app/services/chat";
import { useAuth } from "@/app/hooks/use-auth";

export const useChats = () => {
  const { user } = useAuth();
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<ChatHistory | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all chat histories once when component mounts or user changes
  useEffect(() => {
    const loadChats = async () => {
      // Don't try to load chats if there's no user
      if (!user?.id) {
        setChatHistories([]);
        setActiveChat(null);
        setActiveChatId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const histories = await ChatService.getAllChatHistories(user.id);
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
    // This effect should run when the user changes
  }, [user, activeChatId]);

  // Separate effect to handle activeChatId changes
  useEffect(() => {
    // Only fetch the specific chat when activeChatId changes and is not null
    const updateActiveChat = async () => {
      if (!activeChatId || !user?.id) return;

      try {
        const selectedChat = await ChatService.getChatById(user.id, activeChatId);
        setActiveChat(selectedChat || null);
      } catch (error) {
        console.error(`Error selecting chat ${activeChatId}:`, error);
      }
    };

    updateActiveChat();
  }, [activeChatId, user]); // user is needed here too

  // Create new chat
  const createNewChat = async () => {
    if (!user?.id) {
      throw new Error("Cannot create chat: No user is logged in");
    }
    
    try {
      const newChat = await ChatService.createChatHistory(user.id);
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
    if (!user?.id) return;
    
    setActiveChatId(chatId);
    try {
      const selectedChat = await ChatService.getChatById(user.id, chatId);
      setActiveChat(selectedChat || null);
    } catch (error) {
      console.error(`Error selecting chat ${chatId}:`, error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    if (!user?.id) {
      throw new Error("Cannot delete chat: No user is logged in");
    }
    
    try {
      await ChatService.deleteChatHistory(user.id, chatId);
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
    if (!user?.id) {
      throw new Error("Cannot delete all chats: No user is logged in");
    }
    
    try {
      await ChatService.deleteAllChatHistories(user.id);
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
    if (!user?.id) return;
    
    try {
      const histories = await ChatService.getAllChatHistories(user.id);
      setChatHistories(histories);

      if (activeChatId) {
        const updatedChat = await ChatService.getChatById(user.id, activeChatId);
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
