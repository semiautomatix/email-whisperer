"use client";

import { lazy, Suspense, useState, useEffect } from "react";
import { ChatHistory } from "@/app/services/chat";

// Dynamically import the Sidebar component
const Sidebar = lazy(() => import("./Sidebar"));

// Loading placeholder that matches the basic structure of the sidebar
const SidebarPlaceholder = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;

  return (
    <div className="h-full border-r border-brand-sand-light bg-sidebar flex flex-col animate-pulse">
      <div className="p-4">
        <div className="w-full h-10 bg-brand-sand/50 rounded-md"></div>
      </div>
      <div className="flex-1 px-3 py-2">
        <div className="h-4 w-32 bg-brand-sand/30 rounded mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-brand-sand/20 rounded-md"></div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-brand-sand-light">
        <div className="h-8 bg-brand-sand/30 rounded"></div>
      </div>
    </div>
  );
};

interface LazyLoadedSidebarProps {
  chats: ChatHistory[];
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  className?: string;
  isOpen: boolean;
}

const LazyLoadedSidebar = (props: LazyLoadedSidebarProps) => {
  const [isClientSide, setIsClientSide] = useState(false);

  // Only render on client side to prevent hydration issues
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  if (!isClientSide) {
    return <SidebarPlaceholder isOpen={props.isOpen} />;
  }

  return (
    <Suspense fallback={<SidebarPlaceholder isOpen={props.isOpen} />}>
      <Sidebar {...props} />
    </Suspense>
  );
};

export default LazyLoadedSidebar;
