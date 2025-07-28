import { z } from "zod";
import { tool } from "ai";

/** Ask user for confirmation - example of a client-side interactive tool */
export const ask_for_confirmation = tool({
  description:
    "Ask the user for confirmation before performing a potentially sensitive action",
  parameters: z.object({
    message: z.string().describe("The message to ask for confirmation"),
    action: z
      .string()
      .describe("The action that will be performed if confirmed"),
  }),
  // Note: This tool doesn't have an execute function because it requires user interaction
  // It will be handled in the UI with addToolResult
});
