import { z } from "zod";

/** Get the current date and time */
export const getCurrentTime = {
  description:
    "Get the current date and time. Use this tool when the user asks about the current date, time, or any time-related information. After calling this tool, provide the answer directly to the user without additional thinking.",
  parameters: z.object({
    timezone: z
      .string()
      .optional()
      .describe(
        'The timezone to get the time for (e.g., "America/New_York", "Europe/London"). Leave empty for local time.'
      ),
  }),
  execute: async ({ timezone }: { timezone?: string }) => {
    console.log("🔧 getCurrentTime tool called with:", { timezone });
    try {
      const now = new Date();

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
        ...(timezone && { timeZone: timezone }),
      };
      const timeString = now.toLocaleString("en-US", options);

      const timezoneInfo = timezone ? ` in ${timezone}` : " (local time)";
      const result = `The current date and time${timezoneInfo} is: ${timeString}`;
      console.log("🔧 getCurrentTime tool result:", result);
      return result;
    } catch (error) {
      const errorResult = `Error getting time: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.log("🔧 getCurrentTime tool error:", errorResult);
      return errorResult;
    }
  },
};
