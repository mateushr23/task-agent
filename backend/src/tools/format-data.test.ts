import { describe, it, expect } from "vitest";
import { formatData } from "./format-data.js";

describe("formatData", () => {
  it("returns data with format description", async () => {
    const result = await formatData("some data here", "json");
    expect(result).toContain("some data here");
    expect(result).toContain("json");
    expect(result).toContain("Data to format:");
    expect(result).toContain("Requested format:");
  });

  it("handles empty data", async () => {
    const result = await formatData("", "markdown");
    expect(result).toContain("Data to format:");
    expect(result).toContain("Requested format: markdown");
  });

  it("handles empty format", async () => {
    const result = await formatData("hello", "");
    expect(result).toContain("Data to format:");
    expect(result).toContain("hello");
    expect(result).toContain("Requested format: ");
  });
});
