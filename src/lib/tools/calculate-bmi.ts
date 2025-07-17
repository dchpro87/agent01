import { z } from "zod";

/** Calculate Body Mass Index (BMI) */
export const calculateBMI = {
  description:
    "Calculate Body Mass Index (BMI) based on height and weight. BMI is calculated as weight (kg) divided by height (m) squared. The result includes BMI value and category classification. After calculation, provide a clear explanation of the results to the user.",
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
};
