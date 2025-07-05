import { NextRequest, NextResponse } from "next/server";
import {
  testOllamaEmbedding,
  createOllamaEmbeddingFunction,
} from "@/lib/ollama-embedding";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "test":
        const testText =
          searchParams.get("text") || "Hello, world! This is a test embedding.";

        console.log("Testing Ollama embedding with text:", testText);
        await testOllamaEmbedding(testText);

        return NextResponse.json({
          success: true,
          message: "Embedding test completed successfully",
          text: testText,
        });

      case "embedding":
        const text = searchParams.get("text");
        if (!text) {
          return NextResponse.json(
            { success: false, error: "Text parameter is required" },
            { status: 400 }
          );
        }

        const embeddingFunction = createOllamaEmbeddingFunction();
        const embeddings = await embeddingFunction.generate([text]);

        return NextResponse.json({
          success: true,
          text,
          embedding: embeddings[0],
          dimensions: embeddings[0].length,
          first5: embeddings[0].slice(0, 5),
        });

      case "batch":
        const textsParam = searchParams.get("texts");
        if (!textsParam) {
          return NextResponse.json(
            { success: false, error: "texts parameter is required" },
            { status: 400 }
          );
        }

        let texts: string[];
        try {
          texts = JSON.parse(textsParam);
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: "texts parameter must be valid JSON array",
            },
            { status: 400 }
          );
        }

        const batchEmbeddingFunction = createOllamaEmbeddingFunction();
        const batchEmbeddings = await batchEmbeddingFunction.generate(texts);

        return NextResponse.json({
          success: true,
          texts,
          embeddings: batchEmbeddings,
          count: batchEmbeddings.length,
          dimensions: batchEmbeddings[0]?.length || 0,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: test, embedding, or batch",
            availableActions: ["test", "embedding", "batch"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Embedding test error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, texts, text } = body;

    switch (action) {
      case "generate":
        if (!texts && !text) {
          return NextResponse.json(
            {
              success: false,
              error: "Either 'text' or 'texts' array is required",
            },
            { status: 400 }
          );
        }

        const inputTexts = text ? [text] : texts;
        const embeddingFunction = createOllamaEmbeddingFunction();
        const embeddings = await embeddingFunction.generate(inputTexts);

        return NextResponse.json({
          success: true,
          embeddings,
          count: embeddings.length,
          dimensions: embeddings[0]?.length || 0,
          inputTexts,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: generate",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Embedding generation error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
