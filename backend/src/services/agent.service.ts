import type Groq from "groq-sdk";
import { chatCompletion, TOOL_DEFINITIONS } from "./groq.service.js";
import type { SSEEmitter } from "./sse.service.js";
import { executeTool } from "../tools/index.js";
import { createStep, updateStepComplete, updateStepError } from "../db/queries/steps.js";
import { updateTaskStatus } from "../db/queries/tasks.js";
import { logger } from "../utils/logger.js";

const MAX_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are TaskAgent, an AI assistant that completes user tasks by executing tools.

IMPORTANT: You MUST use the provided tools (web_search, read_url, format_data) to complete tasks. Do NOT try to answer from memory alone — always use tools to gather real, current data.

Workflow:
1. Analyze the user's request
2. Use web_search to find relevant information
3. Use read_url if you need to read a specific page
4. Use format_data if you need to structure the output
5. When you have all the data, provide a final formatted response in markdown

Be thorough but concise. Always respond in the same language the user used.

IMPORTANT: Always use the provided function tools to search and gather data. Never generate information from memory — always verify with tools.`;

/**
 * Execute the full agentic loop for a task.
 * Streams progress via SSE and persists steps to the database.
 */
export async function executeAgentLoop(
  taskId: string,
  description: string,
  sseEmitter: SSEEmitter,
  signal?: AbortSignal
): Promise<void> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: description },
  ];

  let stepIndex = 0;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // Check if task was cancelled before each iteration
      if (signal?.aborted) {
        sseEmitter.emit("cancelled", {});
        await updateTaskStatus(taskId, "failed", undefined, "Cancelled by user");
        sseEmitter.emit("done", {});
        return;
      }

      const response = await chatCompletion(messages, TOOL_DEFINITIONS, signal);
      const choice = response.choices[0];

      if (!choice) {
        throw new Error("No response choices from Groq");
      }

      // Stream agent thinking when there's both content and tool_calls
      if (choice.message.content && choice.message.tool_calls?.length) {
        sseEmitter.emit("thinking", { content: choice.message.content });
      }

      // If no tool calls -> final response
      if (
        choice.finish_reason === "stop" ||
        !choice.message.tool_calls?.length
      ) {
        const finalResult = choice.message.content || "";
        sseEmitter.emit("result", { content: finalResult });
        await updateTaskStatus(taskId, "completed", finalResult);
        sseEmitter.emit("done", {});
        return;
      }

      // Add assistant message with tool_calls to conversation
      messages.push(choice.message);

      // Execute each tool call
      for (const toolCall of choice.message.tool_calls) {
        // Check if task was cancelled before each tool call
        if (signal?.aborted) {
          sseEmitter.emit("cancelled", {});
          await updateTaskStatus(taskId, "failed", undefined, "Cancelled by user");
          sseEmitter.emit("done", {});
          return;
        }

        stepIndex++;
        const { name, arguments: argsStr } = toolCall.function;
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(argsStr);
        } catch {
          args = {};
          logger.warn(
            { argsStr, tool: name },
            "Failed to parse tool call arguments"
          );
        }

        // Emit step:start
        sseEmitter.emit("step:start", {
          index: stepIndex,
          toolName: name,
          toolInput: args,
        });
        await createStep(taskId, stepIndex, name, args);

        const startTime = Date.now();
        try {
          const toolResult = await executeTool(name, args);
          const durationMs = Date.now() - startTime;

          sseEmitter.emit("step:complete", {
            index: stepIndex,
            result: toolResult.substring(0, 200),
            durationMs,
          });
          await updateStepComplete(taskId, stepIndex, toolResult, durationMs);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        } catch (error: unknown) {
          const durationMs = Date.now() - startTime;
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";

          sseEmitter.emit("step:error", {
            index: stepIndex,
            error: errorMsg,
          });
          await updateStepError(taskId, stepIndex, errorMsg);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: ${errorMsg}`,
          });
        }
      }
    }

    // Max iterations reached
    sseEmitter.emit("error", {
      message: "Agent reached maximum step limit (10 tool calls).",
    });
    await updateTaskStatus(taskId, "failed", undefined, "Max iterations reached");
    sseEmitter.emit("done", {});
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown agent error";
    const errorCode = (error as Record<string, unknown>)?.code || "UNKNOWN";

    logger.error({ err: error, taskId }, "Agent loop fatal error");

    if (errorCode === "RATE_LIMIT") {
      sseEmitter.emit("rate_limit", {
        message: errorMsg,
        retryAfter: (error as Record<string, unknown>)?.retryAfter || "",
      });
    } else {
      sseEmitter.emit("error", { message: errorMsg });
    }

    try {
      await updateTaskStatus(taskId, "failed", undefined, errorMsg);
    } catch (dbErr) {
      logger.error({ err: dbErr, taskId }, "Failed to persist task failure status");
    }
    sseEmitter.emit("done", {});
  }
}
