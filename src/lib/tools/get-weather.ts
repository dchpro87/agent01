import { z } from "zod";

/** Get current weather information for a location */
export const getWeather = {
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
};
