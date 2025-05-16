// A LangGraph-compatible MCP tool implementation of the Gmail agent
import assert from "node:assert";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { google } from "googleapis";
import { OAuth2Client, Credentials } from "google-auth-library";
import {
  SendEmailSchema,
  ReadEmailSchema,
  SearchEmailsSchema,
  ModifyEmailSchema,
  DeleteEmailSchema,
  // ListEmailLabelsSchema,
  CreateLabelSchema,
  UpdateLabelSchema,
  DeleteLabelSchema,
  GetOrCreateLabelSchema,
  BatchModifyEmailsSchema,
  BatchDeleteEmailsSchema,
} from "./schemas";
import { createEmailMessage, extractEmailContent } from "./utils";
import {
  // listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getOrCreateLabel,
  // GmailLabel,
} from "./labels";
import { GmailMessagePart } from "@/types/gmail";

interface InitGmailMCPServerParams {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const initGmailMCPServer = async ({
  accessToken,
  refreshToken,
  expiresAt,
}: InitGmailMCPServerParams) => {
  assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID is not set");
  assert(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET is not set");

  const oauth2Client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });

  const credentials: Credentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt,
  };

  oauth2Client.setCredentials(credentials);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const GmailMCPServer = new McpServer({
    name: "gmail",
    version: "1.0.0",
  });

  // Add email tools
  GmailMCPServer.tool(
    "send_email",
    "Send an email using Gmail API",
    SendEmailSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = SendEmailSchema.parse(args);
        const message = createEmailMessage(validatedArgs);
        const raw = Buffer.from(message).toString("base64url");

        // Include threadId if specified
        const requestBody: { raw: string; threadId?: string } = { raw };
        if (validatedArgs.threadId) {
          requestBody.threadId = validatedArgs.threadId;
        }

        const res = await gmail.users.messages.send({
          userId: "me",
          requestBody,
        });
        return {
          content: [{ type: "text", text: `Email sent: ${res.data.id}` }],
        };
      } catch (error) {
        console.error("Error sending email:", error);
        throw error;
      }
    },
  );

  // Implement draft_email tool
  GmailMCPServer.tool(
    "draft_email",
    "Create a draft email using Gmail API",
    SendEmailSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = SendEmailSchema.parse(args);
        const message = createEmailMessage(validatedArgs);
        const raw = Buffer.from(message).toString("base64url");

        // Create draft message request
        const messageRequest: { raw: string; threadId?: string } = { raw };
        if (validatedArgs.threadId) {
          messageRequest.threadId = validatedArgs.threadId;
        }

        const response = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: messageRequest,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Email draft created successfully with ID: ${response.data.id}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error creating draft email:", error);
        throw error;
      }
    },
  );

  // Implement read_email tool
  GmailMCPServer.tool(
    "read_email",
    "Read an email's details using Gmail API",
    ReadEmailSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = ReadEmailSchema.parse(args);
        const response = await gmail.users.messages.get({
          userId: "me",
          id: validatedArgs.messageId,
          format: "full",
        });

        const headers = response.data.payload?.headers || [];
        const subject =
          headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
        const from =
          headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
        const to =
          headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";
        const date =
          headers.find((h) => h.name?.toLowerCase() === "date")?.value || "";
        const threadId = response.data.threadId || "";

        // Extract email content using the recursive function
        const { text, html } = extractEmailContent(
          (response.data.payload as GmailMessagePart) || {},
        );

        // Use plain text content if available, otherwise use HTML content
        const body = text || html || "";

        // If we only have HTML content, add a note for the user
        const contentTypeNote =
          !text && html
            ? "[Note: This email is HTML-formatted. Plain text version not available.]\n\n"
            : "";

        // Get attachment information
        const attachments: {
          id: string;
          filename: string;
          mimeType: string;
          size: number;
        }[] = [];
        const processAttachmentParts = (
          part: GmailMessagePart,
          path: string = "",
        ) => {
          if (part.body && part.body.attachmentId) {
            const filename =
              part.filename || `attachment-${part.body.attachmentId}`;
            attachments.push({
              id: part.body.attachmentId,
              filename: filename,
              mimeType: part.mimeType || "application/octet-stream",
              size: part.body.size || 0,
            });
          }

          if (part.parts) {
            part.parts.forEach((subpart: GmailMessagePart) =>
              processAttachmentParts(subpart, `${path}/parts`),
            );
          }
        };

        if (response.data.payload) {
          processAttachmentParts(response.data.payload as GmailMessagePart);
        }

        // Add attachment info to output if any are present
        const attachmentInfo =
          attachments.length > 0
            ? `\n\nAttachments (${attachments.length}):\n` +
              attachments
                .map(
                  (a) =>
                    `- ${a.filename} (${a.mimeType}, ${Math.round(a.size / 1024)} KB)`,
                )
                .join("\n")
            : "";

        return {
          content: [
            {
              type: "text",
              text: `Thread ID: ${threadId}\nSubject: ${subject}\nFrom: ${from}\nTo: ${to}\nDate: ${date}\n\n${contentTypeNote}${body}${attachmentInfo}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error reading email:", error);
        throw error;
      }
    },
  );

  // Implement search_emails tool
  GmailMCPServer.tool(
    "search_emails",
    "Search for emails using Gmail API",
    SearchEmailsSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = SearchEmailsSchema.parse(args);
        const response = await gmail.users.messages.list({
          userId: "me",
          q: validatedArgs.query,
          maxResults: validatedArgs.maxResults || 10,
        });

        const messages = response.data.messages || [];
        const results = await Promise.all(
          messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: msg.id!,
              format: "metadata",
              metadataHeaders: ["Subject", "From", "Date"],
            });
            const headers = detail.data.payload?.headers || [];
            return {
              id: msg.id,
              subject: headers.find((h) => h.name === "Subject")?.value || "",
              from: headers.find((h) => h.name === "From")?.value || "",
              date: headers.find((h) => h.name === "Date")?.value || "",
            };
          }),
        );

        return {
          content: [
            {
              type: "text",
              text: results
                .map(
                  (r) =>
                    `ID: ${r.id}\nSubject: ${r.subject}\nFrom: ${r.from}\nDate: ${r.date}\n`,
                )
                .join("\n"),
            },
          ],
        };
      } catch (error) {
        console.error("Error searching emails:", error);
        throw error;
      }
    },
  );

  // Implement modify_email tool
  GmailMCPServer.tool(
    "modify_email",
    "Modify email labels using Gmail API",
    ModifyEmailSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = ModifyEmailSchema.parse(args);

        // Prepare request body
        const requestBody: {
          addLabelIds?: string[];
          removeLabelIds?: string[];
        } = {};

        if (validatedArgs.labelIds) {
          requestBody.addLabelIds = validatedArgs.labelIds;
        }

        if (validatedArgs.addLabelIds) {
          requestBody.addLabelIds = validatedArgs.addLabelIds;
        }

        if (validatedArgs.removeLabelIds) {
          requestBody.removeLabelIds = validatedArgs.removeLabelIds;
        }

        await gmail.users.messages.modify({
          userId: "me",
          id: validatedArgs.messageId,
          requestBody: requestBody,
        });

        return {
          content: [
            {
              type: "text",
              text: `Email ${validatedArgs.messageId} labels updated successfully`,
            },
          ],
        };
      } catch (error) {
        console.error("Error modifying email:", error);
        throw error;
      }
    },
  );

  // Implement delete_email tool
  GmailMCPServer.tool(
    "delete_email",
    "Delete an email using Gmail API",
    DeleteEmailSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = DeleteEmailSchema.parse(args);
        await gmail.users.messages.delete({
          userId: "me",
          id: validatedArgs.messageId,
        });

        return {
          content: [
            {
              type: "text",
              text: `Email ${validatedArgs.messageId} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        console.error("Error deleting email:", error);
        throw error;
      }
    },
  );

  // Implement list_email_labels tool
  // GmailMCPServer.tool(
  //   "list_email_labels",
  //   "List all email labels using Gmail API",
  //   ListEmailLabelsSchema.shape,
  //   async () => {
  //     try {
  //       const labelResults = await listLabels(gmail);
  //       const systemLabels = labelResults.system;
  //       const userLabels = labelResults.user;

  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text:
  //               `Found ${labelResults.count.total} labels (${labelResults.count.system} system, ${labelResults.count.user} user):\n\n` +
  //               "System Labels:\n" +
  //               systemLabels
  //                 .map((l: GmailLabel) => `ID: ${l.id}\nName: ${l.name}\n`)
  //                 .join("\n") +
  //               "\nUser Labels:\n" +
  //               userLabels
  //                 .map((l: GmailLabel) => `ID: ${l.id}\nName: ${l.name}\n`)
  //                 .join("\n"),
  //           },
  //         ],
  //       };
  //     } catch (error) {
  //       console.error("Error listing email labels:", error);
  //       throw error;
  //     }
  //   }
  // );

  // Implement create_label tool
  GmailMCPServer.tool(
    "create_label",
    "Create a new label using Gmail API",
    CreateLabelSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = CreateLabelSchema.parse(args);
        const result = await createLabel(gmail, validatedArgs.name, {
          messageListVisibility: validatedArgs.messageListVisibility,
          labelListVisibility: validatedArgs.labelListVisibility,
        });

        return {
          content: [
            {
              type: "text",
              text: `Label created successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error creating label:", error);
        throw error;
      }
    },
  );

  // Implement update_label tool
  GmailMCPServer.tool(
    "update_label",
    "Update an existing label using Gmail API",
    UpdateLabelSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = UpdateLabelSchema.parse(args);

        // Prepare request body with only the fields that were provided
        const updates: {
          name?: string;
          messageListVisibility?: string;
          labelListVisibility?: string;
        } = {};
        if (validatedArgs.name) updates.name = validatedArgs.name;
        if (validatedArgs.messageListVisibility)
          updates.messageListVisibility = validatedArgs.messageListVisibility;
        if (validatedArgs.labelListVisibility)
          updates.labelListVisibility = validatedArgs.labelListVisibility;

        const result = await updateLabel(gmail, validatedArgs.id, updates);

        return {
          content: [
            {
              type: "text",
              text: `Label updated successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error updating label:", error);
        throw error;
      }
    },
  );

  // Implement delete_label tool
  GmailMCPServer.tool(
    "delete_label",
    "Delete a label using Gmail API",
    DeleteLabelSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = DeleteLabelSchema.parse(args);
        const result = await deleteLabel(gmail, validatedArgs.id);

        return {
          content: [
            {
              type: "text",
              text: result.message,
            },
          ],
        };
      } catch (error) {
        console.error("Error deleting label:", error);
        throw error;
      }
    },
  );

  // Implement get_or_create_label tool
  GmailMCPServer.tool(
    "get_or_create_label",
    "Get an existing label by name or create it if it doesn't exist",
    GetOrCreateLabelSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = GetOrCreateLabelSchema.parse(args);
        const result = await getOrCreateLabel(gmail, validatedArgs.name, {
          messageListVisibility: validatedArgs.messageListVisibility,
          labelListVisibility: validatedArgs.labelListVisibility,
        });

        const action =
          result.type === "user" && result.name === validatedArgs.name
            ? "found existing"
            : "created new";

        return {
          content: [
            {
              type: "text",
              text: `Successfully ${action} label:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error getting or creating label:", error);
        throw error;
      }
    },
  );

  // Helper function to process operations in batches
  async function processBatches<T, U>(
    items: T[],
    batchSize: number,
    processFn: (batch: T[]) => Promise<U[]>,
  ): Promise<{ successes: U[]; failures: { item: T; error: Error }[] }> {
    const successes: U[] = [];
    const failures: { item: T; error: Error }[] = [];

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        const results = await processFn(batch);
        successes.push(...results);
      } catch {
        // If batch fails, try individual items
        for (const item of batch) {
          try {
            const result = await processFn([item]);
            successes.push(...result);
          } catch (itemError) {
            failures.push({ item, error: itemError as Error });
          }
        }
      }
    }

    return { successes, failures };
  }

  // Implement batch_modify_emails tool
  GmailMCPServer.tool(
    "batch_modify_emails",
    "Modify labels for multiple emails using Gmail API",
    BatchModifyEmailsSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = BatchModifyEmailsSchema.parse(args);
        const messageIds = validatedArgs.messageIds;
        const batchSize = validatedArgs.batchSize || 50;

        // Prepare request body
        const requestBody: {
          addLabelIds?: string[];
          removeLabelIds?: string[];
        } = {};

        if (validatedArgs.addLabelIds) {
          requestBody.addLabelIds = validatedArgs.addLabelIds;
        }

        if (validatedArgs.removeLabelIds) {
          requestBody.removeLabelIds = validatedArgs.removeLabelIds;
        }

        // Process messages in batches
        const { successes, failures } = await processBatches(
          messageIds,
          batchSize,
          async (batch) => {
            const results = await Promise.all(
              batch.map(async (messageId) => {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: messageId,
                  requestBody: requestBody,
                });
                return { messageId, success: true };
              }),
            );
            return results;
          },
        );

        // Generate summary of the operation
        const successCount = successes.length;
        const failureCount = failures.length;

        let resultText = `Batch label modification complete.\n`;
        resultText += `Successfully processed: ${successCount} messages\n`;

        if (failureCount > 0) {
          resultText += `Failed to process: ${failureCount} messages\n\n`;
          resultText += `Failed message IDs:\n`;
          resultText += failures
            .map(
              (f) =>
                `- ${(f.item as string).substring(0, 16)}... (${f.error.message})`,
            )
            .join("\n");
        }

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        console.error("Error batch modifying emails:", error);
        throw error;
      }
    },
  );

  // Implement batch_delete_emails tool
  GmailMCPServer.tool(
    "batch_delete_emails",
    "Delete multiple emails using Gmail API",
    BatchDeleteEmailsSchema.shape,
    async (args: any) => {
      try {
        const validatedArgs = BatchDeleteEmailsSchema.parse(args);
        const messageIds = validatedArgs.messageIds;
        const batchSize = validatedArgs.batchSize || 50;

        // Process messages in batches
        const { successes, failures } = await processBatches(
          messageIds,
          batchSize,
          async (batch) => {
            const results = await Promise.all(
              batch.map(async (messageId) => {
                await gmail.users.messages.delete({
                  userId: "me",
                  id: messageId,
                });
                return { messageId, success: true };
              }),
            );
            return results;
          },
        );

        // Generate summary of the operation
        const successCount = successes.length;
        const failureCount = failures.length;

        let resultText = `Batch delete operation complete.\n`;
        resultText += `Successfully deleted: ${successCount} messages\n`;

        if (failureCount > 0) {
          resultText += `Failed to delete: ${failureCount} messages\n\n`;
          resultText += `Failed message IDs:\n`;
          resultText += failures
            .map(
              (f) =>
                `- ${(f.item as string).substring(0, 16)}... (${f.error.message})`,
            )
            .join("\n");
        }

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        console.error("Error batch deleting emails:", error);
        throw error;
      }
    },
  );

  return GmailMCPServer;
};
