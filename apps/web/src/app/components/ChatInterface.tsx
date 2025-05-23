"use client";

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Send, ArrowDown, Mail } from "lucide-react";
import MessageItem from "./MessageItem";
import { ChatHistory, ChatService } from "@/app/services/chat";
import { trpc } from "@/app/trpc/utils";
import { trimMessagesToTokenLimit } from "@/utils/tokenCounter";
import { debounce } from "lodash";
import { useAuth } from "@/app/hooks/use-auth";

interface ChatInterfaceProps {
  activeChat: ChatHistory | null;
  onChatUpdate: () => void;
  createNewChat?: () => Promise<ChatHistory>;
}

const ChatInterface = ({
  activeChat,
  onChatUpdate,
  createNewChat,
}: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const { isPending, mutateAsync } = trpc.chat.getResponse.useMutation();

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      const scrollContainer = scrollViewportRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, []);

  // Check if we're near bottom
  const checkIfNearBottom = useCallback(() => {
    if (!scrollViewportRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    // If within 100px of bottom, consider it "near bottom"
    return scrollHeight - scrollTop - clientHeight <= 100;
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    setShowScrollButton(!checkIfNearBottom());
  }, [checkIfNearBottom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeChat?.messages?.length) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [activeChat?.messages, activeChat?.messages?.length, scrollToBottom]);

  // Scroll to bottom when chat is initially loaded
  useEffect(() => {
    if (activeChat?.id && activeChat?.messages?.length) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [activeChat?.id, activeChat?.messages?.length, scrollToBottom]);

  // Store function reference in a ref to use with debounce
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !activeChat || isProcessing || !user?.id) return;

    setIsProcessing(true);

    try {
      if (!user?.id) {
        throw new Error("User not logged in");
      }
      
      // Add user message
      await ChatService.addMessageToChat(user.id, activeChat.id, message, true);
      setMessage("");
      onChatUpdate();

      // Get all messages from the current chat for context
      const chatWithHistory = await ChatService.getChatById(user.id, activeChat.id);

      // Convert and trim messages to fit token limit
      const contextualizedHistory = await trimMessagesToTokenLimit(
        chatWithHistory?.messages || [],
        4000, // max tokens
        500, // reserved for response
      );

      // Get AI response with context from previous messages
      const result = await mutateAsync({
        message,
        contextMessages: contextualizedHistory,
      });

      if (result?.response && user?.id) {
        await ChatService.addMessageToChat(
          user.id,
          activeChat.id,
          (result?.response ?? "").toString(),
          false,
        );
        onChatUpdate();
      }
    } catch (error) {
      console.error("Error in chat flow:", error);
      try {
        if (user?.id) {
          await ChatService.addMessageToChat(
            user.id,
            activeChat.id,
            "Sorry, I encountered an error. Please try again.",
            false,
          );
          onChatUpdate();
        }
      } catch (e) {
        console.error("Error adding error message to chat:", e);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [message, activeChat, isProcessing, onChatUpdate, mutateAsync]);

  // Create debounced version of send message function to prevent rapid firing
  const debouncedSendMessage = useMemo(
    () =>
      debounce(() => {
        handleSendMessage();
      }, 300),
    [handleSendMessage],
  );

  // Cleanup effect for debounced function
  useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        debouncedSendMessage();
      }
    },
    [debouncedSendMessage],
  );

  // Make a ref to pass to child component
  const debouncedSendMessageRef = useRef(debouncedSendMessage);

  useEffect(() => {
    debouncedSendMessageRef.current = debouncedSendMessage;
  }, [debouncedSendMessage]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-privacy-pattern opacity-10"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-sand/20 rounded-full blur-3xl"></div>
      {!activeChat ? (
        <div className="flex items-center justify-center h-full relative">
          <div className="text-center max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-brand-sand-light shadow-mindful">
            <div className="p-3 bg-brand-sand/30 rounded-full mx-auto mb-6 w-fit">
              <div className="p-2 bg-brand-sand/50 rounded-full">
                <Mail className="h-8 w-8 text-brand-teal" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              Welcome to Email Whisperer
            </h2>
            <p className="text-muted-foreground mb-6 font-sans max-w-sm mx-auto">
              Your AI-powered assistant for analyzing and responding to emails.
              All conversations are stored locally for maximum privacy.
            </p>
            <Button
              onClick={() => createNewChat?.()}
              className="bg-brand-teal hover:bg-brand-teal-dark px-6"
            >
              Start a New Chat
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex-1 p-4 chat-container relative overflow-auto z-10"
            aria-label="Chat messages"
            role="log"
            aria-live="polite"
            ref={scrollViewportRef}
            onScroll={handleScroll}
          >
            <div className="max-w-3xl mx-auto">
              {activeChat.messages.length === 0 ? (
                <EmptyChat />
              ) : (
                /* Use React.memo to prevent unnecessary re-renders of message items */
                activeChat.messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))
              )}
              {isPending && <ThinkingIndicator />}
            </div>
            {showScrollButton && (
              <Button
                onClick={() => scrollToBottom()}
                size="icon"
                className="fixed bottom-35 right-6 rounded-full bg-brand-teal hover:bg-brand-teal-dark shadow-mindful hover:shadow-lg transition-all duration-300 z-50"
                aria-label="Scroll to bottom"
                title="Scroll to the bottom of the conversation"
              >
                <ArrowDown
                  size={18}
                  className="animate-bounce-subtle text-white"
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>

          <ChatInput
            message={message}
            setMessage={setMessage}
            textareaRef={textareaRef}
            handleKeyDown={handleKeyDown}
            adjustTextareaHeight={adjustTextareaHeight}
            isProcessing={isProcessing}
            sendMessageRef={debouncedSendMessageRef}
          />
        </>
      )}
    </div>
  );
};

// Memoized sub-components to prevent unnecessary re-renders
const EmptyChat = memo(() => (
  <div className="text-center py-16 px-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-brand-sand-light shadow-mindful mx-4 my-8">
    <div className="p-3 bg-brand-sand/30 rounded-full mx-auto mb-6 w-fit">
      <div className="p-2 bg-brand-sand/50 rounded-full">
        <Mail className="h-6 w-6 text-brand-teal" />
      </div>
    </div>
    <h3 className="text-2xl font-display font-semibold mb-4">
      Start the conversation
    </h3>
    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
      Hello! I can help analyze your emails and suggest appropriate responses
      while keeping your data private. What can I help you with today?
    </p>
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-sand text-brand-teal-dark">
      <Mail className="h-3 w-3" /> Privacy-Focused Design
    </div>
  </div>
));

const ThinkingIndicator = memo(() => (
  <div className="flex items-center gap-2 my-4 py-2 px-4 bg-white/80 rounded-xl border border-brand-sand-light">
    <div className="h-2 w-2 bg-brand-teal/60 rounded-full animate-pulse"></div>
    <div className="h-2 w-2 bg-brand-teal/60 rounded-full animation-delay-200 animate-pulse"></div>
    <div className="h-2 w-2 bg-brand-teal/60 rounded-full animation-delay-500 animate-pulse"></div>
    <span className="ml-2 text-sm font-medium text-muted-foreground">
      Email Whisperer is thinking...
    </span>
  </div>
));

const ChatInput = memo(
  ({
    message,
    setMessage,
    textareaRef,
    handleKeyDown,
    adjustTextareaHeight,
    isProcessing,
    sendMessageRef,
  }: {
    message: string;
    setMessage: (message: string) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    adjustTextareaHeight: () => void;
    isProcessing: boolean;
    sendMessageRef: React.RefObject<() => void>;
  }) => (
    <div className="border-t border-brand-sand-light p-4 bg-white/80 backdrop-blur-sm relative z-10">
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message or paste an email..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[50px] max-h-[150px] pr-12 border-brand-sand rounded-xl focus:border-brand-teal focus:ring-brand-teal shadow-sm"
            disabled={isProcessing}
            aria-label="Message input"
            aria-multiline="true"
            aria-required="true"
            aria-describedby="message-instructions"
          />
          <Button
            onClick={() => sendMessageRef.current && sendMessageRef.current()}
            disabled={!message.trim() || isProcessing}
            size="icon"
            className="absolute right-2 bottom-2 bg-brand-teal hover:bg-brand-teal-dark rounded-lg shadow-sm"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
      <div
        className="flex items-center justify-center gap-1.5 mt-3 text-xs text-center text-muted-foreground"
        id="message-instructions"
      >
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        Private and secure: Your conversations are stored locally in your
        browser.
      </div>
    </div>
  ),
);

// Add displayNames for memoized components
EmptyChat.displayName = "EmptyChat";
ThinkingIndicator.displayName = "ThinkingIndicator";
ChatInput.displayName = "ChatInput";

export default memo(ChatInterface);
