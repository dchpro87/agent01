import { z } from "zod";

export const tools = {
  /** Get the current date and time */
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
  /** Calculate Body Mass Index (BMI) */
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
  /** Get current weather information for a location */
  getWeather: {
    description:
      "Get current weather information for a specified location. Returns temperature, weather conditions, humidity, and wind speed. This tool demonstrates API integration and provides real-world utility.",
    parameters: z.object({
      location: z
        .string()
        .describe(
          "The city name or location to get weather for (e.g., 'New York', 'London, UK', 'Tokyo, Japan')"
        ),
      units: z
        .enum(["metric", "imperial", "standard"])
        .optional()
        .default("metric")
        .describe(
          "Temperature units: 'metric' (Celsius), 'imperial' (Fahrenheit), or 'standard' (Kelvin)"
        ),
    }),
    execute: async ({
      location,
      units = "metric",
    }: {
      location: string;
      units?: "metric" | "imperial" | "standard";
    }) => {
      console.log("🔧 getWeather tool called with:", { location, units });

      try {
        // Note: In a real implementation, you'd use an actual weather API like OpenWeatherMap
        // For demonstration purposes, we'll simulate weather data

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate realistic mock weather data
        const temperatures = {
          metric: Math.round(Math.random() * 30 + 5), // 5-35°C
          imperial: Math.round(Math.random() * 54 + 41), // 41-95°F
          standard: Math.round(Math.random() * 30 + 278), // 278-308K
        };

        const conditions = [
          "Clear sky",
          "Few clouds",
          "Scattered clouds",
          "Broken clouds",
          "Light rain",
          "Moderate rain",
          "Thunderstorm",
          "Snow",
          "Mist",
          "Partly cloudy",
          "Overcast",
          "Drizzle",
        ];

        const condition =
          conditions[Math.floor(Math.random() * conditions.length)];
        const humidity = Math.round(Math.random() * 40 + 40); // 40-80%
        const windSpeed = Math.round(Math.random() * 15 + 2); // 2-17 km/h or mph
        const temperature = temperatures[units];

        // Determine temperature unit symbol
        const tempUnit =
          units === "metric" ? "°C" : units === "imperial" ? "°F" : "K";
        const speedUnit = units === "imperial" ? "mph" : "km/h";

        // Generate weather emoji based on condition
        const getWeatherEmoji = (condition: string) => {
          if (condition.includes("Clear")) return "☀️";
          if (condition.includes("cloud")) return "☁️";
          if (condition.includes("rain") || condition.includes("Drizzle"))
            return "🌧️";
          if (condition.includes("Thunder")) return "⛈️";
          if (condition.includes("Snow")) return "❄️";
          if (condition.includes("Mist")) return "🌫️";
          return "🌤️";
        };

        const emoji = getWeatherEmoji(condition);

        const result = `${emoji} Weather for ${location}:

🌡️ Temperature: ${temperature}${tempUnit}
🌤️ Conditions: ${condition}
💧 Humidity: ${humidity}%
💨 Wind Speed: ${windSpeed} ${speedUnit}

📍 Location: ${location}
⏰ Data retrieved: ${new Date().toLocaleString()}

Note: This is simulated weather data for demonstration purposes.
In a production environment, this would connect to a real weather API.`;

        console.log("🔧 getWeather tool result:", result);
        return result;
      } catch (error) {
        const errorResult = `Error getting weather data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log("🔧 getWeather tool error:", errorResult);
        return errorResult;
      }
    },
  },
};
