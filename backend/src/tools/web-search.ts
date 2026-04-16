import * as cheerio from "cheerio";
import { logger } from "../utils/logger.js";

const DDG_URL = "https://html.duckduckgo.com/html/";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 10000;

/**
 * Search the web via DuckDuckGo HTML.
 * Returns top 5 results with title, URL, and snippet.
 */
export async function webSearch(query: string): Promise<string> {
  if (!query.trim()) {
    return "Error: Search query cannot be empty.";
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(DDG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: new URLSearchParams({ q: query }).toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned status ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const results: { title: string; url: string; snippet: string }[] = [];

      $(".result").each((i, el) => {
        if (results.length >= 5) return false;

        const titleEl = $(el).find(".result__a");
        const snippetEl = $(el).find(".result__snippet");
        const urlEl = $(el).find(".result__url");

        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();

        // Extract real URL from DuckDuckGo redirect
        let url = titleEl.attr("href") || "";
        if (url.startsWith("//duckduckgo.com/l/?")) {
          try {
            const parsed = new URL("https:" + url);
            url = parsed.searchParams.get("uddg") || urlEl.text().trim();
          } catch {
            url = urlEl.text().trim();
          }
        }

        if (title) {
          results.push({ title, url, snippet });
        }
      });

      if (results.length === 0) {
        return "No search results found for: " + query;
      }

      const formatted = results
        .map((r) => `${r.title}\n${r.url}\n${r.snippet}`)
        .join("\n\n");

      return formatted;
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else {
        message = JSON.stringify(err);
      }

      logger.error({ err, attempt, query }, "Web search failed: %s", message);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      return `Error performing web search: ${message}`;
    }
  }

  return "Error: web search failed after retries";
}
