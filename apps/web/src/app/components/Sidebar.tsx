import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ChatHistory } from "@/app/services/chat";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { PlusCircle, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

interface SidebarProps {
  chats: ChatHistory[];
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  className?: string;
  isOpen: boolean;
}

const Sidebar = ({
  chats,
  activeChatId,
  onChatSelect,
  onNewChat,
  className,
  isOpen,
  onDeleteChat,
}: SidebarProps) => {
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleDeleteChat = async (chatId: string) => {
    try {
      await onDeleteChat(chatId);
      setChatToDelete(null);

      // If the deleted chat was active, create a new one
      if (chatId === activeChatId) {
        onNewChat();
      }
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "h-full border-r border-brand-sand-light bg-sidebar flex flex-col",
        className,
      )}
    >
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 bg-brand-teal hover:bg-brand-teal-dark text-white"
          variant="secondary"
        >
          <PlusCircle size={16} />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 sidebar-container">
        <div className="px-3 py-2">
          <h3 className="text-xs font-display font-semibold text-muted-foreground mb-2 px-2">
            Chat History
          </h3>

          {chats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="flex justify-center mb-2 text-muted-foreground">
                <MessageSquare size={40} />
              </div>
              <p className="text-sm text-muted-foreground">
                No chat history yet. Start a new conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "flex items-center justify-between px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-sidebar-accent group",
                    chat.id === activeChatId && "bg-sidebar-accent",
                  )}
                  onClick={(e) => {
                    // Prevent click if delete button was clicked
                    if ((e.target as HTMLElement).closest("button")) return;
                    onChatSelect(chat.id);
                  }}
                >
                  <div className="truncate flex-1">
                    <div className="font-sans font-medium truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(chat.updatedAt)} • {chat.messages.length}{" "}
                      messages
                    </div>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog
                          open={chatToDelete === chat.id}
                          onOpenChange={(open: boolean) =>
                            !open && setChatToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 h-8 w-8"
                              onClick={() => setChatToDelete(chat.id)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this chat? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteChat(chat.id)}
                                className="bg-brand-teal hover:bg-brand-teal-dark"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete chat</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 text-xs text-center text-muted-foreground border-t border-brand-sand-light">
        <p>Email Whisperer</p>
        <p>All chat history stored locally</p>
      </div>
    </div>
  );
};

export default Sidebar;
