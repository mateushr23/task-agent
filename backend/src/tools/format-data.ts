/**
 * Pass-through formatting tool.
 * Returns the data with format instructions for the LLM to process
 * in the next conversation turn.
 */
export async function formatData(
  data: string,
  format: string
): Promise<string> {
  return `Data to format:\n${data}\n\nRequested format: ${format}`;
}
