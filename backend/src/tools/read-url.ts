import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { sanitizeUrl } from "../utils/sanitize.js";
import { logger } from "../utils/logger.js";

const MAX_CONTENT_LENGTH = 5000;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetch a URL and extract its main text content using Readability.
 * Validates the URL for safety (no internal IPs, only http/https).
 */
export async function readUrl(url: string): Promise<string> {
  let safeUrl: string;
  try {
    safeUrl = await sanitizeUrl(url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid URL";
    return `Error: ${message}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(safeUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TaskAgent/1.0; +http://localhost)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return `Error: HTTP ${response.status} ${response.statusText}`;
    }

    const html = await response.text();

    const dom = new JSDOM(html, { url: safeUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return "Could not extract readable content from the page.";
    }

    const content = article.textContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CONTENT_LENGTH);

    return content;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown fetch error";
    logger.error({ err, url: safeUrl }, "URL fetch failed");
    return `Error fetching URL: ${message}`;
  }
}
