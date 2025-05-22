"use client";

import Header from "@/app/components/Header";
import LazyLoadedSidebar from "@/app/components/LazyLoadedSidebar";
import ChatInterface from "@/app/components/ChatInterface";
import { useState } from "react";
import { useIsMobile } from "@/app/hooks/use-mobile";
import useChats from "@/app/hooks/use-chats";
import { toast } from "sonner";
import { LoadingIndicator } from "@/app/components/ui/feedback";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import ErrorRecoveryUI from "@/app/components/ErrorRecoveryUI";

export default function DashboardContent() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Use the chat hook
  const {
    chatHistories,
    activeChat,
    activeChatId,
    isLoading,
    createNewChat,
    selectChat,
    deleteChat,
    refreshChats,
  } = useChats();

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle new chat with mobile UI consideration
  const handleNewChat = async () => {
    try {
      await createNewChat();
      toast.success("New chat created");
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  // Handle chat selection with mobile UI consideration
  const handleChatSelect = async (chatId: string) => {
    try {
      await selectChat(chatId);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
      toast.error("Failed to select chat");
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden w-full bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center w-full relative">
            <div className="absolute inset-0 bg-privacy-pattern opacity-10 dark:opacity-5"></div>
            <div className="absolute top-20 right-10 w-64 h-64 bg-brand-teal/10 dark:bg-brand-teal/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-sand/20 dark:bg-brand-sand/10 rounded-full blur-3xl"></div>
            <div className="text-center relative z-10 bg-white/80 dark:bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-brand-sand-light dark:border-border shadow-mindful">
              <LoadingIndicator size="large" />
              <p className="text-muted-foreground mt-4">
                Loading your chats...
              </p>
            </div>
          </div>
        ) : (
          <>
            <LazyLoadedSidebar
              chats={chatHistories}
              activeChatId={activeChatId}
              onChatSelect={handleChatSelect}
              onNewChat={handleNewChat}
              onDeleteChat={deleteChat}
              className={
                isMobile
                  ? "fixed z-40 w-72 h-[calc(100vh-61px)] shadow-lg"
                  : "w-72"
              }
              isOpen={isSidebarOpen}
            />

            {isMobile && isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <div className="flex-1 overflow-hidden relative z-0">
              <ErrorBoundary
                fallback={
                  <ErrorRecoveryUI
                    message="There was an error displaying the chat interface. Please try again or start a new chat."
                    resetError={() => refreshChats()}
                  />
                }
              >
                <ChatInterface
                  activeChat={activeChat}
                  onChatUpdate={refreshChats}
                  createNewChat={createNewChat}
                />
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
