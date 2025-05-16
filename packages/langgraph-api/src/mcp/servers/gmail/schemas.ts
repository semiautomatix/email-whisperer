import { z } from "zod";

// Schema definitions

// Schema definitions
export const SendEmailSchema = z.object({
  to: z.array(z.string()).describe("List of recipient email addresses"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body content"),
  cc: z.array(z.string()).optional().describe("List of CC recipients"),
  bcc: z.array(z.string()).optional().describe("List of BCC recipients"),
  threadId: z.string().optional().describe("Thread ID to reply to"),
  inReplyTo: z.string().optional().describe("Message ID being replied to"),
});

export const ReadEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to retrieve"),
});

export const SearchEmailsSchema = z.object({
  query: z
    .string()
    .describe("Gmail search query (e.g., 'from:example@gmail.com')"),
  maxResults: z
    .number()
    .optional()
    .describe("Maximum number of results to return"),
});

// Updated schema to include removeLabelIds
export const ModifyEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to modify"),
  labelIds: z
    .array(z.string())
    .optional()
    .describe("List of label IDs to apply"),
  addLabelIds: z
    .array(z.string())
    .optional()
    .describe("List of label IDs to add to the message"),
  removeLabelIds: z
    .array(z.string())
    .optional()
    .describe("List of label IDs to remove from the message"),
});

export const DeleteEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to delete"),
});

// New schema for listing email labels
export const ListEmailLabelsSchema = z
  .object({})
  .describe("Retrieves all available Gmail labels");

// Label management schemas
export const CreateLabelSchema = z
  .object({
    name: z.string().describe("Name for the new label"),
    messageListVisibility: z
      .enum(["show", "hide"])
      .optional()
      .describe("Whether to show or hide the label in the message list"),
    labelListVisibility: z
      .enum(["labelShow", "labelShowIfUnread", "labelHide"])
      .optional()
      .describe("Visibility of the label in the label list"),
  })
  .describe("Creates a new Gmail label");

export const UpdateLabelSchema = z
  .object({
    id: z.string().describe("ID of the label to update"),
    name: z.string().optional().describe("New name for the label"),
    messageListVisibility: z
      .enum(["show", "hide"])
      .optional()
      .describe("Whether to show or hide the label in the message list"),
    labelListVisibility: z
      .enum(["labelShow", "labelShowIfUnread", "labelHide"])
      .optional()
      .describe("Visibility of the label in the label list"),
  })
  .describe("Updates an existing Gmail label");

export const DeleteLabelSchema = z
  .object({
    id: z.string().describe("ID of the label to delete"),
  })
  .describe("Deletes a Gmail label");

export const GetOrCreateLabelSchema = z
  .object({
    name: z.string().describe("Name of the label to get or create"),
    messageListVisibility: z
      .enum(["show", "hide"])
      .optional()
      .describe("Whether to show or hide the label in the message list"),
    labelListVisibility: z
      .enum(["labelShow", "labelShowIfUnread", "labelHide"])
      .optional()
      .describe("Visibility of the label in the label list"),
  })
  .describe("Gets an existing label by name or creates it if it doesn't exist");

// Schemas for batch operations
export const BatchModifyEmailsSchema = z.object({
  messageIds: z.array(z.string()).describe("List of message IDs to modify"),
  addLabelIds: z
    .array(z.string())
    .optional()
    .describe("List of label IDs to add to all messages"),
  removeLabelIds: z
    .array(z.string())
    .optional()
    .describe("List of label IDs to remove from all messages"),
  batchSize: z
    .number()
    .optional()
    .default(50)
    .describe("Number of messages to process in each batch (default: 50)"),
});

export const BatchDeleteEmailsSchema = z.object({
  messageIds: z.array(z.string()).describe("List of message IDs to delete"),
  batchSize: z
    .number()
    .optional()
    .default(50)
    .describe("Number of messages to process in each batch (default: 50)"),
});
