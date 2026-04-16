import { promises as dns } from "dns";

const BLOCKED_IP_RANGES = [
  /^127\./,                         // loopback
  /^10\./,                          // private class A
  /^172\.(1[6-9]|2\d|3[01])\./,    // private class B
  /^192\.168\./,                    // private class C
  /^169\.254\./,                    // link-local / cloud metadata
  /^0\./,                           // current network
  /^::1$/,                          // IPv6 loopback
  /^fe80:/i,                        // IPv6 link-local
  /^fc00:/i,                        // IPv6 unique local
  /^fd/i,                           // IPv6 unique local
];

/**
 * Validates a URL is safe to fetch — only http/https, no internal IPs.
 * Resolves the hostname via DNS and checks the resolved IP against a blocklist
 * to prevent SSRF bypasses (DNS rebinding, decimal/octal IPs, IPv6 shorthand).
 * Returns the sanitized URL string.
 * Throws on invalid or blocked URLs.
 */
export async function sanitizeUrl(url: string): Promise<string> {
  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid URL: ${trimmed}`);
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      `Blocked protocol: ${parsed.protocol} — only http and https are allowed`
    );
  }

  // Resolve hostname to IP to prevent SSRF bypasses
  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  const { address } = await dns.lookup(hostname);

  // Check resolved IP against blocklist
  for (const pattern of BLOCKED_IP_RANGES) {
    if (pattern.test(address)) {
      throw new Error(`Blocked internal IP: ${address}`);
    }
  }

  return parsed.href;
}

/**
 * Basic text sanitization: trim whitespace and limit length.
 */
export function sanitizeInput(text: string, maxLength = 2000): string {
  return text.trim().slice(0, maxLength);
}
