import { cn } from "@/app/lib/utils";
import { memo } from "react";
import { Message } from "@/app/services/chat";
import { Mail, User } from "lucide-react";
import { useAuth } from "@/app/hooks/use-auth";

interface MessageItemProps {
  message: Message;
}

const MessageItem = memo(({ message }: MessageItemProps) => {
  const { user } = useAuth();
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mb-4 last:mb-6">
      <div
        className={cn(
          "flex items-start gap-3",
          message.isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {message.isUser ? (
          user?.imageUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden mt-1 flex-shrink-0 border border-brand-teal-light">
              <img
                src={user.imageUrl}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 bg-brand-teal-dark text-white">
              <User className="h-4 w-4" />
            </div>
          )
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 bg-brand-sand-light border border-brand-sand">
            <Mail className="h-4 w-4 text-brand-teal" />
          </div>
        )}

        <div
          className={cn(
            "chat-message relative rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border",
            message.isUser
              ? "bg-brand-teal text-white border-brand-teal-dark rounded-tr-none"
              : "bg-brand-sand-light border-brand-sand rounded-tl-none",
          )}
        >
          <div className="flex flex-col">
            <div className="mb-1 text-xs font-medium opacity-80 flex items-center gap-1">
              {message.isUser ? "You" : "Email Whisperer"}
              <span className="inline-block mx-1 opacity-50">•</span>
              {formatTime(message.timestamp)}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;
