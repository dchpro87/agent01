import { z } from "zod";

export const tools = {
  getCurrentTime: {
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
  },
  calculateBMI: {
    description:
      "Calculate Body Mass Index (BMI) based on height and weight. BMI is calculated as weight (kg) divided by height (m) squared. The result includes BMI value and category classification.",
    parameters: z.object({
      weight: z.number().positive().describe("Weight in kilograms (kg)"),
      height: z.number().positive().describe("Height in meters (m)"),
      unit: z
        .enum(["metric", "imperial"])
        .optional()
        .default("metric")
        .describe("Unit system: 'metric' for kg/m or 'imperial' for lbs/ft"),
    }),
    execute: async ({
      weight,
      height,
      unit = "metric",
    }: {
      weight: number;
      height: number;
      unit?: "metric" | "imperial";
    }) => {
      console.log("🔧 calculateBMI tool called with:", {
        weight,
        height,
        unit,
      });
      try {
        let weightKg = weight;
        let heightM = height;

        // Convert imperial units to metric if needed
        if (unit === "imperial") {
          weightKg = weight * 0.453592; // lbs to kg
          heightM = height * 0.3048; // ft to m
        }

        // Calculate BMI
        const bmi = weightKg / (heightM * heightM);
        const bmiRounded = Math.round(bmi * 10) / 10;

        // Determine BMI category
        let category: string;
        if (bmi < 18.5) {
          category = "Underweight";
        } else if (bmi < 25) {
          category = "Normal weight";
        } else if (bmi < 30) {
          category = "Overweight";
        } else {
          category = "Obese";
        }

        const result = `BMI Calculation Result:
- Weight: ${weight} ${unit === "imperial" ? "lbs" : "kg"}
- Height: ${height} ${unit === "imperial" ? "ft" : "m"}
- BMI: ${bmiRounded}
- Category: ${category}

BMI Categories:
- Underweight: < 18.5
- Normal weight: 18.5 - 24.9
- Overweight: 25 - 29.9
- Obese: ≥ 30`;

        console.log("🔧 calculateBMI tool result:", result);
        return result;
      } catch (error) {
        const errorResult = `Error calculating BMI: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log("🔧 calculateBMI tool error:", errorResult);
        return errorResult;
      }
    },
  },
};
