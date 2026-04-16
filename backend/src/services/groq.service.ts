import Groq from "groq-sdk";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { ToolDefinition } from "../types/index.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

/**
 * Tool definitions in OpenAI function calling format for the agent loop.
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web using DuckDuckGo. Returns top 5 results with title, URL, and snippet.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description:
        "Fetch a URL and extract the main text content. Returns up to 5000 characters of readable text.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to fetch and extract content from",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "format_data",
      description:
        "Format raw data into a structured format (markdown table, list, JSON, etc).",
      parameters: {
        type: "object",
        properties: {
          data: {
            type: "string",
            description: "The raw data to format",
          },
          format: {
            type: "string",
            description:
              "Desired output format: markdown_table, bullet_list, numbered_list, json, csv",
          },
        },
        required: ["data", "format"],
      },
    },
  },
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Call Groq chat completion with retry on rate-limit (429) and tool_use_failed (400).
 * Exponential backoff: 1s, 2s, 4s.
 * On tool_use_failed, retries once with lower temperature (0.1).
 */
export async function chatCompletion(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  tools: ToolDefinition[]
): Promise<Groq.Chat.ChatCompletion> {
  let temperature = 0.3;
  let toolUseRetried = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        messages,
        tools: tools.length > 0 ? (tools as Groq.Chat.ChatCompletionTool[]) : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        parallel_tool_calls: tools.length > 0 ? false : undefined,
        temperature,
        max_tokens: 4096,
      });
      return response;
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Groq.RateLimitError ||
        (err instanceof Error && "status" in err && (err as { status: number }).status === 429);

      const isToolUseFailed =
        err instanceof Error &&
        "status" in err &&
        (err as { status: number }).status === 400 &&
        (err as { error?: { code?: string } }).error?.code === "tool_use_failed";

      if (isToolUseFailed && !toolUseRetried) {
        toolUseRetried = true;
        temperature = 0.1;
        logger.warn(
          { attempt: attempt + 1 },
          "Groq tool_use_failed, retrying with lower temperature"
        );
        await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS));
        continue;
      }

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(
          { attempt: attempt + 1, delay },
          "Groq rate limited, retrying"
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Max retries exceeded for Groq API");
}
