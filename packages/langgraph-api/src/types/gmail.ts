// Comprehensive TypeScript interfaces for Gmail API responses

/**
 * Gmail API Message Resource
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages#Message
 */
export interface GmailMessage {
  /** The immutable ID of the message. */
  id?: string;
  /** The ID of the thread the message belongs to. */
  threadId?: string;
  /** List of IDs of labels applied to this message. */
  labelIds?: string[];
  /** The parsed email structure in the message parts. */
  payload?: GmailMessagePayload;
  /** Estimated size in bytes of the message. */
  sizeEstimate?: number;
  /** The entire email message in an RFC 2822 formatted and base64url encoded string. */
  raw?: string;
  /** The internal message creation timestamp, which determines ordering in the inbox. */
  internalDate?: string;
  /** Email history ID. */
  historyId?: string;
}

/**
 * Gmail API Message Payload
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages#MessagePart
 */
export interface GmailMessagePayload {
  /** The MIME type of the message part. */
  mimeType?: string;
  /** The filename of the attachment (if any). */
  filename?: string;
  /** List of headers on this message part. */
  headers?: GmailHeader[];
  /** The message part body. */
  body?: GmailMessagePartBody;
  /** The child MIME message parts of this part. */
  parts?: GmailMessagePart[];
  /** The immutable ID of the message part. */
  partId?: string;
}

/**
 * Gmail API Message Part
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages#MessagePart
 */
export interface GmailMessagePart {
  /** The MIME type of the message part. */
  mimeType?: string;
  /** The filename of the attachment (if any). */
  filename?: string;
  /** List of headers on this message part. */
  headers?: GmailHeader[];
  /** The message part body. */
  body?: GmailMessagePartBody;
  /** The child MIME message parts of this part. */
  parts?: GmailMessagePart[];
  /** The immutable ID of the message part. */
  partId?: string;
}

/**
 * Gmail API Message Part Body
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages#MessagePartBody
 */
export interface GmailMessagePartBody {
  /** When present, contains the ID of the attachment. */
  attachmentId?: string;
  /** The body data of a MIME message part encoded with URL-safe Base64. */
  data?: string;
  /** Number of bytes for the message part data. */
  size?: number;
}

/**
 * Gmail API Header
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages#MessagePartHeader
 */
export interface GmailHeader {
  /** The name of the header. */
  name: string;
  /** The value of the header. */
  value: string;
}

/**
 * Gmail API Label
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.labels#Label
 */
export interface GmailLabel {
  /** The immutable ID of the label. */
  id: string;
  /** The display name of the label. */
  name: string;
  /** The type of label (system or user). */
  type?: "system" | "user";
  /** The visibility of the label in the message list. */
  messageListVisibility?: "show" | "hide";
  /** The visibility of the label in the label list. */
  labelListVisibility?: "labelShow" | "labelHide" | "labelShowIfUnread";
  /** The total number of messages with the label. */
  messagesTotal?: number;
  /** The number of unread messages with the label. */
  messagesUnread?: number;
  /** The total number of threads with the label. */
  threadsTotal?: number;
  /** The number of unread threads with the label. */
  threadsUnread?: number;
  /** The color settings of the label. */
  color?: {
    /** The text color of the label. */
    textColor?: string;
    /** The background color of the label. */
    backgroundColor?: string;
  };
}

/**
 * Gmail API Draft
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.drafts#Draft
 */
export interface GmailDraft {
  /** The immutable ID of the draft. */
  id?: string;
  /** The message content of the draft. */
  message?: GmailMessage;
}

/**
 * Gmail API List Messages Response
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list#response-body
 */
export interface GmailListMessagesResponse {
  /** List of messages. */
  messages?: Array<{ id?: string; threadId?: string }>;
  /** Token to retrieve the next page of results. */
  nextPageToken?: string;
  /** Estimated total number of results. */
  resultSizeEstimate?: number;
}

/**
 * Gmail API List Labels Response
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.labels/list#response-body
 */
export interface GmailListLabelsResponse {
  /** List of labels. */
  labels?: GmailLabel[];
}

/**
 * Gmail API List Threads Response
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.threads/list#response-body
 */
export interface GmailListThreadsResponse {
  /** List of threads. */
  threads?: Array<{ id?: string; snippet?: string; historyId?: string }>;
  /** Token to retrieve the next page of results. */
  nextPageToken?: string;
  /** Estimated total number of results. */
  resultSizeEstimate?: number;
}

/**
 * Gmail API Thread Resource
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.threads#Thread
 */
export interface GmailThread {
  /** The immutable ID of the thread. */
  id?: string;
  /** A short snippet of the thread. */
  snippet?: string;
  /** The ID to use for finding messages if history was requested. */
  historyId?: string;
  /** The list of messages in the thread. */
  messages?: GmailMessage[];
}

/**
 * Gmail API Email Attachment
 * Custom interface for working with attachments
 */
export interface EmailAttachment {
  /** The attachment ID. */
  id: string;
  /** The filename of the attachment. */
  filename: string;
  /** The MIME type of the attachment. */
  mimeType: string;
  /** The size of the attachment in bytes. */
  size: number;
}

/**
 * Gmail API Email Content
 * Custom interface for extracted email content
 */
export interface EmailContent {
  /** The plain text content of the email. */
  text: string;
  /** The HTML content of the email. */
  html: string;
}

/**
 * Gmail API History Resource
 * Reference: https://developers.google.com/gmail/api/reference/rest/v1/users.history#History
 */
export interface GmailHistory {
  /** The mailbox sequence ID. */
  id?: string;
  /** Messages added to the mailbox in this history record. */
  messagesAdded?: Array<{ message: GmailMessage }>;
  /** Messages deleted from the mailbox in this history record. */
  messagesDeleted?: Array<{ message: GmailMessage }>;
  /** Labels added to messages in this history record. */
  labelsAdded?: Array<{
    message: GmailMessage;
    labelIds: string[];
  }>;
  /** Labels removed from messages in this history record. */
  labelsRemoved?: Array<{
    message: GmailMessage;
    labelIds: string[];
  }>;
}
