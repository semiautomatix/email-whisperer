import { OAuth2Client, Credentials } from "google-auth-library";
import assert from "node:assert";

// Cache for OAuth2Client instances to avoid creating new ones for each request
const clientCache = new Map<string, OAuth2Client>();

/**
 * Creates or retrieves a cached OAuth2Client instance with token refresh handling
 *
 * @param userId The user ID to manage tokens for
 * @param onTokenRefresh Optional callback to handle refreshed tokens
 * @returns Configured OAuth2Client instance
 */
export function getOAuth2Client(
  userId: string,
  onTokenRefresh?: (credentials: Credentials) => Promise<void>,
): OAuth2Client {
  // Check if we already have a client for this user
  if (clientCache.has(userId)) {
    return clientCache.get(userId)!;
  }

  // Ensure required env vars are set
  assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID is not set");
  assert(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET is not set");

  // Create a new OAuth2Client
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // Redirect URI can be any valid URI for this use case since we're not doing auth flow
    // process.env.GOOGLE_REDIRECT_URI || "https://localhost",
  );

  // Set up token refresh callback to update database with new tokens
  oauth2Client.on("tokens", async (tokens) => {
    console.debug("Tokens refreshed by OAuth2Client");

    // Call custom token refresh handler if provided
    if (onTokenRefresh) {
      try {
        await onTokenRefresh(tokens);
      } catch (error) {
        console.error("Error in token refresh callback:", error);
      }
    }
  });

  // Store in cache for reuse
  clientCache.set(userId, oauth2Client);

  return oauth2Client;
}
