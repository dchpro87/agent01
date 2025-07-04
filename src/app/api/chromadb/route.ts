import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

let client: ChromaClient | null = null;
const baseUrl = "http://localhost:8000";

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: baseUrl,
    });
  }
  return client;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "connect":
        const chromaClient = await getClient();
        const version = await chromaClient.version();
        return NextResponse.json({
          success: true,
          connected: true,
          version,
          message: "Connected to ChromaDB",
        });

      case "health":
        try {
          const response = await fetch(`${baseUrl}/api/v1/heartbeat`);
          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              status: "healthy",
              details: data,
            });
          } else {
            return NextResponse.json({
              success: false,
              status: "unhealthy",
              details: `HTTP ${response.status}`,
            });
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            status: "error",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }

      case "collections":
        const chromaClientForCollections = await getClient();
        const collections = await chromaClientForCollections.listCollections();
        return NextResponse.json({
          success: true,
          collections,
        });

      case "disconnect":
        client = null;
        return NextResponse.json({
          success: true,
          connected: false,
          message: "Disconnected from ChromaDB",
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Use: connect, health, collections, or disconnect",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("ChromaDB API error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "test":
        if (!client) {
          return NextResponse.json({
            success: false,
            connected: false,
            error: "Not connected to ChromaDB",
          });
        }

        await client.version();
        return NextResponse.json({
          success: true,
          connected: true,
          message: "Connection test successful",
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
