import { EmailContent, GmailMessagePart } from "@/types/gmail";

/**
 * Helper function to encode email headers containing non-ASCII characters
 * according to RFC 2047 MIME specification
 */
const encodeEmailHeader = (text: string): string => {
  // Only encode if the text contains non-ASCII characters
  if (/[^\x00-\x7F]/.test(text)) {
    // Use MIME Words encoding (RFC 2047)
    return "=?UTF-8?B?" + Buffer.from(text).toString("base64") + "?=";
  }
  return text;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const createEmailMessage = (validatedArgs: any): string => {
  const encodedSubject = encodeEmailHeader(validatedArgs.subject);

  (validatedArgs.to as string[]).forEach((email) => {
    if (!validateEmail(email)) {
      throw new Error(`Recipient email address is invalid: ${email}`);
    }
  });

  const emailParts = [
    "From: me",
    `To: ${validatedArgs.to.join(", ")}`,
    validatedArgs.cc ? `Cc: ${validatedArgs.cc.join(", ")}` : "",
    validatedArgs.bcc ? `Bcc: ${validatedArgs.bcc.join(", ")}` : "",
    `Subject: ${encodedSubject}`,
    // Add thread-related headers if specified
    validatedArgs.inReplyTo ? `In-Reply-To: ${validatedArgs.inReplyTo}` : "",
    validatedArgs.inReplyTo ? `References: ${validatedArgs.inReplyTo}` : "",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
  ].filter(Boolean);

  emailParts.push("");
  emailParts.push(validatedArgs.body);

  return emailParts.join("\r\n");
};

/**
 * Recursively extract email body content from MIME message parts
 * Handles complex email structures with nested parts
 */
export const extractEmailContent = (
  messagePart: GmailMessagePart,
): EmailContent => {
  // Initialize containers for different content types
  let textContent = "";
  let htmlContent = "";

  // If the part has a body with data, process it based on MIME type
  if (messagePart.body && messagePart.body.data) {
    const content = Buffer.from(messagePart.body.data, "base64").toString(
      "utf8",
    );

    // Store content based on its MIME type
    if (messagePart.mimeType === "text/plain") {
      textContent = content;
    } else if (messagePart.mimeType === "text/html") {
      htmlContent = content;
    }
  }

  // If the part has nested parts, recursively process them
  if (messagePart.parts && messagePart.parts.length > 0) {
    for (const part of messagePart.parts) {
      const { text, html } = extractEmailContent(part);
      if (text) textContent += text;
      if (html) htmlContent += html;
    }
  }

  // Return both plain text and HTML content
  return { text: textContent, html: htmlContent };
};
