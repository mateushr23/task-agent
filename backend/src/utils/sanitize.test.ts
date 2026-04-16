import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeUrl, sanitizeInput } from "./sanitize.js";

// Mock dns.promises.lookup to avoid real DNS calls
vi.mock("dns", () => ({
  promises: {
    lookup: vi.fn(),
  },
}));

import { promises as dns } from "dns";
const mockLookup = vi.mocked(dns.lookup);

describe("sanitizeUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid HTTP URL", async () => {
    mockLookup.mockResolvedValue({ address: "93.184.216.34", family: 4 } as any);
    const result = await sanitizeUrl("http://example.com");
    expect(result).toBe("http://example.com/");
  });

  it("accepts a valid HTTPS URL", async () => {
    mockLookup.mockResolvedValue({ address: "93.184.216.34", family: 4 } as any);
    const result = await sanitizeUrl("https://example.com/path?q=1");
    expect(result).toBe("https://example.com/path?q=1");
  });

  it("blocks file:// protocol", async () => {
    await expect(sanitizeUrl("file:///etc/passwd")).rejects.toThrow(
      "Blocked protocol"
    );
  });

  it("blocks ftp:// protocol", async () => {
    await expect(sanitizeUrl("ftp://ftp.example.com")).rejects.toThrow(
      "Blocked protocol"
    );
  });

  it("blocks javascript: protocol", async () => {
    await expect(sanitizeUrl("javascript:alert(1)")).rejects.toThrow(
      /Invalid URL|Blocked protocol/
    );
  });

  it("blocks localhost", async () => {
    mockLookup.mockResolvedValue({ address: "127.0.0.1", family: 4 } as any);
    await expect(sanitizeUrl("http://localhost")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks 127.0.0.1", async () => {
    mockLookup.mockResolvedValue({ address: "127.0.0.1", family: 4 } as any);
    await expect(sanitizeUrl("http://127.0.0.1")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks private IP 10.x.x.x", async () => {
    mockLookup.mockResolvedValue({ address: "10.0.0.1", family: 4 } as any);
    await expect(sanitizeUrl("http://internal.corp")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks private IP 192.168.x.x", async () => {
    mockLookup.mockResolvedValue({ address: "192.168.1.1", family: 4 } as any);
    await expect(sanitizeUrl("http://router.local")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks private IP 172.16.x.x", async () => {
    mockLookup.mockResolvedValue({ address: "172.16.0.1", family: 4 } as any);
    await expect(sanitizeUrl("http://private.net")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks cloud metadata IP 169.254.169.254", async () => {
    mockLookup.mockResolvedValue({ address: "169.254.169.254", family: 4 } as any);
    await expect(sanitizeUrl("http://metadata.google")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("blocks IPv6 loopback ::1", async () => {
    mockLookup.mockResolvedValue({ address: "::1", family: 6 } as any);
    await expect(sanitizeUrl("http://ipv6host.test")).rejects.toThrow(
      "Blocked internal IP"
    );
  });

  it("trims whitespace from URL before parsing", async () => {
    mockLookup.mockResolvedValue({ address: "93.184.216.34", family: 4 } as any);
    const result = await sanitizeUrl("  https://example.com  ");
    expect(result).toBe("https://example.com/");
  });

  it("throws on completely invalid URL", async () => {
    await expect(sanitizeUrl("not-a-url")).rejects.toThrow("Invalid URL");
  });
});

describe("sanitizeInput", () => {
  it("trims whitespace from input", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });

  it("truncates input to default 2000 chars", () => {
    const longString = "a".repeat(3000);
    const result = sanitizeInput(longString);
    expect(result).toHaveLength(2000);
  });

  it("truncates to custom maxLength", () => {
    const result = sanitizeInput("abcdefghij", 5);
    expect(result).toBe("abcde");
  });

  it("returns the original string if under the limit", () => {
    expect(sanitizeInput("short")).toBe("short");
  });

  it("trims before truncating", () => {
    // 3 leading spaces + 2000 chars = 2003 total, trim first then slice
    const input = "   " + "b".repeat(2000);
    const result = sanitizeInput(input);
    expect(result).toHaveLength(2000);
    expect(result).toBe("b".repeat(2000));
  });
});
