import { performHealthCheck, suggestModelInstallation } from "@/lib/ai-health";

export async function GET() {
  try {
    const healthResult = await performHealthCheck();

    if (healthResult.status === "healthy") {
      return Response.json({
        ...healthResult,
        message: "All systems operational",
      });
    } else {
      const suggestions = await suggestModelInstallation();
      return Response.json(
        {
          ...healthResult,
          suggestions,
        },
        { status: healthResult.status === "partial" ? 206 : 500 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        suggestions: await suggestModelInstallation(),
      },
      { status: 500 }
    );
  }
}
