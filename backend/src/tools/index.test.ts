import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the tool modules before importing the dispatcher
vi.mock("./web-search.js", () => ({
  webSearch: vi.fn(),
}));
vi.mock("./read-url.js", () => ({
  readUrl: vi.fn(),
}));
vi.mock("./format-data.js", () => ({
  formatData: vi.fn(),
}));
vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { executeTool } from "./index.js";
import { webSearch } from "./web-search.js";
import { readUrl } from "./read-url.js";
import { formatData } from "./format-data.js";

const mockWebSearch = vi.mocked(webSearch);
const mockReadUrl = vi.mocked(readUrl);
const mockFormatData = vi.mocked(formatData);

describe("executeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches web_search to webSearch", async () => {
    mockWebSearch.mockResolvedValue("search results");
    const result = await executeTool("web_search", { query: "test query" });
    expect(result).toBe("search results");
    expect(mockWebSearch).toHaveBeenCalledWith("test query");
  });

  it("dispatches read_url to readUrl", async () => {
    mockReadUrl.mockResolvedValue("page content");
    const result = await executeTool("read_url", { url: "https://example.com" });
    expect(result).toBe("page content");
    expect(mockReadUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("dispatches format_data to formatData", async () => {
    mockFormatData.mockResolvedValue("formatted output");
    const result = await executeTool("format_data", {
      data: "raw data",
      format: "json",
    });
    expect(result).toBe("formatted output");
    expect(mockFormatData).toHaveBeenCalledWith("raw data", "json");
  });

  it("uses default format 'markdown' when format not provided", async () => {
    mockFormatData.mockResolvedValue("formatted");
    await executeTool("format_data", { data: "raw" });
    expect(mockFormatData).toHaveBeenCalledWith("raw", "markdown");
  });

  it("returns error for unknown tool", async () => {
    const result = await executeTool("nonexistent_tool", {});
    expect(result).toContain('Error: Unknown tool "nonexistent_tool"');
    expect(result).toContain("Available tools:");
    expect(result).toContain("web_search");
    expect(result).toContain("read_url");
    expect(result).toContain("format_data");
  });

  it("handles tool execution error gracefully", async () => {
    mockWebSearch.mockRejectedValue(new Error("Network failure"));
    const result = await executeTool("web_search", { query: "test" });
    expect(result).toContain("Error executing web_search");
    expect(result).toContain("Network failure");
  });

  it("handles tool timeout", async () => {
    // Create a mock that never resolves within the timeout
    mockWebSearch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve("late"), 30_000))
    );
    const result = await executeTool("web_search", { query: "slow" });
    expect(result).toContain("Error executing web_search");
    expect(result).toContain("timed out");
  }, 20_000);

  it("converts non-string args to strings", async () => {
    mockWebSearch.mockResolvedValue("ok");
    await executeTool("web_search", { query: 123 as any });
    expect(mockWebSearch).toHaveBeenCalledWith("123");
  });

  it("uses empty string when args are missing", async () => {
    mockWebSearch.mockResolvedValue("ok");
    await executeTool("web_search", {});
    expect(mockWebSearch).toHaveBeenCalledWith("");
  });
});
