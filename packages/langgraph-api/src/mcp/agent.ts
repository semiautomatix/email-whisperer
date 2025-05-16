import assert from "node:assert";
import { supabaseAdminClient } from "../utils/supabase";
import { Database as NextAuthDatabase } from "../types/supabase/next_auth";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { initGmailMCPServer } from "./servers/gmail";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { registry as circuitRegistry } from "../utils/circuitBreaker";

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Email Whisperer.
You are a helpful assistant that can answer questions and help with tasks about Gmail.
You have access to a set of tools, use the tools as needed to answer the user's question.`;

// Configure circuit breakers
const CREDENTIALS_CIRCUIT = "credentials";
const LLM_CIRCUIT = "openai";
const GMAIL_CIRCUIT = "gmail";

// Initialize circuit breakers with appropriate settings
const initCircuitBreakers = () => {
  if (
    !circuitRegistry.get(CREDENTIALS_CIRCUIT, {
      failureThreshold: 3,
      resetTimeout: 10000, // 10 seconds
      monitorFunction: (state) =>
        console.log(`Credentials circuit state: ${state}`),
    })
  ) {
    console.debug("Initialized credentials circuit breaker");
  }

  if (
    !circuitRegistry.get(LLM_CIRCUIT, {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      monitorFunction: (state) => console.log(`LLM circuit state: ${state}`),
    })
  ) {
    console.debug("Initialized LLM circuit breaker");
  }

  if (
    !circuitRegistry.get(GMAIL_CIRCUIT, {
      failureThreshold: 4,
      resetTimeout: 20000, // 20 seconds
      monitorFunction: (state) => console.log(`Gmail circuit state: ${state}`),
    })
  ) {
    console.debug("Initialized Gmail circuit breaker");
  }
};

const getCredentials = async (userId: string, provider = "google") => {
  // Initialize circuit breakers if needed
  initCircuitBreakers();

  // Create protected version of the database query
  const credentialsCircuit = circuitRegistry.get(CREDENTIALS_CIRCUIT);

  // Wrap the database query with circuit breaker
  const getCredentialsProtected = credentialsCircuit.wrap(async () => {
    // get the Gmail access and refresh token from Supabase for the rls userId
    const { data: account } = await supabaseAdminClient
      .schema("next_auth") // Specify the schema this way
      .from("accounts")
      .select("*")
      .eq("userId", userId)
      .eq("provider", provider)
      .single<NextAuthDatabase["next_auth"]["Tables"]["accounts"]["Row"]>();

    assert(account, "Account data not found");

    const accessToken = account.access_token;
    const refreshToken = account.refresh_token;
    const expiresAt = Number(account.expires_at ?? 0);

    assert(accessToken, "Access token not found");
    assert(refreshToken, "Refresh token not found");

    // if token has expired, use refresh to get another
    if (expiresAt && expiresAt < Date.now()) {
      console.warn(
        "Token has expired, but refresh not implemented in getCredentials",
      );
      // TODO: Implement refresh logic here or use the refreshAccessToken function
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  });

  // Call the protected function
  return getCredentialsProtected();
};

interface AssistantParams {
  userId: string;
  message: string;
  contextMessages?: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
}

export const assistant = async ({
  userId,
  message,
  contextMessages,
}: AssistantParams) => {
  assert(process.env.OPENAI_API_KEY, "OPENAI_API_KEY not found");

  // Initialize circuit breakers
  initCircuitBreakers();

  // Get circuit breakers
  const llmCircuit = circuitRegistry.get(LLM_CIRCUIT);
  const gmailCircuit = circuitRegistry.get(GMAIL_CIRCUIT);

  // Create LLM with circuit breaker protection
  const createProtectedLLM = () => {
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Wrap the completion method with circuit breaker
    const originalCompletion = model.invoke.bind(model);
    model.invoke = llmCircuit.wrap(originalCompletion);

    return model;
  };

  try {
    console.debug("Loading MCP tools");

    // Create a pair of linked transports: one for the server, one for the client
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // Get credentials with circuit breaker protection (already implemented in the function)
    const credentials = await getCredentials(userId);

    // Protect Gmail server connection with circuit breaker
    const initGmailServerProtected = gmailCircuit.wrap(async () => {
      const GmailMCPServer = await initGmailMCPServer(credentials);
      await GmailMCPServer.connect(serverTransport);
      return GmailMCPServer;
    });

    // Initialize Gmail server with protection
    await initGmailServerProtected();

    // Client connection doesn't need circuit breaker as it's in-memory
    const client = new Client({ name: "MyClient", version: "1.0.0" });
    await client.connect(clientTransport);

    // Tool loading protected with Gmail circuit breaker
    const loadToolsProtected = gmailCircuit.wrap(async () => {
      return await loadMcpTools("gmail", client);
    });

    const tools = await loadToolsProtected();

    // Create agent with protected LLM
    const agent = createReactAgent({
      llm: createProtectedLLM(),
      tools,
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    });

    // Prepare messages array, including context if provided
    const messages = contextMessages || [];

    // Add the current message
    messages.push({
      role: "user",
      content: message,
    });

    // Protect agent invocation with LLM circuit breaker
    const invokeAgentProtected = llmCircuit.wrap(async () => {
      return await agent.invoke({
        messages,
      });
    });

    const result = await invokeAgentProtected();

    console.debug("Agent invocation completed successfully");
    return result.messages;
  } catch (error) {
    console.error("Error in assistant function:", error);

    // Categorize errors for better user feedback
    let errorMessage =
      "I'm sorry, I encountered an issue connecting to Gmail. Please try again in a moment.";

    const { message } = error as unknown as Error;

    if (message?.includes("rate limit") || message?.includes("timeout")) {
      errorMessage =
        "I'm experiencing high demand right now. Please try again in a few moments.";
    } else if (
      message?.includes("authorization") ||
      message?.includes("Authentication")
    ) {
      errorMessage =
        "I need permission to access your Gmail. Please sign in again.";
    } else if (message?.includes("Circuit is open")) {
      errorMessage =
        "The service is currently unavailable. It should be back shortly. Please try again in a few minutes.";
    }

    // Return a fallback message when the agent fails
    return [
      {
        role: "assistant",
        content: errorMessage,
      },
    ];
  }
  // Don't close the client here - we're using a cached client approach
  // This avoids the overhead of creating a new connection for each request
};
