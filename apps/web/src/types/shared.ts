// shared.ts - Common type definitions used across components

import { ChatHistory } from "@/app/services/chat";

/**
 * Common UI component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Auth related types
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  hasGmailAccess?: boolean;
}

/**
 * Chat related types
 */
export interface ChatComponentProps extends BaseComponentProps {
  chat?: ChatHistory;
  isLoading?: boolean;
  onUpdate?: (chat: ChatHistory) => void;
}

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface SendMessageOptions {
  appendToHistory?: boolean;
  updateChatTitle?: boolean;
}

/**
 * State management types
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

// Generic operation result type
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Form and input related types
 */
export interface FormField<T = string> {
  id: string;
  label: string;
  value: T;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
  read?: boolean;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Email related shared types
 */
export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}
