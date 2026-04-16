import { webSearch } from "./web-search.js";
import { readUrl } from "./read-url.js";
import { formatData } from "./format-data.js";
import { logger } from "../utils/logger.js";

type ToolExecutor = (args: Record<string, unknown>) => Promise<string>;

const TOOL_TIMEOUT_MS = 15_000;

const toolRegistry: Record<string, ToolExecutor> = {
  web_search: async (args) => {
    const query = String(args.query || "");
    return webSearch(query);
  },
  read_url: async (args) => {
    const url = String(args.url || "");
    return readUrl(url);
  },
  format_data: async (args) => {
    const data = String(args.data || "");
    const format = String(args.format || "markdown");
    return formatData(data, format);
  },
};

/**
 * Execute a tool by name with a timeout wrapper.
 * Returns result string on success, error string on failure (never throws).
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const executor = toolRegistry[name];
  if (!executor) {
    return `Error: Unknown tool "${name}". Available tools: ${Object.keys(toolRegistry).join(", ")}`;
  }

  try {
    const result = await Promise.race([
      executor(args),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Tool execution timed out")), TOOL_TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown tool error";
    logger.error({ err, tool: name, args }, "Tool execution failed");
    return `Error executing ${name}: ${message}`;
  }
}
