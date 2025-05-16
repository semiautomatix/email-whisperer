"use server";

import assert from "@/utils/assert";
import { supabaseAdminClient } from "@/utils/supabase";

interface RefreshTokenParams {
  providerAccountId: number;
  refreshToken: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Refresh an OAuth access token with comprehensive error handling and retries
 *
 * @param params - Token refresh parameters
 * @returns Updated token information or error
 */
export async function refreshAccessToken(params: RefreshTokenParams) {
  console.debug("Refresh Access Token");

  let retries = 0;
  let lastError: unknown;

  while (retries < MAX_RETRIES) {
    try {
      assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID is not set");
      assert(
        process.env.GOOGLE_CLIENT_SECRET,
        "GOOGLE_CLIENT_SECRET is not set",
      );

      // Use timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: params.refreshToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const refreshedTokens = await response.json();

      // Check for specific OAuth error types
      if (!response.ok) {
        const errorMessage = refreshedTokens.error || "Unknown error";

        // Handle specific error cases
        if (refreshedTokens.error === "invalid_grant") {
          console.error("Refresh token is invalid or has been revoked");
          // Don't retry for invalid_grant errors
          return {
            ...params,
            error: "InvalidRefreshTokenError",
            errorDetails: refreshedTokens,
          };
        }

        throw new Error(`OAuth error: ${errorMessage}`);
      }

      // Validate the response contains the required fields
      if (!refreshedTokens.access_token || !refreshedTokens.expires_in) {
        throw new Error("Invalid response format from OAuth server");
      }

      // Calculate the new expiration time
      const expiresAt = Math.floor(
        Date.now() / 1000 + refreshedTokens.expires_in,
      );

      // Update Supabase with the new tokens
      const { error: supabaseError } = await supabaseAdminClient
        .from("accounts")
        .update({
          access_token: refreshedTokens.access_token,
          expires_at: expiresAt,
          refresh_token: refreshedTokens.refresh_token ?? params.refreshToken,
          updated_at: new Date().toISOString(),
        })
        .eq("provider", "google")
        .eq("providerAccountId", params.providerAccountId);

      if (supabaseError) {
        console.error("Database update failed:", supabaseError);
        throw new Error(`Database update failed: ${supabaseError.message}`);
      }

      console.debug("Token refresh successful");

      // Return the new token information
      return {
        ...params,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        refreshToken: refreshedTokens.refresh_token ?? params.refreshToken,
      };
    } catch (error) {
      lastError = error;
      console.error(`Token refresh attempt ${retries + 1} failed:`, error);

      // Handle network errors differently - they are more likely to be transient
      if (
        error instanceof TypeError ||
        (error as TypeError).name === "AbortError"
      ) {
        retries++;
        if (retries < MAX_RETRIES) {
          console.debug(`Retrying in ${RETRY_DELAY_MS}ms...`);
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * retries),
          );
          continue;
        }
      } else {
        // For other types of errors, don't retry
        break;
      }
    }
  }

  // If we've reached here, all retries failed
  console.error("All token refresh attempts failed", lastError);

  return {
    ...params,
    error: "RefreshAccessTokenError",
    errorDetails: lastError,
    retried: retries > 0,
  };
}
